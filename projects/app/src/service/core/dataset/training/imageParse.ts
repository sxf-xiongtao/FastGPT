import { MongoDatasetTraining } from '@fastgpt/service/core/dataset/training/schema';
import { pushImageParseUsage } from '@/service/support/wallet/usage/push';
import { TrainingModeEnum } from '@fastgpt/global/core/dataset/constants';
import { createChatCompletion } from '@fastgpt/service/core/ai/config';
import type { ChatCompletionMessageParam } from '@fastgpt/global/core/ai/type.d';
import { addLog } from '@fastgpt/service/common/system/log';
import { getImageParsePrompt } from '@/global/core/ai/prompt/autoTraining';
import { getVlmModel } from '@fastgpt/service/core/ai/model';
import { checkTeamAiPointsAndLock } from './utils';
import { addMinutes } from 'date-fns';
import { countGptMessagesTokens } from '@fastgpt/service/common/string/tiktoken/index';
import { ChatCompletionRequestMessageRoleEnum } from '@fastgpt/global/core/ai/constants';
import { loadRequestMessages } from '@fastgpt/service/core/chat/utils';
import {
  llmCompletionsBodyFormat,
  llmStreamResponseToAnswerText
} from '@fastgpt/service/core/ai/utils';
import { getImageBase64 } from '@fastgpt/service/common/file/image/utils';
import { DatasetDataIndexTypeEnum } from '@fastgpt/global/core/dataset/data/constants';

const reduceQueue = () => {
  global.imageParseQueueLen = global.imageParseQueueLen > 0 ? global.imageParseQueueLen - 1 : 0;

  return global.imageParseQueueLen === 0;
};
const reduceQueueAndReturn = (delay = 0) => {
  reduceQueue();
  if (delay) {
    setTimeout(() => {
      generateImageAnnotion();
    }, delay);
  } else {
    generateImageAnnotion();
  }
};

const matchAndParseTextImageUrl = async (text: string) => {
  // 匹配 ![](xxx)的图片格式，提取出 url
  const regex = /!\[\]\((.*?)\)/g;
  const matches = text.matchAll(regex);
  const images: string[] = [];

  for await (const match of matches) {
    const url = match[1];
    if (!url) continue;

    try {
      const { completeBase64: base64 } = await getImageBase64(url);
      images.push(base64);
    } catch (error) {}
  }

  return images;
};

export async function generateImageAnnotion(): Promise<any> {
  const max = global.systemEnv?.vlmMaxProcess || 10;
  if (global.imageParseQueueLen >= max) return;
  global.imageParseQueueLen++;

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
          retryCount: { $gte: 0 },
          lockTime: { $lte: addMinutes(new Date(), -10) }
        },
        {
          lockTime: new Date(),
          $inc: { retryCount: -1 }
        }
      )
        .populate<{
          dataset: { vectorModel: string; agentModel: string };
          collection: { autoIndexes?: boolean };
        }>([
          {
            path: 'dataset',
            select: 'vectorModel agentModel'
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
      addLog.error(`[Image parse queue] Error`, error);
      return {
        error: true
      };
    }
  })();

  if (done || !data) {
    if (reduceQueue()) {
      addLog.info(`[Image parse queue] Done`);
    }
    return;
  }
  if (error) {
    return reduceQueueAndReturn();
  }

  const nextMode = data.collection.autoIndexes ? TrainingModeEnum.auto : TrainingModeEnum.chunk;
  const nextModel =
    nextMode === TrainingModeEnum.auto ? data.dataset.agentModel : data.dataset.vectorModel;
  const updateImageQueueToChunkQueue = async () => {
    await MongoDatasetTraining.updateOne(
      { _id: data._id },
      {
        $set: {
          mode: nextMode,
          model: nextModel,
          lockTime: new Date('2000/1/1'),
          retryCount: 5
        }
      }
    );
  };
  addLog.info(`[Image parse queue] Start`);

  // Auth balance
  if (!(await checkTeamAiPointsAndLock(data.teamId))) {
    return reduceQueueAndReturn();
  }

  // Get model and check
  const modelData = getVlmModel(data.model);
  if (!modelData) {
    addLog.info(`[Image parse queue] Model not found: ${data.model}`);
    await updateImageQueueToChunkQueue();
    return reduceQueueAndReturn();
  }

  try {
    let inputTokens = 0;
    let outputTokens = 0;

    const startTime = Date.now();
    const prompt = getImageParsePrompt({ text });

    // 1. Match text image url
    let images = await matchAndParseTextImageUrl(text);
    if (images.length === 0) {
      addLog.info(`[Image parse queue] No image url found: ${data._id}`);
      await updateImageQueueToChunkQueue();
      return reduceQueueAndReturn();
    }

    // 2. request VLM to get image annotation
    const messages: ChatCompletionMessageParam[] = [
      {
        role: ChatCompletionRequestMessageRoleEnum.User,
        content: [
          ...images.map((base64) => ({
            type: 'image_url' as const,
            image_url: {
              url: base64
            }
          })),
          {
            type: 'text',
            text: prompt
          }
        ]
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
    const answer = await llmStreamResponseToAnswerText(chatResponse);
    inputTokens += await countGptMessagesTokens(messages);
    outputTokens += await countGptMessagesTokens([{ role: 'assistant', content: answer }]);

    // 3. Concat indexes
    const indexes = data.indexes.concat({
      text: answer,
      type: DatasetDataIndexTypeEnum.image
    });

    addLog.info(`[Image parse queue] Finish: ${(Date.now() - startTime) / 1000}s`);

    // 4. Update training data to chunk queue
    await MongoDatasetTraining.updateOne(
      { _id: data._id },
      {
        $set: {
          mode: nextMode,
          model: nextModel,
          lockTime: new Date('2000/1/1'),
          retryCount: 5,
          indexes
        }
      }
    );

    // 5. Add usage
    pushImageParseUsage({
      teamId: data.teamId,
      tmbId: data.tmbId,
      inputTokens,
      outputTokens,
      billId: data.billId,
      model: modelData.model
    });

    reduceQueueAndReturn();
  } catch (err: any) {
    addLog.error(`[Image parse queue] Error`, err);
    reduceQueueAndReturn(1000);
  }
}
