/**
 * 获取团队标签数据
 * @param{string} teamId
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/service/mongo';
import { jsonRes } from '@fastgpt/service/common/response';
import { getUserTeamsTags, getTeamsInfo } from '@/service/support/user/teamTags/controller';
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { teamId } = req.query;
    // get team tags by teamId
    jsonRes(res, {
      data: {
        list: await getUserTeamsTags({ teamId }),
        tagsUrl: await getTeamsInfo(teamId)
      }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
