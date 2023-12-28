import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { addLog } from '@fastgpt/service/common/system/log';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { MongoDatasetData } from '@fastgpt/service/core/dataset/data/schema';
import { createBill } from './createBill';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { BillSourceEnum } from '@fastgpt/global/support/wallet/bill/constants';
import { delay } from '@fastgpt/global/common/system/utils';

let datasetTotal = 0;
let successUsers = 0;
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await authCert({ req, authRoot: true });
    const { limit = 50 } = req.body as { limit: number };
    datasetTotal = 0;
    successUsers = 0;

    // get teams. 23小时前的
    const lastTimes = Date.now() - 23 * 60 * 60 * 1000;
    const where = {
      $or: [
        { lastDatasetBillTime: { $exists: false } },
        { lastDatasetBillTime: { $lt: new Date(lastTimes) } }
      ]
    };
    const totalUser = await MongoTeam.countDocuments(where);
    console.log('totalUser', totalUser);

    await delay(1000);

    await getTeamDatasetStoreBill(where, limit);

    console.log(`datasetTotal: ${datasetTotal}`);

    jsonRes(res);
  } catch (err) {
    addLog.error('Concat Bill Error', err);
    jsonRes(res);
  }
}

const getTeamDatasetStoreBill = async (where: any, limit: number): Promise<any> => {
  const teams = await MongoTeam.find(where, '_id').limit(limit).lean();

  if (teams.length === 0) return;

  for await (const team of teams) {
    try {
      // find owner
      const teamOwner = await MongoTeamMember.findOne(
        { teamId: team._id, role: 'owner' },
        '_id teamId'
      ).lean();
      if (!teamOwner) {
        await MongoTeam.findByIdAndUpdate(team._id, { lastDatasetBillTime: new Date() });
        continue;
      }

      // 统计该teamId下 dataset.data 里的 indexes 总和(是一个数组)
      const data = await MongoDatasetData.aggregate([
        { $match: { teamId: team._id } },
        { $unwind: '$indexes' },
        { $group: { _id: null, total: { $sum: 1 } } }
      ]);
      const totalVector = data[0]?.total || 0;

      datasetTotal += totalVector;
      const amount = totalVector * 0;

      const billProps = {
        teamId: teamOwner.teamId,
        tmbId: teamOwner._id,
        appName: 'wallet.bill.Dataset store',
        total: amount,
        source: BillSourceEnum.fastgpt,
        list: [
          {
            moduleName: 'wallet.bill.Dataset store',
            amount,
            dataLen: totalVector
          }
        ]
      };

      // update team bill time
      await MongoTeam.findByIdAndUpdate(team._id, { lastDatasetBillTime: new Date() });
      // create bill
      await createBill(billProps);

      successUsers++;
      successUsers % 100 === 0 && console.log(`successUsers: ${successUsers}`);
    } catch (error) {
      console.log(error);
    }
  }

  return getTeamDatasetStoreBill(where, limit);
};
