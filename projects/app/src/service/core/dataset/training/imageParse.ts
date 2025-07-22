import { MongoDatasetTraining } from '@fastgpt/service/core/dataset/training/schema';
import { TrainingModeEnum } from '@fastgpt/global/core/dataset/constants';
import { createChatCompletion } from '@fastgpt/service/core/ai/config';
import type { ChatCompletionMessageParam } from '@fastgpt/global/core/ai/type.d';
import { addLog } from '@fastgpt/service/common/system/log';
import { getImageParsePrompt } from '@/global/core/ai/prompt/training';
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
import { getErrText } from '@fastgpt/global/common/error/utils';
import { getDatasetImageBase64 } from '@fastgpt/service/core/dataset/image/controller';
import { pushLLMTrainingUsage } from '@fastgpt/service/support/wallet/usage/controller';
import { delay } from '@fastgpt/global/common/system/utils';

const reduceQueue = () => {
  global.imageParseQueueLen = global.imageParseQueueLen > 0 ? global.imageParseQueueLen - 1 : 0;

  return global.imageParseQueueLen === 0;
};

export async function imageParseTraining(): Promise<any> {
  if (global.licenseData?.functions?.datasetEnhance === false) {
    addLog.warn('该 License 无权使用图片解析');
    return;
  }

  addLog.debug(`[Image parse queue] Size: ${global.imageParseQueueLen}`);

  const max = global.systemEnv?.vlmMaxProcess || 10;
  if (global.imageParseQueueLen >= max) return;
  global.imageParseQueueLen++;

  while (true) {
    // get training data
    const {
      data,
      imageId,
      done = false,
      error = false
    } = await (async () => {
      try {
        const data = await MongoDatasetTraining.findOneAndUpdate(
          {
            mode: TrainingModeEnum.imageParse,
            retryCount: { $gte: 0 },
            lockTime: { $lte: addMinutes(new Date(), -10) }
          },
          {
            lockTime: new Date(),
            $inc: { retryCount: -1 }
          }
        )
          .populate<{
            dataset: { vlmModel: string };
          }>([
            {
              path: 'dataset',
              select: 'vlmModel'
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
          imageId: data.imageId
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
      addLog.error(`[Image parse queue] Error`, error);
      await delay(500);
      continue;
    }
    if (!imageId) {
      addLog.warn(`[Image parse queue] Image id not found: ${data._id}`);
      await MongoDatasetTraining.deleteOne({ _id: data._id });
      continue;
    }
    if (!data.dataset) {
      addLog.info(`[Image parse queue] Dataset not found`, data);
      // Delete data
      await MongoDatasetTraining.deleteOne({ _id: data._id });
      continue;
    }
    // Auth balance
    if (!(await checkTeamAiPointsAndLock(data.teamId))) {
      continue;
    }

    // Get model and check
    const modelData = getVlmModel(data.dataset.vlmModel);
    if (!modelData) {
      addLog.warn(`[Image parse queue] Model not found: ${data.dataset.vlmModel}`);
      await MongoDatasetTraining.updateMany(
        {
          mode: TrainingModeEnum.imageParse
        },
        { $set: { retryCount: 0, errorMsg: 'VLM model not found' } }
      );
      break;
    }

    addLog.info(`[Image parse queue] Start`);

    try {
      const startTime = Date.now();

      // 1. Match text image url
      const imageBase64 = await getDatasetImageBase64(imageId);

      // 2. request VLM to get image annotation
      const messages: ChatCompletionMessageParam[] = [
        {
          role: ChatCompletionRequestMessageRoleEnum.System,
          content: getImageParsePrompt()
        },
        {
          role: ChatCompletionRequestMessageRoleEnum.User,
          content: [
            {
              type: 'image_url' as const,
              image_url: {
                url: imageBase64
              }
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
      const { text: answer, usage } = await formatLLMResponse(chatResponse);
      const inputTokens = usage?.prompt_tokens || (await countGptMessagesTokens(messages));
      const outputTokens = usage?.completion_tokens || (await countPromptTokens(answer));

      addLog.info(`[Image parse queue] Finish: ${(Date.now() - startTime) / 1000}s`);

      // 3. Update training data to chunk queue
      await MongoDatasetTraining.updateOne(
        { _id: data._id },
        {
          $set: {
            mode: TrainingModeEnum.chunk,
            q: answer,
            lockTime: new Date('2000/1/1'),
            retryCount: 5
          }
        }
      );

      // 4. Add usage
      pushLLMTrainingUsage({
        teamId: data.teamId,
        tmbId: data.tmbId,
        inputTokens,
        outputTokens,
        billId: data.billId,
        model: modelData.model,
        mode: 'imageParse'
      });
    } catch (err: any) {
      addLog.error(`[Image parse queue] Error`, err);

      await MongoDatasetTraining.updateOne(
        {
          _id: data._id
        },
        {
          lockTime: addMinutes(new Date(), -9),
          errorMsg: getErrText(err, 'unknown error')
        }
      );

      await delay(100);
    }
  }

  if (reduceQueue()) {
    addLog.info(`[Image parse queue] Done`);
  }
  addLog.debug(`[Image parse queue] break loop, current queue size: ${global.imageParseQueueLen}`);
}
