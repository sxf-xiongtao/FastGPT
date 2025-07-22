import { MongoDatasetTraining } from '@fastgpt/service/core/dataset/training/schema';
import { TrainingModeEnum } from '@fastgpt/global/core/dataset/constants';
import { createChatCompletion } from '@fastgpt/service/core/ai/config';
import type { ChatCompletionMessageParam } from '@fastgpt/global/core/ai/type.d';
import { addLog } from '@fastgpt/service/common/system/log';
import { getImageIndexPrompt } from '@/global/core/ai/prompt/training';
import { getVlmModel } from '@fastgpt/service/core/ai/model';
import { checkTeamAiPointsAndLock } from './utils';
import { addMinutes } from 'date-fns';
import {
  countGptMessagesTokens,
  countPromptTokens
} from '@fastgpt/service/common/string/tiktoken/index';
import { ChatCompletionRequestMessageRoleEnum } from '@fastgpt/global/core/ai/constants';
import { loadRequestMessages } from '@fastgpt/service/core/chat/utils';
import { llmCompletionsBodyFormat, formatLLMResponse } from '@fastgpt/service/core/ai/utils';
import { getImageBase64 } from '@fastgpt/service/common/file/image/utils';
import { DatasetDataIndexTypeEnum } from '@fastgpt/global/core/dataset/data/constants';
import { pushLLMTrainingUsage } from '@fastgpt/service/support/wallet/usage/controller';
import { delay } from '@fastgpt/global/common/system/utils';
import { getErrText } from '@fastgpt/global/common/error/utils';

const reduceQueue = () => {
  global.imageParseQueueLen = global.imageParseQueueLen > 0 ? global.imageParseQueueLen - 1 : 0;

  return global.imageParseQueueLen === 0;
};

const matchAndParseTextImageUrl = async (text: string) => {
  // 匹配 ![](xxx)的图片格式，提取出 url 和位置信息
  const regex = /!\[(.*?)\]\((.*?)\)/g;
  const matches = Array.from(text.matchAll(regex));

  type MessageContent =
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string }; originalUrl: string };

  const messages: MessageContent[] = [];
  let lastIndex = 0;

  if (matches.length === 0) {
    messages.push({
      type: 'text',
      text: text
    });
    return messages;
  }

  for (const match of matches) {
    const matchIndex = match.index || 0;
    const url = match[2];

    if (!url) continue;

    // Add text content before the image (if any)
    const textBefore = text.slice(lastIndex, matchIndex).trim();
    if (textBefore) {
      messages.push({
        type: 'text',
        text: textBefore
      });
    }

    try {
      const { completeBase64: base64 } = await getImageBase64(url);
      messages.push({
        type: 'image_url',
        image_url: {
          url: base64
        },
        originalUrl: url // Store the original URL
      });
    } catch (error) {
      // If image loading fails, treat it as text
      messages.push({
        type: 'text',
        text: match[0] // Keep the original markdown format
      });
    }

    lastIndex = matchIndex + match[0].length;
  }

  // Add remaining text after the last image (if any)
  const remainingText = text.slice(lastIndex).trim();
  if (remainingText) {
    messages.push({
      type: 'text',
      text: remainingText
    });
  }

  return messages;
};

const formatImageParseResult = (result: string) => {
  const summaryMatch = result.match(/<Summary>([\s\S]*?)<\/Summary>/i);
  const summary = summaryMatch ? summaryMatch[1].trim() : result;

  // Extract content inside all Chunk tags
  const chunkMatches = result.match(/<Chunk>([\s\S]*?)<\/Chunk>/gi);
  const chunks = chunkMatches
    ? chunkMatches.map((match) => {
        const content = match.match(/<Chunk>([\s\S]*?)<\/Chunk>/i);
        return content ? content[1].trim() : '';
      })
    : [];

  return {
    summary,
    chunks
  };
};

