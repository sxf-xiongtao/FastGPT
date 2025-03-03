import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import { checkTeamAIPoints } from '@fastgpt/service/support/permission/teamLimit';
import { lockTrainingDataByTeamId } from '@fastgpt/service/core/dataset/training/controller';
import { sendInform2OneUser } from '@/service/support/user/inform/controller';
import { generateAutoTraining } from './autoTrainingProcess';
import { addLog } from '@fastgpt/service/common/system/log';
import { InformLevelEnum } from '@fastgpt/global/support/user/inform/constants';
import { MongoDatasetTraining } from '@fastgpt/service/core/dataset/training/schema';
import {
  DatasetDataIndexItemType,
  DatasetTrainingSchemaType
} from '@fastgpt/global/core/dataset/type';
import { TrainingModeEnum } from '@fastgpt/global/core/dataset/constants';
import { splitText2Chunks } from '@fastgpt/global/common/string/textSplitter';
import { generateImageAnnotion } from './imageParse';
import { DatasetDataIndexTypeEnum } from '@fastgpt/global/core/dataset/data/constants';

export const startTrainingProcess = () => {
  generateAutoTraining();
  generateImageAnnotion();
};

export const checkTeamAiPointsAndLock = async (teamId: string) => {
  try {
    await checkTeamAIPoints(teamId);
    return true;
  } catch (error: any) {
    if (error === TeamErrEnum.aiPointsNotEnough) {
      // send inform and lock data
      try {
        sendInform2OneUser({
          level: InformLevelEnum.important,
          templateCode: 'LACK_OF_POINTS',
          templateParam: {},
          teamId
        });

        addLog.info('Balance not enough. Stop the training task.');
        lockTrainingDataByTeamId(teamId);
      } catch (error) {}
    }
    return false;
  }
};

export const createDatasetTrainingMongoWatch = () => {
  const changeStream = MongoDatasetTraining.watch();

  changeStream.on('change', async (change) => {
    try {
      if (change.operationType === 'insert') {
        const fullDocument = change.fullDocument as DatasetTrainingSchemaType;
        const { mode } = fullDocument;
        if (mode === TrainingModeEnum.auto) {
          generateAutoTraining();
        } else if (mode === TrainingModeEnum.image) {
          generateImageAnnotion();
        }
      }
    } catch (error) {}
  });
};

/**
 * Parse format answer
    ## Question
    ## Summary
 */
const parseFormatAnswer = (answer: string) => {
  // Match content between "## Question(s)" and the next "##" or end of string
  const question = answer.match(/## Questions?\s*\n([\s\S]*?)(?=\s*##|$)/i)?.[1];
  // Match content after "## Summary" until the end of string
  const summary = answer.match(/## Summary\s*\n([\s\S]*?)$/i)?.[1];
  return { question: question?.trim() || '', summary: summary?.trim() || '' };
};
export const formatSplitText2Index = (
  answer: string,
  rawText: string
): Omit<DatasetDataIndexItemType, 'dataId'>[] => {
  const { question, summary } = parseFormatAnswer(answer);

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

  const { chunks } = splitText2Chunks({ text: rawText, chunkLen: 512 });
  indexes.push(
    ...chunks.map((item) => ({
      text: item,
      type: DatasetDataIndexTypeEnum.custom
    }))
  );

  return indexes;
};
