import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { authTeamRole, getTeamMembers } from '@/service/support/user/team/controller';
import type { TeamMemberItemType } from '@fastgpt/global/support/user/team/type.d';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { teamId } = req.query as { teamId: string };
    await connectToDatabase();
    const { tmbId } = await authCert({ req, authToken: true });

    await authTeamRole({ teamId, tmbId });

    jsonRes<TeamMemberItemType[]>(res, {
      data: await getTeamMembers(teamId)
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
