/**
 * 获取团队标签数据
 * @param{string} teamId
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/service/mongo';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoTeamTags } from '@fastgpt/service/support/user/team/teamTagsSchema';
import axios from 'axios';
import { getUserTeamsTags, getTeamsInfo } from '@/service/support/user/teamTags/controller';
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { teamId, tagsUrl } = req.body;
    console.log(' req.body', req.body);

    const res2 = await axios.get(tagsUrl + '/tag/sync');

    const tagsList = res2.data.map((item: any) => {
      return { ...item, teamId };
    });
    if (teamId) {
      await MongoTeamTags.deleteMany({ teamId: teamId });
      await MongoTeamTags.create(tagsList);
    }

    // get team tags by teamId
    jsonRes(res, {
      data: tagsList
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
