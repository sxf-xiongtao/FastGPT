import type { NextApiRequest, NextApiResponse } from 'next';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { NextAPI } from '@/service/middleware/entry';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
import { addOperationLog } from '@fastgpt/service/support/operationLog/addOperationLog';
import { OperationLogEventEnum } from '@fastgpt/global/support/operationLog/constants';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { name } = req.body as { name: string };
  const { tmbId, teamId } = await authCert({ req, authToken: true });

  if (!name) {
    return Promise.reject(CommonErrEnum.missingParams);
  }
  const oldName = await MongoTeamMember.findOne({ _id: tmbId }, { name: 1 })
    .lean()
    .then((doc) => {
      if (!doc) {
        throw new Error('Member not found');
      }
      return doc.name;
    });

  await MongoTeamMember.findByIdAndUpdate(tmbId, {
    name: name.slice(0, 20)
  });

  (async () => {
    addOperationLog({
      tmbId,
      teamId,
      event: OperationLogEventEnum.CHANGE_MEMBER_NAME_ACCOUNT,
      params: {
        oldName: oldName,
        newName: name.slice(0, 20)
      }
    });
  })();
}
export default NextAPI(handler);
