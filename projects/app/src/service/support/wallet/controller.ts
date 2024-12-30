import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { addLog } from '@fastgpt/service/common/system/log';
import { delay } from '@fastgpt/global/common/system/utils';
import { MongoUsage } from '@fastgpt/service/support/wallet/usage/schema';
import type { ConcatBillQueueItemType } from '@/global/support/wallet/bill/type.d';
import { ClientSession } from '@fastgpt/service/common/mongo';
import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import { SubTypeEnum } from '@fastgpt/global/support/wallet/sub/constants';

const batchUpdateTime = Number(process.env.BATCH_UPDATE_TIME || 3000);

/* 
  amount: min unit
*/
export async function updateTeamBalance({
  teamId,
  amount,
  retry = 3,
  session
}: {
  teamId: string;
  amount: number;
  retry?: number;
  session?: ClientSession;
}): Promise<any> {
  if (amount === 0) return;

  addLog.info(`update balance`, {
    teamId,
    amount
  });

  try {
    await MongoTeam.findByIdAndUpdate(
      teamId,
      {
        $inc: { balance: amount }
      },
      { session }
    );
  } catch (error) {
    if (session) {
      return Promise.reject(error);
    }

    console.log(error, retry);

    if (retry > 0) {
      await delay(100);
      return updateTeamBalance({ teamId, amount, retry: retry - 1, session });
    }
  }
}
export const incTeamAiPoints = async ({
  teamId,
  totalPoints,
  retry = 3,
  session
}: {
  teamId: string;
  totalPoints: number;
  retry?: number;
  session?: ClientSession;
}): Promise<any> => {
  if (totalPoints === 0) return;

  addLog.info(`update ai points`, {
    teamId,
    totalPoints
  });
  try {
    // 先按日期过期的先扣
    const updateResult = await MongoTeamSub.findOneAndUpdate(
      {
        teamId,
        type: [SubTypeEnum.standard, SubTypeEnum.extraPoints],
        surplusPoints: { $gte: Math.abs(totalPoints) }
      },
      {
        $inc: { surplusPoints: totalPoints }
      },
      { session }
    ).sort({
      expiredTime: 1
    });

    // 如果没有一个扣除成功，就直接扣余额多的
    if (!updateResult) {
      await MongoTeamSub.findOneAndUpdate(
        {
          teamId,
          type: [SubTypeEnum.standard, SubTypeEnum.extraPoints]
        },
        {
          $inc: { surplusPoints: totalPoints }
        },
        { session }
      ).sort({
        surplusPoints: -1
      });
    }
  } catch (error) {
    if (session) {
      return Promise.reject(error);
    }

    console.log(error, retry);

    if (retry > 0) {
      await delay(100);
      return incTeamAiPoints({ teamId, totalPoints, retry: retry - 1, session });
    }
  }
};

export const pushReduceTeamAiPointsTask = ({
  teamId,
  totalPoints
}: {
  teamId: string;
  totalPoints: number;
}) => {
  global.reduceAiPointsQueue.push({
    teamId: String(teamId),
    totalPoints
  });
};
export const reduceAiPointsTimer = async () => {
  if (global.reduceAiPointsQueue.length > 0) {
    const list = global.reduceAiPointsQueue.slice();
    global.reduceAiPointsQueue = [];

    // concat same teamId
    const map = new Map<string, number>();
    list.forEach(({ teamId, totalPoints }) => {
      if (map.has(teamId)) {
        map.set(teamId, map.get(teamId)! + totalPoints);
      } else {
        map.set(teamId, totalPoints);
      }
    });
    const reduceList = Array.from(map).map(([teamId, totalPoints]) => ({ teamId, totalPoints }));

    for await (const item of reduceList) {
      try {
        await incTeamAiPoints({
          teamId: item.teamId,
          totalPoints: -item.totalPoints
        });
      } catch (error) {
        addLog.error('Reduce ai points error', error);
      }
    }

    console.log('reduce ai points account:', list.length);
  }
  await delay(batchUpdateTime);
  reduceAiPointsTimer();
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
    list.forEach(({ billId, totalPoints, inputTokens, outputTokens, listIndex }) => {
      const id = `${billId}-${listIndex}`;
      const data = map.get(id);
      if (data) {
        map.set(id, {
          billId,
          totalPoints: data.totalPoints + totalPoints,
          inputTokens: data.inputTokens + inputTokens,
          outputTokens: data.outputTokens + outputTokens,
          listIndex
        });
      } else {
        map.set(id, {
          billId,
          totalPoints,
          inputTokens,
          outputTokens,
          listIndex
        });
      }
    });

    const concatList = Array.from(map).map(([_, data]) => data);

    for await (const item of concatList) {
      const { billId, listIndex, totalPoints, inputTokens, outputTokens } = item;
      try {
        await MongoUsage.findByIdAndUpdate(billId, {
          $inc: {
            totalPoints,
            ...(listIndex !== undefined && {
              [`list.${listIndex}.amount`]: totalPoints,
              [`list.${listIndex}.inputTokens`]: inputTokens,
              [`list.${listIndex}.outputTokens`]: outputTokens
            })
          }
        });
      } catch (error) {
        addLog.error('Concat bill error', error);
      }
    }
    console.log('concat bill timer:', list.length);
  }

  await delay(batchUpdateTime);
  concatBillTimer();
};
