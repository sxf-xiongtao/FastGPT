import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { MongoMemberGroupModel } from '@fastgpt/service/support/permission/memberGroup/memberGroupSchema';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { MongoGroupMemberModel } from '@fastgpt/service/support/permission/memberGroup/groupMemberSchema';
import { putUpdateGroupData } from '@fastgpt/global/support/user/team/group/api';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
import { DefaultGroupName } from '@fastgpt/global/support/user/team/group/constant';
import {
  authGroupMemberRole,
  getGroupMembersByGroupId
} from '@fastgpt/service/support/permission/memberGroup/controllers';
import { getTeamMembers } from '@/service/support/user/team/controller';
import { concat } from 'lodash';
import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';

export type GroupUpdateQuery = {};
export type GroupUpdateBody = putUpdateGroupData;
export type GroupUpdateResponse = {};

/* 
   Update the group information
*/
async function handler(
  req: ApiRequestProps<GroupUpdateBody, GroupUpdateQuery>,
  _res: ApiResponseType<any>
): Promise<GroupUpdateResponse> {
  const { groupId, name, avatar, memberList } = req.body;

  if (!groupId) {
    return Promise.reject(CommonErrEnum.missingParams);
  }

  const { teamId } = await (async () => {
    // check if the role changed, if so, we need to check if the user has owner permission
    // Only owner can change the role
    const newOwner = memberList?.find((item) => item.role === 'owner');
    const newAdminList = memberList?.filter((item) => item.role === 'admin');

    const isRoleChanged = await (async () => {
      if (!memberList) return false;
      const oldMemberList = await getGroupMembersByGroupId(groupId);

      if (!newOwner || !newAdminList) return false;
      const isOwnerChanged =
        String(oldMemberList.find((item) => item.role === 'owner')?.tmbId) !==
        String(newOwner.tmbId);
      const isAdminChanged =
        oldMemberList
          .filter((item) => item.role === 'admin')
          .map((item) => String(item.tmbId))
          .toSorted()
          .join(',') !==
        newAdminList
          .map((item) => String(item.tmbId))
          .toSorted()
          .join(',');

      return isOwnerChanged || isAdminChanged;
    })();

    const { teamId } = await (() => {
      if (isRoleChanged) {
        return authGroupMemberRole({
          req,
          authToken: true,
          groupId,
          role: ['owner']
        });
      }
      return authGroupMemberRole({
        req,
        authToken: true,
        groupId,
        role: ['admin', 'owner']
      });
    })();

    // check if the new admin/owner active
    // get all active members
    if (isRoleChanged) {
      const activeMembers = (await getTeamMembers(teamId))
        .filter((item) => item.status === 'active')
        .map((item) => String(item.tmbId));

      if (
        concat(newAdminList, newOwner).some(
          (item) => item && !activeMembers.includes(String(item.tmbId))
        )
      ) {
        return Promise.reject(TeamErrEnum.userNotActive);
      }
    }

    return {
      teamId
    };
  })();

  await mongoSessionRun(async (session) => {
    await MongoMemberGroupModel.updateOne(
      {
        _id: groupId,
        teamId,
        name: { $ne: DefaultGroupName } // can not update the default group
      },
      {
        name,
        avatar
      },
      {
        session
      }
    );

    if (!memberList) return;
    // delete all the group members and then add the new ones
    await MongoGroupMemberModel.deleteMany(
      {
        groupId
      },
      { session }
    );
    await MongoGroupMemberModel.create(
      memberList.map((item) => ({
        groupId,
        tmbId: item.tmbId,
        role: item.role
      })),
      { session }
    );
  });

  return {};
}
export default NextAPI(handler);
