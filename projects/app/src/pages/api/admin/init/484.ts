import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { NextAPI } from '@/service/middleware/entry';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import type { TeamMemberSchema } from '@fastgpt/global/support/user/team/type';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { MongoApp } from '@fastgpt/service/core/app/schema';
import { updateResourcePermission } from '@/service/support/permission/controller';
import {
  ManagePermissionVal,
  PerResourceTypeEnum,
  PermissionTypeEnum
} from '@fastgpt/global/support/permission/constant';

/* 初始化 role=admin 的用户，给他们都添加app的管理员权限和team的管理权限 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  await authCert({ req, authRoot: true });

  const admins = await MongoTeamMember.find(
    {
      role: 'admin'
    },
    '_id teamId'
  );

  console.log('Total admin', admins.length);
  let success = 0;
  for await (const admin of admins) {
    try {
      await insertPer(admin);
    } catch (error) {
      console.log(error);
    }
    console.log(++success);
  }

  jsonRes(res, {
    message: 'success'
  });
}

export default NextAPI(handler);

async function insertPer(admin: TeamMemberSchema) {
  // 获取 team 下所有 app
  const apps = await MongoApp.find(
    {
      teamId: admin.teamId,
      permission: PermissionTypeEnum.public
    },
    '_id'
  );

  await mongoSessionRun(async (session) => {
    // 插入 app 权限
    for await (const app of apps) {
      try {
        await updateResourcePermission({
          resourceType: PerResourceTypeEnum.app,
          teamId: admin.teamId,
          tmbIdList: [admin._id],
          resourceId: app._id,
          permission: ManagePermissionVal,
          session
        });
      } catch (error) {
        console.log(error);
      }
    }

    // 插入 team manage 权限
    try {
      await updateResourcePermission({
        resourceType: PerResourceTypeEnum.team,
        teamId: admin.teamId,
        tmbIdList: [admin._id],
        permission: ManagePermissionVal,
        session
      });
    } catch (error) {
      console.log(error);
    }
  });
}
