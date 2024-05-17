import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { removeUser } from '@/service/support/user/team/controller';
import { DelMemberProps } from '@fastgpt/global/support/user/team/controller';
import { authMemberPermission } from '@/service/support/user/team/auth';
import { PermissionList } from '@fastgpt/service/support/permission/resourcePermission/permisson';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { memberId } = req.query as DelMemberProps;
    await connectToDatabase();
    const { tmbId } = await authCert({ req, authToken: true });

    await authMemberPermission({ tmbId, permission: PermissionList['Manage'] });

    await removeUser(memberId);

    jsonRes(res, {});
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
