import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { authGroupMemberRole } from '@fastgpt/service/support/permission/memberGroup/controllers';
import { MongoGroupMemberModel } from '@fastgpt/service/support/permission/memberGroup/groupMemberSchema';
import { MongoMemberGroupModel } from '@fastgpt/service/support/permission/memberGroup/memberGroupSchema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { GroupMemberRole } from '@fastgpt/global/support/permission/memberGroup/constant';

export type GroupChangeOwnerQuery = {};
export type GroupChangeOwnerBody = {
  groupId: string;
  tmbId: string;
};
export type GroupChangeOwnerResponse = {};

async function handler(
  req: ApiRequestProps<GroupChangeOwnerBody, GroupChangeOwnerQuery>,
  res: ApiResponseType<any>
): Promise<GroupChangeOwnerResponse> {
  const { groupId, tmbId } = req.body;

  const { teamId } = await authGroupMemberRole({
    req,
    authToken: true,
    groupId,
    role: ['owner']
  });

  const [group, tmb] = await Promise.all([
    MongoMemberGroupModel.findById(groupId).lean(),
    MongoTeamMember.findById(tmbId).lean()
  ]);

  if (!tmb || String(tmb.teamId) !== String(teamId)) {
    Promise.reject(new Error('invalid team member'));
  }

  if (!group) {
    Promise.reject(new Error('invalid group'));
  }

  await mongoSessionRun(async (session) => {
    await MongoGroupMemberModel.updateOne(
      {
        groupId,
        role: GroupMemberRole.owner
      },
      {
        role: GroupMemberRole.admin
      },
      {
        session
      }
    );
    await MongoGroupMemberModel.updateOne(
      {
        groupId,
        tmbId
      },
      {
        role: GroupMemberRole.owner
      },
      {
        session,
        upsert: true
      }
    );
  });

  return {};
}
export default NextAPI(handler);
