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

export const checkTeamAiPointsAndLock = async (teamId: string, tmbId: string) => {
  try {
    await checkTeamAIPoints(teamId);
    return true;
  } catch (error: any) {
    if (error === TeamErrEnum.aiPointsNotEnough) {
      // send inform and lock data
      try {
        global.sendInformQueue.push(() =>
          sendInform2OneUser({
            level: InformLevelEnum.important,
            title: '文本训练任务中止',
            content:
              '该团队账号AI积分不足，文本训练任务中止，重新充值后将会继续。暂停的任务将在 7 天后被删除。',
            tmbId
          })
        );

        addLog.info('Balance not enough. Stop the training task.');
        lockTrainingDataByTeamId(teamId);
      } catch (error) {}
    }
    return false;
  }
};
