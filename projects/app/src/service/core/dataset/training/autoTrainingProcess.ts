import { MongoDatasetTraining } from '@fastgpt/service/core/dataset/training/schema';
import { pushAutoTrainingUsage } from '@/service/support/wallet/usage/push';
import { TrainingModeEnum } from '@fastgpt/global/core/dataset/constants';
import { createChatCompletion } from '@fastgpt/service/core/ai/config';
import type { ChatCompletionMessageParam } from '@fastgpt/global/core/ai/type.d';
import { addLog } from '@fastgpt/service/common/system/log';
import { getAutoTrainingPrompt } from '@/global/core/ai/prompt/autoTraining';
import { getLLMModel } from '@fastgpt/service/core/ai/model';
import { checkTeamAiPointsAndLock } from './utils';
import { addMinutes } from 'date-fns';
import { countGptMessagesTokens } from '@fastgpt/service/common/string/tiktoken/index';
import { ChatCompletionRequestMessageRoleEnum } from '@fastgpt/global/core/ai/constants';
import { pushDataListToTrainingQueueByCollectionId } from '@fastgpt/service/core/dataset/training/controller';
import { loadRequestMessages } from '@fastgpt/service/core/chat/utils';
import {
  llmCompletionsBodyFormat,
  llmStreamResponseToAnswerText
} from '@fastgpt/service/core/ai/utils';
import { formatSplitText2Index } from './utils';
import { DatasetErrEnum } from '@fastgpt/global/common/error/code/dataset';

const reduceQueue = () => {
  global.autoTrainingLen = global.autoTrainingLen > 0 ? global.autoTrainingLen - 1 : 0;

  return global.autoTrainingLen === 0;
};
const returnQueue = (delay = 0) => {
  reduceQueue();
  if (delay) {
    setTimeout(() => {
      generateAutoTraining();
    }, delay);
  } else {
    generateAutoTraining();
  }
};

export async function generateAutoTraining(): Promise<any> {
  const max = global.systemEnv?.qaMaxProcess || 10;
  if (global.autoTrainingLen >= max) return;
  global.autoTrainingLen++;

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
          mode: TrainingModeEnum.auto,
          retryCount: { $gte: 0 },
          lockTime: { $lte: addMinutes(new Date(), -10) }
        },
        {
          lockTime: new Date(),
          $inc: { retryCount: -1 }
        }
      )
        .select({
          _id: 1,
          userId: 1,
          teamId: 1,
          tmbId: 1,
          datasetId: 1,
          collectionId: 1,
          q: 1,
          model: 1,
          chunkIndex: 1,
          billId: 1,
          prompt: 1
        })
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
      addLog.error(`[Auto Training Queue] Error`, error);
      return {
        error: true
      };
    }
  })();

  if (done || !data) {
    if (reduceQueue()) {
      addLog.info(`[Auto Training Queue] Done`);
    }
    return;
  }
  if (error) {
    return returnQueue();
  }
  addLog.info(`[Auto Training Queue] Start`);

  // auth balance
  if (!(await checkTeamAiPointsAndLock(data.teamId))) {
    return returnQueue();
  }

  try {
    const startTime = Date.now();
    const modelData = getLLMModel(data.model);
    const prompt = getAutoTrainingPrompt({ text });

    // request LLM to get QA
    const messages: ChatCompletionMessageParam[] = [
      {
        role: ChatCompletionRequestMessageRoleEnum.User,
        content: prompt
      }
    ];

    const { response: chatResponse } = await createChatCompletion({
      body: llmCompletionsBodyFormat(
        {
          model: modelData.model,
          temperature: 0.3,
          messages: await loadRequestMessages({ messages, useVision: false }),
          stream: true
        },
        modelData
      )
    });
    const answer = await llmStreamResponseToAnswerText(chatResponse);

    const splitIndexResult = formatSplitText2Index(answer, text); // 格式化后的索引

    addLog.info(`[Auto Training Queue] Finish`, {
      time: `${(Date.now() - startTime) / 1000}s`,
      splitLength: splitIndexResult.indexes?.length,
      usage: chatResponse.usage
    });

    try {
      // get vector and insert
      await pushDataListToTrainingQueueByCollectionId({
        teamId: data.teamId,
        tmbId: data.tmbId,
        collectionId: data.collectionId,
        trainingMode: TrainingModeEnum.chunk,
        data: [
          {
            ...splitIndexResult,
            chunkIndex: data.chunkIndex
          }
        ],
        billId: data.billId
      });

      // delete data from training
      await MongoDatasetTraining.findByIdAndDelete(data._id);
    } catch (error) {
      if (error === DatasetErrEnum.unExistCollection) {
        await MongoDatasetTraining.findByIdAndDelete(data._id);
      }
      addLog.error(`[Auto Training Queue] Insert data error`, error);
      return returnQueue();
    }

    // add bill
    pushAutoTrainingUsage({
      teamId: data.teamId,
      tmbId: data.tmbId,
      inputTokens: await countGptMessagesTokens(messages),
      outputTokens: await countGptMessagesTokens([{ role: 'assistant', content: answer }]),
      billId: data.billId,
      model: modelData.model
    });

    return returnQueue();
  } catch (err: any) {
    addLog.error(`[Auto Training Queue] Error`, err);
    returnQueue(1000);
  }
}
