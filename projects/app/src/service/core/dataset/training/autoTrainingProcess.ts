import { MongoDatasetTraining } from '@fastgpt/service/core/dataset/training/schema';
import { pushAutoTrainingUsage } from '@/service/support/wallet/usage/push';
import { TrainingModeEnum } from '@fastgpt/global/core/dataset/constants';
import { createChatCompletion } from '@fastgpt/service/core/ai/config';
import type { ChatCompletionMessageParam } from '@fastgpt/global/core/ai/type.d';
import { addLog } from '@fastgpt/service/common/system/log';
import { getAutoTrainingPrompt } from '@/global/core/ai/prompt/training';
import { getLLMModel } from '@fastgpt/service/core/ai/model';
import { checkTeamAiPointsAndLock } from './utils';
import { addMinutes } from 'date-fns';
import {
  countGptMessagesTokens,
  countPromptTokens
} from '@fastgpt/service/common/string/tiktoken/index';
import { ChatCompletionRequestMessageRoleEnum } from '@fastgpt/global/core/ai/constants';
import { loadRequestMessages } from '@fastgpt/service/core/chat/utils';
import { llmCompletionsBodyFormat, formatLLMResponse } from '@fastgpt/service/core/ai/utils';
import { DatasetDataIndexItemType } from '@fastgpt/global/core/dataset/type';
import { DatasetDataIndexTypeEnum } from '@fastgpt/global/core/dataset/data/constants';
import { getErrText } from '@fastgpt/global/common/error/utils';

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
  if (global.licenseData?.functions?.datasetEnhance === false) {
    await MongoDatasetTraining.updateMany(
      {
        mode: TrainingModeEnum.auto
      },
      {
        $set: {
          mode: TrainingModeEnum.chunk
        }
      }
    );
    return;
  }

  addLog.debug(`[Auto Training Queue] Size: ${global.autoTrainingLen}`);

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
        .populate<{
          dataset: { vectorModel: string };
        }>([
          {
            path: 'dataset',
            select: 'vectorModel '
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
      addLog.error(`[Auto index queue] Error`, error);
      return {
        error: true
      };
    }
  })();

  if (done || !data) {
    if (reduceQueue()) {
      addLog.info(`[Auto index queue] Done`);
    }
    return;
  }
  if (error) {
    return returnQueue();
  }
  addLog.info(`[Auto index queue] Start`);

  // auth balance
  if (!(await checkTeamAiPointsAndLock(data.teamId))) {
    return returnQueue();
  }

  try {
    const startTime = Date.now();
    // 1. Get model
    const modelData = getLLMModel(data.model);
    if (!modelData) {
      addLog.info(`[Auto index queue] Model not found: ${data.model}`);
      await MongoDatasetTraining.updateOne(
        { _id: data._id },
        {
          $set: {
            mode: TrainingModeEnum.chunk,
            model: data.dataset.vectorModel,
            lockTime: new Date('2000/1/1'),
            retryCount: 5
          }
        }
      );
      return returnQueue();
    }

    // 2. request LLM to get response
    const prompt = getAutoTrainingPrompt({ text });
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
    const { text: answer, usage } = await formatLLMResponse(chatResponse);
    const inputTokens = usage?.prompt_tokens || (await countGptMessagesTokens(messages));
    const outputTokens = usage?.completion_tokens || (await countPromptTokens(answer));

    // 3. Format answer to indexes and concat
    const autoIndexResult = formatSplitText2Index({ answer }); // 格式化后的索引
    const newIndexes = data.indexes.concat(autoIndexResult);

    // 4. Update training data to chunk queue
    await MongoDatasetTraining.updateOne(
      { _id: data._id },
      {
        $set: {
          mode: TrainingModeEnum.chunk,
          model: data.dataset.vectorModel,
          lockTime: new Date('2000/1/1'),
          retryCount: 5,
          indexes: newIndexes
        }
      }
    );

    // 5. Push bill
    pushAutoTrainingUsage({
      teamId: data.teamId,
      tmbId: data.tmbId,
      inputTokens,
      outputTokens,
      billId: data.billId,
      model: modelData.model
    });

    addLog.info(`[Auto index queue] Finish`, {
      time: `${(Date.now() - startTime) / 1000}s`,
      indexLen: newIndexes.length,
      usage
    });

    return returnQueue();
  } catch (err: any) {
    addLog.error(`[Auto Training Queue] Error`, err);

    await MongoDatasetTraining.updateOne(
      {
        teamId: data.teamId,
        datasetId: data.datasetId,
        _id: data._id
      },
      {
        lockTime: addMinutes(new Date(), -9),
        errorMsg: getErrText(err, 'unknown error')
      }
    );

    returnQueue(1000);
  }
}

export const formatSplitText2Index = ({
  answer
}: {
  answer: string;
}): Omit<DatasetDataIndexItemType, 'dataId'>[] => {
  answer = answer.trim();

  // 有些模型会偷懒，不输出 </Summary>
  if (!answer.includes('</Summary>') && answer.includes('<Summary>')) {
    answer += '</Summary>';
  }

  // 解析<Questions>和<Summary>
  const question = answer.match(/<Questions>([\s\S]*?)<\/Questions>/)?.[1]?.trim();
  const summary = answer.match(/<Summary>([\s\S]*?)<\/Summary>/)?.[1]?.trim();

  const indexes = [
    ...(question
      ? [
          {
            text: question,
            type: DatasetDataIndexTypeEnum.question
          }
        ]
      : []),
    ...(summary
      ? [
          {
            text: summary,
            type: DatasetDataIndexTypeEnum.summary
          }
        ]
      : [])
  ];

  if (!question || !summary) {
    addLog.warn('[Auto Training] No question or summary', { answer });
  }

  return indexes;
};
