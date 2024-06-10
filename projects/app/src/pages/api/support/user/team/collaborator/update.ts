import type { NextApiRequest, NextApiResponse } from 'next';
import { UpdateTeamMemberPermissionProps } from '@fastgpt/global/support/user/team/controller';
import {
  OwnerPermissionVal,
  PerResourceTypeEnum
} from '@fastgpt/global/support/permission/constant';
import { NextAPI } from '@/service/middleware/entry';
import { authMember } from '@/service/support/permission/team/auth';
import { updateResourcePermission } from '@fastgpt/service/support/permission/controller';

// update permission of team member
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { memberIds, permission } = req.body as UpdateTeamMemberPermissionProps;

  const { teamId } = await authMember({ req, authToken: true, per: OwnerPermissionVal });

  return updateResourcePermission({
    resourceType: PerResourceTypeEnum.team,
    teamId,
    tmbIdList: memberIds,
    permission
  });
}

export default NextAPI(handler);
