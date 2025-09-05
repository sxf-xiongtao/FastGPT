import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { adminCert } from '@/service/support/permission/adminCert';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { delUserAllSession } from '@fastgpt/service/support/user/session';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { MongoGroupMemberModel } from '@fastgpt/service/support/permission/memberGroup/groupMemberSchema';
import { MongoMemberGroupModel } from '@fastgpt/service/support/permission/memberGroup/memberGroupSchema';
import { MongoOrgModel } from '@fastgpt/service/support/permission/org/orgSchema';
import { MongoOrgMemberModel } from '@fastgpt/service/support/permission/org/orgMemberSchema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoImage } from '@fastgpt/service/common/file/image/schema';
import { MongoDataset } from '@fastgpt/service/core/dataset/schema';
import { deleteDatasets } from '@fastgpt/service/core/dataset/controller';
import { MongoApp } from '@fastgpt/service/core/app/schema';
import { onDelOneApp } from '@fastgpt/service/core/app/controller';
import { MongoOpenApi } from '@fastgpt/service/support/openapi/schema';
import { MongoTeamTags } from '@fastgpt/service/support/user/team/teamTagsSchema';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';
import { MongoUserInform } from '@/service/support/user/inform/schema';
import { removeUserFromTeam } from '@/service/support/user/controller';

export type unRegisterQuery = {};

export type unRegisterBody = {
  username: string;
};

export type unRegisterResponse = {};

/* 
    账号注销：
    1. 把账号名末尾加一个 deleted
    2. 清除资源：
    
        user表联系方式
        team表联系方式

        图片
        知识库
        应用
        API key
        通知

        所有团队成员删除，并删除 session
*/

async function handler(
  req: ApiRequestProps<unRegisterBody, unRegisterQuery>,
  res: ApiResponseType<any>
): Promise<unRegisterResponse> {
  await adminCert({ req, authToken: true });
  const { username } = req.body;

  if (username.endsWith('deleted')) {
    return Promise.reject('账号已经注销了');
  }

  // User
  const user = await MongoUser.findOne({ username });
  if (!user) return Promise.reject('找不到 user');
  user.contact = '';
  user.username = `${username}-deleted`;
  await user.save();

  // Team
  const teams = await MongoTeam.find({
    ownerId: user._id
  });
  const teamIds = teams.map((item) => item._id);
  await Promise.all(
    teams.map(async (team) => {
      team.notificationAccount = '';
      team.openaiAccount = undefined;
      team.lafAccount = undefined;
      team.externalWorkflowVariables = undefined;
      await team.save();
    })
  );

  // 删除通知
  MongoUserInform.deleteMany({
    userId: user._id
  });

  /* 资源删除 */
  // 删除图片
  await MongoImage.deleteMany({
    teamId: { $in: teamIds }
  });
  // 删除知识库
  await Promise.all(
    teamIds.map(async (teamId) => {
      const datasets = await MongoDataset.find({
        teamId
      });
      await deleteDatasets({
        teamId,
        datasets
      });
    })
  );
  // 删除应用
  await Promise.all(
    teamIds.map(async (teamId) => {
      const apps = await MongoApp.find(
        {
          teamId
        },
        '_id'
      );
      await Promise.all(
        apps.map((app) =>
          onDelOneApp({
            teamId,
            appId: app._id
          })
        )
      );
    })
  );
  // 删除 API key
  await MongoOpenApi.deleteMany({
    teamId: { $in: teamIds }
  });

  /* 团队信息删除 */
  // 删除权限
  await MongoResourcePermission.deleteMany({
    teamId: { $in: teamIds }
  });
  // 删除群组
  const groups = await MongoMemberGroupModel.find({ teamId: { $in: teamIds } });
  await MongoGroupMemberModel.deleteMany({
    groupId: { $in: groups.map((item) => item._id) }
  });
  await MongoMemberGroupModel.deleteMany({
    teamId: { $in: teamIds }
  });
  // 删除组织
  await MongoOrgModel.deleteMany({
    teamId: { $in: teamIds }
  });
  await MongoOrgMemberModel.deleteMany({
    teamId: { $in: teamIds }
  });

  // 删除 teamTags
  await MongoTeamTags.deleteMany({
    teamId: { $in: teamIds }
  });

  // 删除成员 session和成员信息
  const members = await MongoTeamMember.find({
    teamId: { $in: teamIds }
  });
  members.map((member) => {
    delUserAllSession(member.userId);
  });
  await MongoTeamMember.deleteMany({
    teamId: { $in: teamIds },
    role: { $ne: TeamMemberRoleEnum.owner }
  });

  // 离开其他团队
  const myMembers = await MongoTeamMember.find({
    userId: user._id,
    role: { $ne: TeamMemberRoleEnum.owner }
  });
  await Promise.all(
    myMembers.map((member) => {
      removeUserFromTeam({
        teamId: member.teamId,
        memberId: member._id
      });
    })
  );

  return {};
}

export default NextAPI(handler);
