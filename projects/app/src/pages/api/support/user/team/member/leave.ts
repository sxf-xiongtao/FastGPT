import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import {
  TeamMemberRoleEnum,
  TeamMemberStatusEnum
} from '@fastgpt/global/support/user/team/constant';
import { NextAPI } from '@/service/middleware/entry';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { teamId } = req.query as { teamId: string };
  const { userId } = await authCert({ req, authToken: true });

  // Can not leave default team or owner team
  await MongoTeamMember.findOneAndUpdate(
    {
      teamId,
      userId,
      role: { $ne: TeamMemberRoleEnum.owner }
    },
    {
      status: TeamMemberStatusEnum.leave
    }
  );
}

export default NextAPI(handler);
