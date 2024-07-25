import { NextAPI } from '@/service/middleware/entry';
import { authDataset } from '@fastgpt/service/support/permission/dataset/auth';
import {
  PerResourceTypeEnum,
  ManagePermissionVal
} from '@fastgpt/global/support/permission/constant';
import { UpdateDatasetCollaboratorBody } from '@fastgpt/global/core/dataset/collaborator';
import { DatasetPermission } from '@fastgpt/global/support/permission/dataset/controller';
import { updateResourcePermission } from '@/service/support/permission/controller';
import { ApiRequestProps } from '@fastgpt/service/type/next';
import { DatasetTypeEnum } from '@fastgpt/global/core/dataset/constants';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { MongoDataset } from '@fastgpt/service/core/dataset/schema';
import { getResourceAllClbs } from '@fastgpt/service/support/permission/controller';
import {
  syncChildrenPermission,
  UpdateCollaboratorItem
} from '@fastgpt/service/support/permission/inheritPermission';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';

async function handler(req: ApiRequestProps<UpdateDatasetCollaboratorBody>) {
  // Authorization
  const { datasetId, tmbIds, permission } = req.body;

  const {
    teamId,
    tmbId,
    permission: myPer,
    dataset
  } = await authDataset({
    req,
    authToken: true,
    datasetId,
    per: ManagePermissionVal
  });

  if (tmbIds.includes(tmbId)) {
    return Promise.reject('Can not update your own permission');
  }

  if (new DatasetPermission({ per: permission }).hasManagePer && !myPer.isOwner) {
    return Promise.reject('Only owner could grant manage permission');
  }

  const isFolder = dataset.type === DatasetTypeEnum.folder;

  await mongoSessionRun(async (session) => {
    // 关闭继承态
    if (dataset.inheritPermission) {
      await MongoDataset.updateOne(
        { _id: datasetId },
        {
          inheritPermission: false
        },
        {
          session
        }
      );
    }

    const { updateClbs, updateTmbIds } = await (async () => {
      if (isFolder) {
        // 获取当前目录的协作者，并与需要变更的协作者合并
        const FolderClbs = await getResourceAllClbs({
          resourceId: datasetId,
          teamId,
          resourceType: PerResourceTypeEnum.dataset,
          session
        });
        const updateClbs = tmbIds
          .map<UpdateCollaboratorItem>((tmbId) => ({
            tmbId,
            permission
          }))
          .concat(
            FolderClbs.filter((item) => !tmbIds.includes(String(item.tmbId))).map((item) => ({
              tmbId: item.tmbId,
              permission: tmbIds.includes(String(item.tmbId)) ? permission : item.permission
            }))
          );

        return {
          updateClbs,
          updateTmbIds: tmbIds
        };
      } else {
        if (dataset.inheritPermission && dataset.parentId) {
          // 获取父级的协作者， 并与需要变更的协作者合并
          const parentClbs = await getResourceAllClbs({
            teamId: dataset.teamId,
            resourceId: dataset.parentId,
            resourceType: PerResourceTypeEnum.dataset,
            session
          });

          const updateClbs = parentClbs
            .filter((item) => tmbIds.includes(String(item.tmbId)))
            .map((item) => ({
              ...item,
              permission
            }));

          const unchangedClbs = parentClbs.filter((item) => !tmbIds.includes(String(item.tmbId)));

          for (const item of unchangedClbs) {
            await MongoResourcePermission.create({
              teamId,
              resourceId: datasetId,
              resourceType: PerResourceTypeEnum.dataset,
              tmbId: item.tmbId,
              permission: item.permission,
              session
            });
          }

          return {
            updateClbs,
            updateTmbIds: updateClbs.map((item) => item.tmbId) // 继承态 dataset 是没有协作者的，这里需要全量复制
          };
        }

        return {
          updateClbs: [],
          updateTmbIds: tmbIds
        };
      }
    })();

    // 更新的协作者
    await updateResourcePermission({
      resourceType: PerResourceTypeEnum.dataset,
      resourceId: datasetId,
      session,
      teamId,
      tmbIdList: updateTmbIds,
      permission
    });

    // 同步子目录
    if (dataset.type === DatasetTypeEnum.folder) {
      await syncChildrenPermission({
        resource: dataset,
        resourceModel: MongoDataset,
        folderTypeList: [DatasetTypeEnum.folder],
        resourceType: PerResourceTypeEnum.dataset,
        collaborators: updateClbs,
        session
      });
    }
  });
}

export default NextAPI(handler);