export async function generateImageIndex(): Promise<any> {
  if (global.licenseData?.functions?.datasetEnhance === false) {
    await MongoDatasetTraining.updateMany(
      {
        mode: TrainingModeEnum.image
      },
      {
        $set: {
          mode: TrainingModeEnum.chunk
        }
      }
    );
    return;
  }

  addLog.debug(`[Image index queue] Size: ${global.imageParseQueueLen}`);

  const max = global.systemEnv?.vlmMaxProcess || 10;
  if (global.imageParseQueueLen >= max) return;
  global.imageParseQueueLen++;

  while (true) {
    // get training data
    const {
      data,
      text,
      done = false,
      error = false
    } = await (async () => {
      try {
        const data = await MongoDatasetTraining.findOneAndUpdate(
          {
            mode: TrainingModeEnum.image,
            retryCount: { $gte: -10 },
            lockTime: { $lte: addMinutes(new Date(), -10) }
          },
          {
            lockTime: new Date(),
            $inc: { retryCount: -1 }
          }
        )
          .populate<{
            dataset: { vectorModel: string; agentModel: string; vlmModel: string };
            collection: { autoIndexes?: boolean };
          }>([
            {
              path: 'dataset',
              select: 'vectorModel agentModel vlmModel'
            },
            {
              path: 'collection',
              select: 'autoIndexes'
            }
          ])
          .lean();

        // task preemption
        if (!data) {
          return {
            done: true
          };
        }
        return {
          data,
          text: data.q
        };
      } catch (error) {
        return {
          error: true
        };
      }
    })();

    if (done || !data) {
      break;
    }
    if (error) {
      addLog.error(`[Image index queue] Error`, error);
      await delay(500);
      continue;
    }

    if (!data.dataset || !data.collection) {
      addLog.info(`[Image index queue] Dataset or collection not found`, data);
      // Delete data
      await MongoDatasetTraining.deleteOne({ _id: data._id });
      continue;
    }

    const nextMode = data.collection.autoIndexes ? TrainingModeEnum.auto : TrainingModeEnum.chunk;
    const updateImageQueueToChunkQueue = async () => {
      await MongoDatasetTraining.updateOne(
        { _id: data._id },
        {
          $set: {
            mode: nextMode,
            lockTime: new Date('2000/1/1'),
            retryCount: 5
          }
        }
      );
    };

    // Auth balance
    if (!(await checkTeamAiPointsAndLock(data.teamId))) {
      continue;
    }
    // If retryCount is 0, then update to chunk queue
    if (data.retryCount <= 0) {
      await updateImageQueueToChunkQueue();
      continue;
    }
    // Get model and check
    const modelData = getVlmModel(data.dataset.vlmModel);
    if (!modelData) {
      addLog.warn(`[Image index queue] Model not found: ${data.dataset.vlmModel}`);
      await updateImageQueueToChunkQueue();
      continue;
    }

    addLog.info(`[Image index queue] Start`);

    try {
      const startTime = Date.now();

      // 1. Match text image url
      const contentMessages = await matchAndParseTextImageUrl(text);

      // Check if there are any images
      const hasImages = contentMessages.some((msg) => msg.type === 'image_url');
      if (!hasImages) {
        addLog.debug(`[Image index queue] No image url found: ${data._id}`);
        await updateImageQueueToChunkQueue();
        continue;
      }

      // 2. request VLM to get image annotation
      const messages: ChatCompletionMessageParam[] = [
        {
          role: ChatCompletionRequestMessageRoleEnum.System,
          content: getImageIndexPrompt()
        },
        {
          role: ChatCompletionRequestMessageRoleEnum.User,
          content: contentMessages
        }
      ];
      const { response: chatResponse } = await createChatCompletion({
        body: llmCompletionsBodyFormat(
          {
            model: modelData.model,
            temperature: 0.3,
            messages: await loadRequestMessages({ messages, useVision: true }),
            stream: true
          },
          modelData
        )
      });
      const { text: answer, usage } = await formatLLMResponse(chatResponse);
      const { summary, chunks } = formatImageParseResult(answer);

      const inputTokens = usage?.prompt_tokens || (await countGptMessagesTokens(messages));
      const outputTokens = usage?.completion_tokens || (await countPromptTokens(answer));

      // 3. Concat indexes
      const indexes = data.indexes.concat({
        text: summary,
        type: DatasetDataIndexTypeEnum.image
      });

      addLog.info(`[Image index queue] Finish: ${(Date.now() - startTime) / 1000}s`);

      // 4. Update training data to chunk queue
      const imageUrls = contentMessages
        .map((msg) => (msg.type === 'image_url' ? msg.originalUrl : ''))
        .filter(Boolean); // Use original URL instead of base64
      await MongoDatasetTraining.updateOne(
        { _id: data._id },
        {
          $set: {
            imageDescMap: chunks.reduce(
              (acc, chunk, index) => {
                if (chunk.length > 10000) return acc;
                if (imageUrls[index]) {
                  acc[imageUrls[index]] = chunk;
                }
                return acc;
              },
              {} as Record<string, string>
            ),
            mode: nextMode,
            lockTime: new Date('2000/1/1'),
            retryCount: 5,
            indexes
          }
        }
      );

      // 5. Add usage
      pushLLMTrainingUsage({
        teamId: data.teamId,
        tmbId: data.tmbId,
        inputTokens,
        outputTokens,
        billId: data.billId,
        model: modelData.model,
        mode: 'imageIndex'
      });
    } catch (err: any) {
      addLog.error(`[Image index queue] Error`, err);

      await MongoDatasetTraining.updateOne(
        {
          _id: data._id
        },
        {
          errorMsg: getErrText(err, 'Image index error')
        }
      );

      await delay(100);
    }
  }

  if (reduceQueue()) {
    addLog.info(`[Image index queue] Done`);
  }
  addLog.debug(`[Image index queue] break loop, current queue size: ${global.imageParseQueueLen}`);
}
