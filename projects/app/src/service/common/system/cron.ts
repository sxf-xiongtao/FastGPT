import { setCron } from '@fastgpt/service/common/system/cron';
import { startTrainingProcess } from '@/service/core/dataset/training/utils';
import { clearExpiredSubPlan, updateStandardPlan } from './cronTask';
import { checkTimerLock } from '@fastgpt/service/common/system/timerLock/utils';
import { TimerIdEnum } from '@fastgpt/service/common/system/timerLock/constants';
import { notifyAllExpireSoon } from '@/service/support/user/team/timerTask/expireSoon';
import { checkFreeAccount } from '@/service/support/user/team/timerTask/freeAccount';
import { addLog } from '@fastgpt/service/common/system/log';

const setTrainingCron = () => {
  setCron('*/1 * * * *', () => {
    startTrainingProcess();
  });
};

const updateSubPlanCron = () => {
  setCron('*/10 * * * *', async () => {
    if (
      await checkTimerLock({
        timerId: TimerIdEnum.clearExpiredSubPlan,
        lockMinuted: 9
      })
    ) {
      clearExpiredSubPlan();
    }
  });
  setCron('*/20 * * * *', async () => {
    if (
      await checkTimerLock({
        timerId: TimerIdEnum.updateStandardPlan,
        lockMinuted: 19
      })
    ) {
      updateStandardPlan();
    }
  });
};

const planNotifyCron = () => {
  setCron('10 */3 * * *', async () => {
    if (
      await checkTimerLock({
        timerId: TimerIdEnum.notification,
        lockMinuted: 59
      })
    ) {
      addLog.info(`通知即将过期的套餐`);
      notifyAllExpireSoon();
    }
  });
};
const freeAccountCron = () => {
  setCron('10 5 * * *', async () => {
    if (
      await checkTimerLock({
        timerId: TimerIdEnum.notification,
        lockMinuted: 200
      })
    ) {
      addLog.info(`通知免费版用户即将清理`);
      checkFreeAccount();
    }
  });
};

export const startCron = () => {
  setTrainingCron();
  updateSubPlanCron();
  planNotifyCron();
  freeAccountCron();
};
