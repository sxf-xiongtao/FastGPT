import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { TeamManagePermissionVal } from '@fastgpt/global/support/permission/user/constant';
import { MongoMemberGroupModel } from '@fastgpt/service/support/permission/memberGroup/memberGroupSchema';
import { MongoGroupMemberModel } from '@fastgpt/service/support/permission/memberGroup/groupMemberSchema';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { postCreateGroupData } from '@fastgpt/global/support/user/team/group/api';
import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import { parseHeaderCert } from '@fastgpt/service/support/permission/controller';

export type GroupCreateQuery = {};
export type GroupCreateBody = postCreateGroupData;
export type GroupCreateResponse = {};

// Create group
// The user who creates the group must be the owner of the team
async function handler(
  req: ApiRequestProps<GroupCreateBody, GroupCreateQuery>,
  _res: ApiResponseType<any>
): Promise<GroupCreateResponse> {
  const { name, avatar } = req.body;
  const { teamId, tmbId } = await authUserPer({
    req,
    per: TeamManagePermissionVal,
    authToken: true
  });

  if (!name || name.length === 0) {
    return Promise.reject(TeamErrEnum.groupNameEmpty);
  }

  await mongoSessionRun(async (session) => {
    if (
      await MongoMemberGroupModel.findOne(
        {
          teamId,
          name
        },
        undefined,
        {
          session
        }
      )
    ) {
      return Promise.reject(TeamErrEnum.groupNameDuplicate);
    }
    const [group] = await MongoMemberGroupModel.create(
      [
        {
          teamId,
          name,
          avatar
        }
      ],
      {
        session,
        ordered: true
      }
    );

    await MongoGroupMemberModel.create(
      [
        {
          groupId: group._id,
          tmbId: tmbId,
          role: 'owner'
        }
      ],
      { session, ordered: true }
    );
  });

  return {};
}
export default NextAPI(handler);
