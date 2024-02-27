import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import { SubStatusEnum, SubTypeEnum } from '@fastgpt/global/support/wallet/sub/constants';
import { calculateDaysBetweenDates } from '@fastgpt/global/common/math/date';
import { MongoBill } from '@/service/support/wallet/bill/schema';
import { BillTypeEnum } from '@fastgpt/global/support/wallet/bill/constants';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { delay } from '@fastgpt/global/common/system/utils';
import { initTeamSubPlan2Free, getExtraDatasetSizePrice } from '@/service/support/wallet/sub/utils';

/* 初始化旧的订阅字段 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await authCert({ req, authRoot: true });
    await connectToDatabase();

    // 更新 pay 的type成balance
    await MongoBill.updateMany(
      { type: { $exists: false } },
      { $set: { type: BillTypeEnum.balance } }
    );

    jsonRes(res, {
      data: {
        teamLength: await addTeamDefaultSub(),
        updateSubModeLength: await updateSubMode()
      },
      message: 'success'
    });
  } catch (error) {
    console.log(error);

    jsonRes(res, {
      code: 500,
      error
    });
  }
}

const addTeamDefaultSub = async () => {
  const allTeamId = await MongoTeam.find({}, '_id');
  console.log('total team', allTeamId.length);
  let success = 0;

  const addFreeSub = async (teamId: string): Promise<any> => {
    try {
      const sub = await MongoTeamSub.countDocuments({ teamId, type: SubTypeEnum.standard });
      if (sub > 0) {
        console.log(++success);
        return;
      }
      await initTeamSubPlan2Free({
        teamId
      });
    } catch (error) {
      console.log('add free sub error');
      console.log(error);
      await delay(1000);
      return addFreeSub(teamId);
    }
    console.log(++success);
  };

  for await (const { _id } of allTeamId) {
    await addFreeSub(_id);
  }

  return allTeamId.length;
};

const updateSubMode = async () => {
  const allSubs = await MongoTeamSub.find(
    {
      mode: { $exists: true },
      currentMode: { $exists: false }
    },
    '_id mode'
  );

  console.log('total team', allSubs.length);
  let success = 0;

  const updateSub = async (sub: any): Promise<any> => {
    try {
      await MongoTeamSub.findByIdAndUpdate(sub._id, {
        currentMode: sub.mode,
        nextMode: sub.mode
      });
    } catch (error) {
      console.log('update sub mode error');
      console.log(error);
      await delay(1000);
      return updateSub(sub);
    }
    console.log(++success);
  };

  for await (const sub of allSubs) {
    await updateSub(sub);
  }
  return allSubs.length;
};
