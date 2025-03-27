import { setCron } from '@fastgpt/service/common/system/cron';
import { startTrainingProcess } from '@/service/core/dataset/training/utils';
import { clearExpiredSubPlan, syncMemberAndOrg } from './cronTask';
import { checkTimerLock } from '@fastgpt/service/common/system/timerLock/utils';
import { TimerIdEnum } from '@fastgpt/service/common/system/timerLock/constants';
import { notifyAllExpireSoon } from '@/service/support/user/team/timerTask/expireSoon';
import { checkFreeAccount } from '@/service/support/user/team/timerTask/freeAccount';
import { addLog } from '@fastgpt/service/common/system/log';
import { syncCollectionTask } from '@/service/core/dataset/sync';

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
  // 国内订阅，不再自动续费
  // setCron('*/20 * * * *', async () => {
  //   if (
  //     await checkTimerLock({
  //       timerId: TimerIdEnum.updateStandardPlan,
  //       lockMinuted: 19
  //     })
  //   ) {
  //     updateStandardPlan();
  //   }
  // });
};

// 通知即将过期的套餐
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
// 通知免费版用户清理
const freeAccountCron = () => {
  setCron('20 */8 * * *', async () => {
    if (
      await checkTimerLock({
        timerId: TimerIdEnum.notification,
        lockMinuted: 200
      })
    ) {
      addLog.info(`通知免费版用户即将清理`);
      checkFreeAccount(30);
    }
  });
};

// 集合同步
const syncCollectionCron = () => {
  setCron('15 */1 * * *', syncCollectionTask);
};

// 成员同步
const syncMemberAndOrgCron = () => {
  const cron = process.env.SYNC_MEMBER_CRON;
  if (cron && global.systemConfig?.teamMode === 'sync') {
    setCron(cron, async () => {
      await syncMemberAndOrg();
    });
  }
};

export const startCron = () => {
  setTrainingCron();
  updateSubPlanCron();
  planNotifyCron();
  freeAccountCron();
  syncCollectionCron();
  syncMemberAndOrgCron();
};
