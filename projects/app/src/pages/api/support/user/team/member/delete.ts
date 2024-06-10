import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { getTeamMember, removeUser } from '@/service/support/user/team/controller';
import { DelMemberProps } from '@fastgpt/global/support/user/team/controller';
import { authMemberPermission } from '@/service/support/permission/team/auth';
import {
  ManagePermissionVal,
  OwnerPermissionVal
} from '@fastgpt/global/support/permission/constant';
import { NextAPI } from '@/service/middleware/entry';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { memberId } = req.query as DelMemberProps;
  const { teamId, tmbId } = await authCert({ req, authToken: true });

  // get member permission
  const member = await getTeamMember({
    teamId,
    tmbId: memberId
  });

  if (member.permission.hasManagePer) {
    await authMemberPermission({ teamId, tmbId, permission: OwnerPermissionVal });
  } else {
    await authMemberPermission({ teamId, tmbId, permission: ManagePermissionVal });
  }

  await removeUser({
    teamId,
    memberId
  });

  jsonRes(res, {});
}

export default NextAPI(handler);
