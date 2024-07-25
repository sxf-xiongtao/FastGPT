import type { NextApiRequest, NextApiResponse } from 'next';
import {
  ManagePermissionVal,
  OwnerPermissionVal,
  PerResourceTypeEnum
} from '@fastgpt/global/support/permission/constant';
import { NextAPI } from '@/service/middleware/entry';
import { authMemberPermission } from '@/service/support/permission/team/auth';
import { updateResourcePermission } from '@/service/support/permission/controller';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { TeamPermission } from '@fastgpt/global/support/permission/user/controller';
import { UpdateClbPermissionProps } from '@fastgpt/global/support/permission/collaborator';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';

// update permission of team member
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { tmbIds, permission } = req.body as UpdateClbPermissionProps;

  const { teamId, tmbId } = await authCert({ req, authToken: true });

  const Per = new TeamPermission({ per: permission });

  await authMemberPermission({
    teamId,
    tmbId,
    permission: Per.hasManagePer ? OwnerPermissionVal : ManagePermissionVal
  });

  return updateResourcePermission({
    resourceType: PerResourceTypeEnum.team,
    teamId,
    tmbIdList: tmbIds,
    permission
  });
}

export default NextAPI(handler);
