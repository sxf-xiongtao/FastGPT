import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { TeamManagePermissionVal } from '@fastgpt/global/support/permission/user/constant';
import { MongoMemberGroupModel } from '@fastgpt/service/support/permission/memberGroup/memberGroupSchema';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { MongoGroupMemberModel } from '@fastgpt/service/support/permission/memberGroup/groupMemberSchema';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import { DefaultGroupName } from '@fastgpt/global/support/user/team/group/constant';
import { authGroupMemberRole } from '@fastgpt/service/support/permission/memberGroup/controllers';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
import { addAuditLog } from '@fastgpt/service/support/user/audit/util';
import { AuditEventEnum } from '@fastgpt/global/support/user/audit/constants';

export type GroupDeleteQuery = {
  groupId: string;
};
export type GroupDeleteBody = {};
export type GroupDeleteResponse = {};

async function handler(
  req: ApiRequestProps<GroupDeleteBody, GroupDeleteQuery>,
  _res: ApiResponseType<any>
): Promise<GroupDeleteResponse> {
  const { groupId } = req.query;
  if (!groupId) {
    return Promise.reject(CommonErrEnum.missingParams);
  }
  const { teamId, tmbId } = await authGroupMemberRole({
    req,
    per: TeamManagePermissionVal,
    authToken: true,
    groupId,
    role: ['owner']
  });

  const group = await MongoMemberGroupModel.findOne(
    {
      _id: groupId,
      teamId
    },
    { name: 1 }
  ).lean();

  const groupName = group?.name;

  if (!groupName) {
    return Promise.reject(TeamErrEnum.groupNotExist);
  }

  await mongoSessionRun(async (session) => {
    const group = await MongoMemberGroupModel.findOne(
      {
        _id: groupId,
        teamId
      },
      undefined,
      { session }
    ).lean();

    if (!group) {
      return Promise.reject(TeamErrEnum.groupNotExist);
    }

    if (!group.name || group.name === DefaultGroupName) {
      return Promise.reject(TeamErrEnum.cannotDeleteDefaultGroup);
    }

    await MongoMemberGroupModel.deleteOne(
      {
        _id: groupId,
        teamId
      },
      {
        session
      }
    );

    await MongoGroupMemberModel.deleteMany(
      {
        groupId
      },
      {
        session
      }
    );

    await MongoResourcePermission.deleteMany(
      {
        groupId
      },
      {
        session
      }
    );
  });

  addAuditLog({
    tmbId,
    teamId,
    event: AuditEventEnum.DELETE_GROUP,
    params: {
      groupName: groupName
    }
  });

  return {};
}

export default NextAPI(handler);
