import { adminCert } from '@/service/support/permission/adminCert';
import { createUserByUsername } from '@/service/support/user/controller';
import { getTeamByUsername } from '@/service/support/user/team/controller';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import type { NextApiRequest, NextApiResponse } from 'next';
import { addAuditLog } from '@fastgpt/service/support/user/audit/util';
import { AdminAuditEventEnum } from '@fastgpt/global/support/user/audit/constants';
import { getUserDetail } from '@fastgpt/service/support/user/controller';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const authResult = await adminCert({ req, authToken: true });

    const { username, password } = req.body;
    if (!username || !password) {
      throw new Error('缺少字段');
    }

    const existingUser = await MongoUser.findOne({ username });

    if (existingUser) {
      // check tmb
      const tmb = await MongoTeamMember.findOne({ userId: existingUser._id });

      if (tmb) {
        throw new Error('用户已存在');
      }
    }

    const user = await createUserByUsername({
      username,
      password
    });

    const userDetail = await getUserDetail({
      tmbId: authResult.tmbId,
      userId: authResult.userId
    });

    (async () => {
      addAuditLog({
        tmbId: authResult.tmbId,
        teamId: userDetail.team.teamId,
        event: AdminAuditEventEnum.ADMIN_ADD_USER,
        params: {
          userName: username
        }
      });
    })();

    jsonRes(res, {
      data: {
        userId: user._id,
        teamId: user.team.teamId
      }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
