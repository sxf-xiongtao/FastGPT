import { NextAPI } from '@/service/middleware/entry';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
import type { AppCollaboratorDeleteParams } from '@fastgpt/global/core/app/collaborator';
import { AppFolderTypeList } from '@fastgpt/global/core/app/constants';
import {
  ManagePermissionVal,
  PerResourceTypeEnum
} from '@fastgpt/global/support/permission/constant';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { MongoApp } from '@fastgpt/service/core/app/schema';
import { authApp } from '@fastgpt/service/support/permission/app/auth';
import {
  delResourcePermission,
  getResourceClbsAndGroups
} from '@fastgpt/service/support/permission/controller';
import {
  syncChildrenPermission,
  syncCollaborators
} from '@fastgpt/service/support/permission/inheritPermission';
import type { NextApiRequest } from 'next';
import { addOperationLog } from '@fastgpt/service/support/operationLog/addOperationLog';
import { OperationLogEventEnum } from '@fastgpt/global/support/operationLog/constants';
import { AppTypeEnum } from '@fastgpt/global/core/app/constants';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoMemberGroupModel } from '@fastgpt/service/support/permission/memberGroup/memberGroupSchema';
import { MongoOrgModel } from '@fastgpt/service/support/permission/org/orgSchema';
import {
  getI18nAppType,
  getI18nCollaboratorItemType
} from '@fastgpt/service/support/operationLog/util';

async function logDeleteCollaboratorOperation({
  app,
  operatorTmbId,
  teamId,
  tmbId,
  groupId,
  orgId
}: {
  app: any;
  operatorTmbId: string;
  teamId: string;
  tmbId?: string;
  groupId?: string;
  orgId?: string;
}) {
  const getItemName = async () => {
    if (tmbId) {
      const member = await MongoTeamMember.findOne({ _id: tmbId }, 'name').exec();
      return member?.name || tmbId;
    }
    if (groupId) {
      const group = await MongoMemberGroupModel.findOne({ _id: groupId }, 'name').exec();
      return group?.name || groupId;
    }
    if (orgId) {
      const org = await MongoOrgModel.findOne({ _id: orgId }, 'name').exec();
      return org?.name || orgId;
    }
    return '';
  };

  const appType = getI18nAppType(app.type);
  const itemType = getI18nCollaboratorItemType(tmbId, groupId, orgId);
  const itemName = await getItemName();

  addOperationLog({
    tmbId: operatorTmbId,
    teamId,
    event: OperationLogEventEnum.DELETE_APP_COLLABORATOR,
    params: {
      appName: app.name,
      appType: appType,
      itemName: itemType,
      itemValueName: itemName
    }
  });
}

/*
  1. 继承态目录：需要将继承态关闭，删除 1 个协作者，同步其子目录协作者
  2. 继承态应用：需要将继承态关闭，同步父的 defaultPermission, 协作者复制父目录
  3. 非继承态目录：删除 1 个协作者，同步其子目录协作者
  4. 非继承态应用：仅删除协作者
*/
async function handler(req: NextApiRequest) {
  // Authorization
  const { appId, tmbId, groupId, orgId } = req.query as AppCollaboratorDeleteParams;

  if (tmbId === undefined && groupId === undefined && orgId === undefined) {
    return Promise.reject(CommonErrEnum.missingParams);
  }

  const {
    teamId,
    app,
    tmbId: operatorTmbId
  } = await authApp({
    req,
    authToken: true,
    appId,
    per: ManagePermissionVal
  });

  await mongoSessionRun(async (session) => {
    // 目录
    if (AppFolderTypeList.includes(app.type)) {
      const folderClbsAndGroups = await getResourceClbsAndGroups({
        teamId,
        resourceId: appId,
        resourceType: PerResourceTypeEnum.app,
        session
      });

      await delResourcePermission({
        resourceType: PerResourceTypeEnum.app,
        teamId,
        tmbId,
        groupId,
        orgId,
        resourceId: app._id,
        session
      });

      // 同步所有子资源协作者
      await syncChildrenPermission({
        resource: app,
        folderTypeList: AppFolderTypeList,
        resourceType: PerResourceTypeEnum.app,
        resourceModel: MongoApp,
        collaborators: folderClbsAndGroups.filter(
          (item) =>
            String(item.tmbId) !== tmbId &&
            String(item.groupId) !== groupId &&
            String(item.orgId) !== orgId
        ),
        session
      });
    } else {
      // 普通继承态应用
      if (app.inheritPermission && app.parentId) {
        // 获取父的所有协作者
        const parentClbsAndGroups = await getResourceClbsAndGroups({
          teamId,
          resourceId: app.parentId,
          resourceType: PerResourceTypeEnum.app,
          session
        });

        // 同步协作者
        await syncCollaborators({
          resourceType: PerResourceTypeEnum.app,
          teamId,
          resourceId: app._id,
          collaborators: parentClbsAndGroups.filter(
            (item) =>
              String(item.tmbId) !== tmbId &&
              String(item.groupId) !== groupId &&
              String(item.orgId) !== orgId
          ),
          session
        });
      } else {
        await delResourcePermission(
          tmbId
            ? {
                resourceType: PerResourceTypeEnum.app,
                teamId,
                tmbId,
                resourceId: app._id,
                session
              }
            : groupId
              ? {
                  resourceType: PerResourceTypeEnum.app,
                  teamId,
                  groupId: groupId,
                  resourceId: app._id,
                  session
                }
              : {
                  resourceType: PerResourceTypeEnum.app,
                  teamId,
                  orgId: orgId!,
                  resourceId: app._id,
                  session
                }
        );
      }
    }

    // 继承态：关闭继承态，默认权限已经取消.
    if (app.inheritPermission && app.parentId) {
      await MongoApp.updateOne(
        { _id: appId },
        {
          inheritPermission: false
        }
      ).session(session);
    }
  });

  await logDeleteCollaboratorOperation({
    app,
    operatorTmbId,
    teamId,
    tmbId,
    groupId,
    orgId
  });
}

export default NextAPI(handler);
