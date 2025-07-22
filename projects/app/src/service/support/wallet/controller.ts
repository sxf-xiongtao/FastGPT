import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { addLog } from '@fastgpt/service/common/system/log';
import { delay, retryFn } from '@fastgpt/global/common/system/utils';
import { MongoUsage } from '@fastgpt/service/support/wallet/usage/schema';
import type { ConcatBillQueueItemType } from '@fastgpt/service/support/wallet/usage/type';
import type { ClientSession } from '@fastgpt/service/common/mongo';
import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import { SubTypeEnum } from '@fastgpt/global/support/wallet/sub/constants';
import { incrTeamPointsCache } from '@fastgpt/service/support/wallet/sub/utils';

const batchUpdateTime = Number(process.env.BATCH_UPDATE_TIME || 3000);

/* 
  amount: min unit
*/
export async function updateTeamBalance({
  teamId,
  amount,
  session
}: {
  teamId: string;
  amount: number;
  session?: ClientSession;
}): Promise<any> {
  if (amount === 0) return;

  addLog.info(`update balance`, {
    teamId,
    amount
  });

  return retryFn(() =>
    MongoTeam.updateOne(
      { _id: teamId },
      {
        $inc: { balance: amount }
      },
      { session }
    )
  );
}

const incTeamAiPoints = async ({
  teamId,
  totalPoints,
  session
}: {
  teamId: string;
  totalPoints: number;
  session?: ClientSession;
}): Promise<any> => {
  if (totalPoints === 0) return;

  addLog.info(`update ai points`, {
    teamId,
    totalPoints
  });
  return retryFn(async () => {
    // 先按日期过期的先扣
    const updateResult = await MongoTeamSub.findOneAndUpdate(
      {
        teamId,
        type: [SubTypeEnum.standard, SubTypeEnum.extraPoints],
        surplusPoints: { $gte: 0 }
      },
      {
        $inc: { surplusPoints: totalPoints }
      },
      { session }
    )
      .sort({
        expiredTime: 1
      })
      .lean();

    // 如果没有一个扣除成功，就直接扣余额多的
    if (!updateResult) {
      await MongoTeamSub.updateOne(
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

    incrTeamPointsCache({
      teamId,
      value: totalPoints
    });
  });
};

export const reduceAiPointsTimer = async () => {
  while (true) {
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

      addLog.info(`Reduce ai points account: ${list.length}`);
    }

    await delay(batchUpdateTime);
  }
};

export const concatBillTimer = async () => {
  while (true) {
    if (global.concatBillQueue.length > 0) {
      const list = global.concatBillQueue.slice();
      global.concatBillQueue = [];

      // concat same billId
      const map = new Map<
        string,
        ConcatBillQueueItemType & {
          inputTokens: number;
          outputTokens: number;
          count: number;
        }
      >();
      list.forEach(
        ({ billId, totalPoints = 0, inputTokens = 0, outputTokens = 0, listIndex, count = 0 }) => {
          const id = `${billId}-${listIndex}`;
          const data = map.get(id);

          if (data) {
            map.set(id, {
              billId,
              totalPoints: data.totalPoints + totalPoints,
              inputTokens: data.inputTokens + inputTokens,
              outputTokens: data.outputTokens + outputTokens,
              count: data.count + count,
              listIndex
            });
          } else {
            map.set(id, {
              billId,
              totalPoints,
              listIndex,
              inputTokens: inputTokens ?? 0,
              outputTokens: outputTokens ?? 0,
              count: count ?? 0
            });
          }
        }
      );

      const concatList = Array.from(map).map(([_, data]) => data);

      try {
        const bulkOps = concatList.map((item) => {
          const { billId, listIndex, totalPoints, inputTokens, outputTokens, count } = item;

          return {
            updateOne: {
              filter: { _id: billId },
              update: {
                time: new Date(),
                $inc: {
                  totalPoints,
                  ...(listIndex !== undefined && {
                    [`list.${listIndex}.amount`]: totalPoints,
                    ...(inputTokens && { [`list.${listIndex}.inputTokens`]: inputTokens }),
                    ...(outputTokens && { [`list.${listIndex}.outputTokens`]: outputTokens }),
                    ...(count && { [`list.${listIndex}.count`]: count })
                  })
                }
              }
            }
          };
        });

        addLog.info(`Concat bill timer: ${concatList.length}`);
        await MongoUsage.bulkWrite(bulkOps, { ordered: false });
      } catch (error) {
        addLog.error('Concat bill error', error);
      }
    }

    await delay(batchUpdateTime);
  }
};
