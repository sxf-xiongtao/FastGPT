/**
 * 获取团队标签数据
 * @param{string} teamId
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/service/mongo';
import { jsonRes } from '@fastgpt/service/common/response';
import { insertUserTeamsTags } from '@/service/support/user/teamTags/controller';
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { tags } = req.body;
    // get team tags by teamId
    jsonRes(res, {
      data: { list: await insertUserTeamsTags(tags) }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err,
      data: req.body
    });
  }
}
