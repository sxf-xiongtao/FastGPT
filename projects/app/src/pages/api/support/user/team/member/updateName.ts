import type { NextApiRequest, NextApiResponse } from 'next';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { NextAPI } from '@/service/middleware/entry';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
import { addAuditLog } from '@fastgpt/service/support/user/audit/util';
import { AuditEventEnum } from '@fastgpt/global/support/user/audit/constants';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { name } = req.body as { name: string };
  const { tmbId, teamId } = await authCert({ req, authToken: true });

  if (!name) {
    return Promise.reject(CommonErrEnum.missingParams);
  }
  const oldName = await MongoTeamMember.findOne({ _id: tmbId }, { name: 1 })
    .lean()
    .then((doc) => {
      return doc?.name || '';
    });

  const newName = name.slice(0, 50);
  await MongoTeamMember.findByIdAndUpdate(tmbId, {
    name: newName
  });

  (async () => {
    addAuditLog({
      tmbId,
      teamId,
      event: AuditEventEnum.CHANGE_MEMBER_NAME_ACCOUNT,
      params: {
        oldName: oldName,
        newName
      }
    });
  })();
}
export default NextAPI(handler);
