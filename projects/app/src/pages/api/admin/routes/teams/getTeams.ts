import { connectToDatabase } from '@/service/mongo';
import { adminCert } from '@/service/support/permission/adminCert';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { NextApiRequest, NextApiResponse } from 'next';
import { TeamSchema as TeamType } from '@fastgpt/global/support/user/team/type';
import { formatStorePrice2Read } from '@fastgpt/global/support/wallet/usage/tools';

export default async function getTeams(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await adminCert({ req, authToken: true });

    const start = parseInt(req.query._start as string) || 0;
    const end = parseInt(req.query._end as string) || 20;
    const search = (req.query.search as string) || '';

    let where: any = {
      name: new RegExp(search, 'i')
    };

    if (search !== '') {
      const usersRaw = await MongoUser.find(
        {
          username: new RegExp(search, 'i')
        },
        '_id'
      );

      const userIds = usersRaw.map((user) => user._id);

      where = {
        $or: [{ name: new RegExp(search, 'i') }, { ownerId: { $in: userIds } }]
      };
    }

    const teamsRaw: TeamType[] = await MongoTeam.find(where)
      .sort({ createTime: -1 })
      .skip(start)
      .limit(end - start);

    const teams = await Promise.all(
      teamsRaw.map(async (team) => {
        const owner = await MongoUser.find({
          _id: team.ownerId
        });

        return {
          id: team._id,
          name: team.name,
          balance: formatStorePrice2Read(team.balance),
          maxSize: team.maxSize,
          createTime: team.createTime,
          owner: owner,
          ownerName: owner[0].username
        };
      })
    );

    const totalCount = await MongoTeam.countDocuments(where);

    jsonRes(res, {
      data: {
        teams: teams,
        total: totalCount
      }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
