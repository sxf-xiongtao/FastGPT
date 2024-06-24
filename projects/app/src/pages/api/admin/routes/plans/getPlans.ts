import { connectToDatabase } from '@/service/mongo';
import { adminCert } from '@/service/support/permission/adminCert';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { NextApiRequest, NextApiResponse } from 'next';
import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';

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
    const teams = await MongoTeam.find({ ownerId: { $in: users.map((user) => user._id) } });

    const [records, total] = await Promise.all([
      MongoTeamSub.find({ teamId: { $in: teams.map((team) => team._id) } })
        .sort({ startTime: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize),
      MongoTeamSub.countDocuments({ teamId: { $in: teams.map((team) => team._id) } })
    ]);

    const plans = await Promise.all(
      records.map(async (plan) => {
        const team = await MongoTeam.findOne({
          _id: plan.teamId
        });

        if (!team) return Promise.reject('团队不存在');

        const owner = await MongoUser.findOne({
          _id: team.ownerId
        });

        return {
          id: plan._id,
          planLevel: plan.currentSubLevel,
          totalPoints: plan.totalPoints,
          surplusPoints: plan.surplusPoints,
          startTime: plan.startTime,
          expiredTime: plan.expiredTime,
          teamName: team.name,
          userName: owner?.username
        };
      })
    );

    jsonRes(res, {
      data: {
        pageNum,
        pageSize,
        data: plans,
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
