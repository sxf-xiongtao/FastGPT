import { connectToDatabase } from '@/service/mongo';
import { adminCert } from '@/service/support/permission/adminCert';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { NextApiRequest, NextApiResponse } from 'next';
import { formatStorePrice2Read } from '@fastgpt/global/support/wallet/usage/tools';

export default async function getTeams(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await adminCert({ req, authToken: true });

    const {
      pageNum = 1,
      pageSize = 20,
      search
    } = req.body as {
      pageNum: number;
      pageSize: number;
      search: string;
    };

    const users = await MongoUser.find({
      username: new RegExp(search, 'i')
    });

    const match = {
      $or: [{ name: new RegExp(search, 'i') }, { ownerId: { $in: users.map((user) => user._id) } }]
    };

    const [records, total] = await Promise.all([
      MongoTeam.find(match)
        .sort({ createTime: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize),
      MongoTeam.countDocuments(match)
    ]);

    const teams = await Promise.all(
      records.map(async (team) => {
        const owner = await MongoUser.find({
          _id: team.ownerId
        });

        return {
          id: team._id,
          name: team.name,
          balance: formatStorePrice2Read(team.balance),
          createTime: team.createTime,
          owner: owner,
          ownerName: owner[0]?.username
        };
      })
    );

    jsonRes(res, {
      data: {
        pageNum,
        pageSize,
        data: teams,
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
