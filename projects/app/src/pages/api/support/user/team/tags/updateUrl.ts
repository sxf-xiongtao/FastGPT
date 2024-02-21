/**
 * 获取团队标签数据
 * @param{string} teamId
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/service/mongo';
import { jsonRes } from '@fastgpt/service/common/response';
import { updateTagsUrl } from '@/service/support/user/teamTags/controller';
import { updateTeamTagsUrl } from '@/service/support/user/team/controller';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { teamId, tagsUrl } = req.body;
    // update team  tags by teamId
    return jsonRes(res, {
      data: await updateTeamTagsUrl({ teamId, tagsUrl })
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
