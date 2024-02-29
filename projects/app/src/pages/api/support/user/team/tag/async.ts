/**
 * 获取团队标签数据
 * @param{string} teamId
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/service/mongo';
import { jsonRes } from '@fastgpt/service/common/response';
import { loadTagsFromDomain } from '@/service/support/user/team/tagController';
import { authUserNotVisitor } from '@fastgpt/service/support/permission/auth/user';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { MongoTeamTags } from '@fastgpt/service/support/user/team/teamTagsSchema';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { domain } = req.query as { domain: string };

    if (!domain) {
      throw new Error('domain is required');
    }

    const { teamId } = await authUserNotVisitor({ req, authToken: true });
    const tags = await loadTagsFromDomain(domain);

    await mongoSessionRun(async (session) => {
      await MongoTeamTags.deleteMany({ teamId }, { session });
      await MongoTeamTags.insertMany(
        tags.map((tag) => ({ ...tag, teamId })),
        { session }
      );
    });

    // get team tags by teamId
    jsonRes(res, {
      data: tags
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
