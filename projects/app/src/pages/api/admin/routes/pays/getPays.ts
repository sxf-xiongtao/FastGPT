import { connectToDatabase } from '@/service/mongo';
import { adminCert } from '@/service/support/permission/adminCert';
import { jsonRes } from '@fastgpt/service/common/response';
import { NextApiRequest, NextApiResponse } from 'next';
import { MongoBill } from '@/service/support/wallet/bill/schema';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { BillTypeEnum } from '@fastgpt/global/support/wallet/bill/constants';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';

export default async function getPays(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await adminCert({ req, authToken: true });

    const {
      pageNum = 1,
      pageSize = 20,
      type,
      username
    } = req.body as {
      pageNum: number;
      pageSize: number;
      type?: `${BillTypeEnum}`;
      username: string;
    };

    const users = await MongoUser.find({ username: new RegExp(username, 'i') });
    const userIds = users.map((user) => user._id);

    const tmbs = await MongoTeamMember.find({ userId: { $in: userIds } });
    const tmbIds = tmbs.map((tmb) => tmb._id);

    const match = {
      status: { $ne: 'CLOSED' },
      ...(type && { type }),
      tmbId: { $in: tmbIds }
    };

    const [records, total] = await Promise.all([
      MongoBill.find(match)
        .sort({ createTime: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize),
      MongoBill.countDocuments(match)
    ]);

    const newRecords = await Promise.all(
      records.map(async (record) => {
        const tmbId = record.tmbId;
        const tmb = await MongoTeamMember.findOne({ _id: tmbId });
        const userId = tmb?.userId;
        const user = await MongoUser.findOne({ _id: userId });
        return {
          ...record.toObject(),
          username: user?.username
        };
      })
    );

    jsonRes(res, {
      data: {
        pageNum,
        pageSize,
        data: newRecords,
        total
      }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
