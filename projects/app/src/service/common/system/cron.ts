import { setCron } from '@fastgpt/service/common/system/cron';
import { startTrainingProcess } from '@/service/core/dataset/training/utils';
import { clearExpiredSubPlan, updateStandardPlan } from './cronTask';
import { checkTimerLock } from '@fastgpt/service/common/system/timerLock/utils';
import { TimerIdEnum } from '@fastgpt/service/common/system/timerLock/constants';

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

export const startCron = () => {
  setTrainingCron();
  updateSubPlanCron();
};
