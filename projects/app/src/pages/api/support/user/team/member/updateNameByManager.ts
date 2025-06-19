import type { NextApiRequest, NextApiResponse } from 'next';
import { NextAPI } from '@/service/middleware/entry';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { TeamManagePermissionVal } from '@fastgpt/global/support/permission/user/constant';
import { sendInform2OneUser } from '@/service/support/user/inform/controller';
import { InformLevelEnum } from '@fastgpt/global/support/user/inform/constants';
import { addAuditLog } from '@fastgpt/service/support/user/audit/util';
import { AuditEventEnum } from '@fastgpt/global/support/user/audit/constants';

async function handler(req: NextApiRequest, _res: NextApiResponse) {
  const { tmbId: memberId, name: newName } = req.body as { tmbId: string; name: string };

  const { teamId, tmb, tmbId } = await authUserPer({
    per: TeamManagePermissionVal,
    req,
    authToken: true
  });

  if (!newName) {
    throw new Error('name is required');
  }

  const oldName = await MongoTeamMember.findOne({ _id: memberId }, { name: 1 })
    .lean()
    .then((doc) => {
      if (!doc) {
        throw new Error('Member not found');
      }
      return doc.name;
    });

  const userId = await MongoTeamMember.findOne({ _id: memberId }, { userId: 1 })
    .lean()
    .then((doc) => {
      if (!doc) {
        throw new Error('Can not find user document');
      }
      return doc.userId;
    });

  const managerName = tmb.memberName;

  await MongoTeamMember.updateOne({ teamId, _id: memberId }, { name: newName.slice(0, 50) });

  sendInform2OneUser({
    level: InformLevelEnum.common,
    templateCode: 'MANAGE_RENAME',
    templateParam: { managerName, newName },
    teamId,
    userId
  });

  addAuditLog({
    tmbId,
    teamId,
    event: AuditEventEnum.CHANGE_MEMBER_NAME,
    params: {
      memberName: oldName,
      newName
    }
  });
}
export default NextAPI(handler);
