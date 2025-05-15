import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import { checkTeamAIPoints } from '@fastgpt/service/support/permission/teamLimit';
import { lockTrainingDataByTeamId } from '@fastgpt/service/core/dataset/training/controller';
import { sendInform2OneUser } from '@/service/support/user/inform/controller';
import { generateAutoTraining } from './autoTrainingProcess';
import { addLog } from '@fastgpt/service/common/system/log';
import { InformLevelEnum } from '@fastgpt/global/support/user/inform/constants';
import { MongoDatasetTraining } from '@fastgpt/service/core/dataset/training/schema';
import { DatasetTrainingSchemaType } from '@fastgpt/global/core/dataset/type';
import { TrainingModeEnum } from '@fastgpt/global/core/dataset/constants';
import { generateImageAnnotion } from './imageParse';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';

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
      const team = await MongoTeam.findById(teamId).lean();
      if (!team) {
        addLog.error('Can not find team', teamId);
        return false;
      }

      try {
        sendInform2OneUser({
          level: InformLevelEnum.important,
          templateCode: 'LACK_OF_POINTS',
          templateParam: {},
          userId: team.ownerId,
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
