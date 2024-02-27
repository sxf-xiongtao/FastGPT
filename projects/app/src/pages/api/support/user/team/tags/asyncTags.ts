/**
 * 获取团队标签数据
 * @param{string} teamId
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/service/mongo';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoTeamTags } from '@fastgpt/service/support/user/team/teamTagsSchema';
import axios from 'axios';
type props = {
  teamId: string;
  tagsUrl: string;
};
type tagsType = {
  label: string;
  key: string;
};
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { teamId, tagsUrl } = req.body as props;

    const { data: res } = await axios.get(tagsUrl + '/tag/sync');

    const tagsList = res.data.map((item: tagsType) => {
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
