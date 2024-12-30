import { MongoDatasetTraining } from '@fastgpt/service/core/dataset/training/schema';
import { pushAutoTrainingUsage } from '@/service/support/wallet/usage/push';
import { TrainingModeEnum } from '@fastgpt/global/core/dataset/constants';
import { getAIApi } from '@fastgpt/service/core/ai/config';
import type { ChatCompletionMessageParam } from '@fastgpt/global/core/ai/type.d';
import { addLog } from '@fastgpt/service/common/system/log';
import { splitText2Chunks } from '@fastgpt/global/common/string/textSplitter';
import { replaceVariable } from '@fastgpt/global/common/string/tools';
import {
  AUTO_TRAINING_PROMPT,
  AUTO_TRAINING_SPLIT_CHAT
} from '@/global/core/ai/prompt/autoTraining';
import type { PushDatasetDataChunkProps } from '@fastgpt/global/core/dataset/api.d';
import { getLLMModel } from '@fastgpt/service/core/ai/model';
import { checkTeamAiPointsAndLock } from './utils';
import { checkInvalidChunkAndLock } from '@fastgpt/service/core/dataset/training/utils';
import { addMinutes } from 'date-fns';
import { countGptMessagesTokens } from '@fastgpt/service/common/string/tiktoken/index';
import { ChatCompletionRequestMessageRoleEnum } from '@fastgpt/global/core/ai/constants';
import { pushDataListToTrainingQueueByCollectionId } from '@fastgpt/service/core/dataset/training/controller';
import { loadRequestMessages } from '@fastgpt/service/core/chat/utils';
import { llmCompletionsBodyFormat } from '@fastgpt/service/core/ai/utils';

const reduceQueue = () => {
  global.autoTrainingLen = global.autoTrainingLen > 0 ? global.autoTrainingLen - 1 : 0;

  return global.autoTrainingLen === 0;
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
          lockTime: { $lte: addMinutes(new Date(), -6) }
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
    reduceQueue();
    return generateAutoTraining();
  }
  addLog.info(`[Auto Training Queue] Start`);

  // auth balance
  if (!(await checkTeamAiPointsAndLock(data.teamId))) {
    reduceQueue();
    return generateAutoTraining();
  }

  try {
    const startTime = Date.now();
    const modelData = getLLMModel(data.model);
    const prompt = replaceVariable(AUTO_TRAINING_PROMPT, { text });

    // request LLM to get QA
    const messages: ChatCompletionMessageParam[] = [
      {
        role: ChatCompletionRequestMessageRoleEnum.User,
        content: prompt
      }
    ];

    const ai = getAIApi({
      timeout: 600000
    });
    const chatResponse = await ai.chat.completions.create(
      llmCompletionsBodyFormat(
        {
          model: modelData.model,
          temperature: 0.3,
          messages: await loadRequestMessages({ messages, useVision: false }),
          stream: false
        },
        modelData
      )
    );
    const answer = chatResponse.choices?.[0].message?.content || '';

    const splitIndexResult = formatSplitText2Index(answer, text); // 格式化后的索引

    addLog.info(`[Auto Training Queue] Finish`, {
      time: `${(Date.now() - startTime) / 1000}s`,
      splitLength: splitIndexResult.indexes?.length,
      usage: chatResponse.usage
    });

    // get vector and insert
    const { insertLen } = await pushDataListToTrainingQueueByCollectionId({
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

    // add bill
    if (insertLen > 0) {
      pushAutoTrainingUsage({
        teamId: data.teamId,
        tmbId: data.tmbId,
        inputTokens: await countGptMessagesTokens(messages),
        outputTokens: await countGptMessagesTokens([{ role: 'assistant', content: answer }]),
        billId: data.billId,
        model: modelData.model
      });
    } else {
      addLog.info(`[Auto Training Queue] Result 0:`, { answer });
    }

    reduceQueue();
    generateAutoTraining();
  } catch (err: any) {
    reduceQueue();

    if (await checkInvalidChunkAndLock({ err, data, errText: '文本理解模型调用失败' })) {
      return generateAutoTraining();
    }

    setTimeout(() => {
      generateAutoTraining();
    }, 1000);
  }
}

/**
 * 检查文本是否按格式返回
 */
function formatSplitText2Index(answer: string, rawText: string): PushDatasetDataChunkProps {
  const arr = answer.split(AUTO_TRAINING_SPLIT_CHAT);

  const result = {
    q: rawText,
    a: '',
    indexes: arr.map((item) => {
      // remove start :
      item = item.trim();
      if (item.startsWith(':')) {
        item = item.slice(1);
      }
      return {
        defaultIndex: false,
        text: item
      };
    })
  };

  const { chunks } = splitText2Chunks({ text: rawText, chunkLen: 512 });
  result.indexes.push(
    ...chunks.map((item) => ({
      defaultIndex: false,
      text: item
    }))
  );

  return result;
}
