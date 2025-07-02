// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoUserInform } from '@/service/support/user/inform/schema';
import { readFromSecondary } from '@fastgpt/service/common/mongo/utils';
import { NextAPI } from '@/service/middleware/entry';
import type { PaginationResponse } from '@fastgpt/web/common/fetch/type';
import type { UserInformSchema } from '@fastgpt/global/support/user/inform/type';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<PaginationResponse<UserInformSchema>> {
  const { userId } = await authCert({ req, authToken: true });

  const { pageNum, pageSize = 20 } = req.body as {
    pageNum: number;
    pageSize: number;
  };

  const [oldInforms, total] = await Promise.all([
    MongoUserInform.find({ userId }, undefined, { ...readFromSecondary })
      .sort({ read: 1, time: -1 }) // 按照创建时间倒序排列
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize),
    MongoUserInform.countDocuments({ userId }, { ...readFromSecondary })
  ]);

  const teamIds = new Set(oldInforms.flatMap((item) => (item.teamId ? [String(item.teamId)] : [])));
  const teams = await MongoTeam.find({ _id: { $in: Array.from(teamIds) } }, 'name _id').lean();

  const teamMap = new Map(teams.map((item) => [String(item._id), item.name]));

  const informs = oldInforms.map((item) => {
    const plainItem = item.toObject();
    return {
      ...plainItem,
      teamName: item.teamId ? teamMap.get(String(item.teamId)) : undefined
    };
  });

  return {
    list: informs,
    total
  };
}

export default NextAPI(handler);
