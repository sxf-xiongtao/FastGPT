import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import { checkTeamAIPoints } from '@fastgpt/service/support/permission/teamLimit';
import { lockTrainingDataByTeamId } from '@fastgpt/service/core/dataset/training/controller';
import { sendInform2OneUser } from '@/service/support/user/inform/controller';
import { generateAutoTraining } from './autoTrainingProcess';
import { addLog } from '@fastgpt/service/common/system/log';
import { InformLevelEnum } from '@fastgpt/global/support/user/inform/constants';

export const startTrainingProcess = () => {
  generateAutoTraining();
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
