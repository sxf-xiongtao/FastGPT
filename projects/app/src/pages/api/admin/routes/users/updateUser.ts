import { MongoUser } from '@fastgpt/service/support/user/schema';
import { NextApiRequest, NextApiResponse } from 'next';

import { adminCert } from '@/service/support/permission/adminCert';
import { NextAPI } from '@/service/middleware/entry';
import { addAuditLog } from '@fastgpt/service/support/user/audit/util';
import { AdminAuditEventEnum } from '@fastgpt/global/support/user/audit/constants';
import { getUserDetail } from '@fastgpt/service/support/user/controller';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authResult = await adminCert({ req, authToken: true });

  const { _id: id, password, status, username } = req.body;

  const oldUser = await MongoUser.findById(id);
  if (!oldUser) {
    throw new Error('用户不存在');
  }

  const result = await MongoUser.findByIdAndUpdate(id, {
    ...(username && { username }),
    ...(password && { password }),
    ...(status !== undefined && { status })
  });

  const userDetail = await getUserDetail({
    tmbId: authResult.tmbId,
    userId: authResult.userId
  });

  (async () => {
    addAuditLog({
      tmbId: authResult.tmbId,
      teamId: userDetail.team.teamId,
      event: AdminAuditEventEnum.ADMIN_UPDATE_USER,
      params: {
        userName: oldUser.username
      }
    });
  })();

  return {
    result
  };
}

export default NextAPI(handler);
