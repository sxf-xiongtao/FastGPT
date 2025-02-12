import { adminCert } from '@/service/support/permission/adminCert';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { NextApiRequest, NextApiResponse } from 'next';
import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { PaginationResponse } from '@fastgpt/web/common/fetch/type';
import { NextAPI } from '@/service/middleware/entry';

type ResponseType = PaginationResponse<any>;

async function handler(req: NextApiRequest, res: NextApiResponse): Promise<ResponseType> {
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
        _id: team?.ownerId
      });

      return {
        id: plan._id,
        type: plan.type,
        level: plan.currentSubLevel,
        totalPoints: plan.totalPoints,
        surplusPoints: plan.surplusPoints,
        extraDatasetSize: plan.currentExtraDatasetSize,
        startTime: plan.startTime,
        expiredTime: plan.expiredTime,
        teamName: team?.name,
        teamId: plan.teamId,
        userName: owner?.username
      };
    })
  );

  return {
    list: plans,
    total
  };
}

export default NextAPI(handler);
