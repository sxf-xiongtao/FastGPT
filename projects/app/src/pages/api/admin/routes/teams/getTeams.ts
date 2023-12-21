import { connectToDatabase } from '@/service/mongo';
import { adminCert } from '@/service/support/permission/adminCert';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import dayjs from 'dayjs';
import { NextApiRequest, NextApiResponse } from 'next';

export const PRICE_SCALE = 100000;

export const formatPrice = (val = 0, multiple = 1) => {
  return Number(((val / PRICE_SCALE) * multiple).toFixed(10));
};

export default async function getTeams(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await adminCert({ req, authToken: true });

    const start = parseInt(req.query._start as string) || 0;
    const end = parseInt(req.query._end as string) || 20;
    const teamId = (req.query.id as string) || '';

    const where = {
      $or: [
        teamId
          ? {
              _id: Object(teamId)
            }
          : {},
        teamId ? { ownerId: teamId } : {}
      ]
    };

    const teamsRaw: any = await MongoTeam.find(where)
      .skip(start)
      .limit(end - start);

    const teams = await Promise.all(
      teamsRaw.map(async (team: any) => {
        const owner = await MongoUser.find({
          _id: team.ownerId
        });

        return {
          id: team._id,
          ownerId: team.ownerId,
          name: team.name,
          balance: formatPrice(team.balance),
          maxSize: team.maxSize,
          createTime: dayjs(team.createTime).format('YYYY/MM/DD HH:mm'),
          owner: owner
        };
      })
    );

    const totalCount = await MongoTeam.countDocuments(where);

    jsonRes(res, {
      data: {
        teams,
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
