import { connectToDatabase } from '@/service/mongo';
import { adminCert } from '@/service/support/permission/adminCert';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { NextApiRequest, NextApiResponse } from 'next';
import dayjs from 'dayjs';

export const PRICE_SCALE = 100000;

export const formatPrice = (val = 0, multiple = 1) => {
  return Number(((val / PRICE_SCALE) * multiple).toFixed(10));
};

export default async function getUsers(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await adminCert({ req, authToken: true });

    const start = parseInt(req.query._start as string) || 0;
    const end = parseInt(req.query._end as string) || 20;
    const userId = (req.query.id as string) || '';

    const where = userId
      ? {
          _id: Object(userId)
        }
      : {};

    const usersRaw: any = await MongoUser.find(where)
      .skip(start)
      .limit(end - start);

    const users = await Promise.all(
      usersRaw.map(async (user: any) => {
        const tmb = await MongoTeamMember.find({ userId: user._id });
        const owner = tmb.find((tmb) => tmb.role === 'owner');
        const teams = await Promise.all(
          tmb.map(async (tmb) => await MongoTeam.findOne({ _id: tmb.teamId }))
        );

        const ownerTeam = teams.find((team) => team?._id.toString() === owner?.teamId.toString());

        return {
          userId: user._id,
          id: owner?._id,
          avatar: user.avatar,
          teams: teams.map((team) => team?.name),
          username: user.username,
          balance: formatPrice(ownerTeam?.balance),
          createTime: dayjs(user.createTime).format('YYYY/MM/DD HH:mm')
        };
      })
    );

    const totalCount = await MongoUser.countDocuments(where);

    jsonRes(res, {
      data: {
        users,
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
