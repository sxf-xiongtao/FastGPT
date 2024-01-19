import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { addLog } from '@fastgpt/service/common/system/log';
import { delay } from '@fastgpt/global/common/system/utils';
import { MongoBill } from '@fastgpt/service/support/wallet/bill/schema';
import type { ConcatBillQueueItemType } from '@/global/support/wallet/bill/type.d';

/* 
  amount: min unit
*/
export async function updateTeamBalance({
  teamId,
  amount,
  retry = 3
}: {
  teamId: string;
  amount: number;
  retry?: number;
}): Promise<any> {
  if (amount === 0) return;
  if (Math.abs(amount) < 10) {
    addLog.info('updateTeamBalance amount too small, maybe have error', { teamId, amount });
  }

  addLog.info(`update balance`, {
    teamId,
    amount
  });

  try {
    await MongoTeam.findByIdAndUpdate(teamId, {
      $inc: { balance: amount }
    });
  } catch (error) {
    console.log(error, retry);

    if (retry > 0) {
      await delay(100);
      return updateTeamBalance({ teamId, amount, retry: retry - 1 });
    }
  }
}

export const pushReduceTeamBalanceTask = ({
  teamId,
  amount
}: {
  teamId: string;
  amount: number;
}) => {
  global.reduceBalanceQueue.push({
    teamId: String(teamId),
    amount
  });
};
export const reduceTeamBalanceTimer = async () => {
  if (global.reduceBalanceQueue.length > 0) {
    const list = global.reduceBalanceQueue.slice();
    global.reduceBalanceQueue = [];

    // concat same teamId
    const map = new Map<string, number>();
    list.forEach(({ teamId, amount }) => {
      if (map.has(teamId)) {
        map.set(teamId, map.get(teamId)! + amount);
      } else {
        map.set(teamId, amount);
      }
    });
    const reduceList = Array.from(map).map(([teamId, amount]) => ({ teamId, amount }));

    for await (const item of reduceList) {
      try {
        await updateTeamBalance({
          teamId: item.teamId,
          amount: item.amount
        });
      } catch (error) {
        addLog.error('reduce balance error', error);
      }
    }

    console.log('reduce timer:', list.length);
  }
  await delay(Number(process.env.UPDATE_BALANCE_DELAY || 5000));
  reduceTeamBalanceTimer();
};

export const pushConcatBillTask = (data: ConcatBillQueueItemType[]) => {
  global.concatBillQueue.push(...data);
};
export const concatBillTimer = async () => {
  if (global.concatBillQueue.length > 0) {
    const list = global.concatBillQueue.slice();
    global.concatBillQueue = [];

    // concat same billId
    const map = new Map<string, ConcatBillQueueItemType>();
    list.forEach(({ billId, total, charsLength, listIndex }) => {
      const id = `${billId}-${listIndex}`;
      const data = map.get(id);
      if (data) {
        map.set(id, {
          billId,
          total: data.total + total,
          charsLength: data.charsLength + charsLength,
          listIndex
        });
      } else {
        map.set(id, {
          billId,
          total,
          charsLength,
          listIndex
        });
      }
    });

    const concatList = Array.from(map).map(([_, data]) => data);

    for await (const item of concatList) {
      const { billId, listIndex, total, charsLength } = item;

      try {
        await MongoBill.findByIdAndUpdate(billId, {
          $inc: {
            total,
            ...(listIndex !== undefined && {
              [`list.${listIndex}.amount`]: total,
              [`list.${listIndex}.charsLength`]: charsLength
            })
          }
        });
      } catch (error) {
        addLog.error('concat bill error', error);
      }
    }
    console.log('concat bill timer:', list.length);
  }

  await delay(3000);
  concatBillTimer();
};
