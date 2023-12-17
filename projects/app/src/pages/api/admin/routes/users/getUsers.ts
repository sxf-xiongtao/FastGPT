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
    const order = req.query._order === 'DESC' ? -1 : 1;
    const sort = req.query._sort === 'id' ? '_id' : req.query._sort || '_id';
    const username = (req.query.username as string) || '';

    const where = username
      ? {
          username: new RegExp(username, 'i')
        }
      : {};

    const usersRaw: any = await MongoUser.find(where)
      .skip(start)
      .limit(end - start);
    // .sort({ [sort]: order });

    const tmbs = await MongoTeamMember.find({
      userId: { $in: usersRaw.map((user: any) => user._id) }
    });

    const teams: any = await MongoTeam.find({
      _id: { $in: tmbs.map((tmb) => tmb.teamId) }
    });

    const users = tmbs.map((tmb, i) => {
      const user = usersRaw
        .find((user: any) => user?._id.toString() === tmb.userId.toString())
        .toObject();
      const team = teams
        .find((team: any) => team._id.toString() === tmb.teamId.toString())
        .toObject();

      return {
        id: tmb._id,
        username: user.username,
        balance: formatPrice(team.balance),
        teamName: team.name,
        maxSize: team.maxSize,
        createTime: dayjs(user.createTime).format('YYYY/MM/DD HH:mm'),
        password: ''
      };
    });

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
