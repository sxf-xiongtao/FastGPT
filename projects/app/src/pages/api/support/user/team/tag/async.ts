/**
 * 获取团队标签数据
 * @param{string} teamId
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { loadTagsFromDomain } from '@/service/support/user/team/tagController';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { MongoTeamTags } from '@fastgpt/service/support/user/team/teamTagsSchema';
import { NextAPI } from '@/service/middleware/entry';
import { authMember } from '@/service/support/permission/team/auth';
import { ManagePermissionVal } from '@fastgpt/global/support/permission/constant';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { domain } = req.query as { domain: string };

  if (!domain) {
    throw new Error('domain is required');
  }

  const { teamId } = await authMember({ req, authToken: true, per: ManagePermissionVal });
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
}

export default NextAPI(handler);
