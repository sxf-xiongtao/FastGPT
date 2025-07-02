import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { NextAPI } from '@/service/middleware/entry';
import { delay } from '@fastgpt/global/common/system/utils';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import {
  OwnerPermissionVal,
  PerResourceTypeEnum
} from '@fastgpt/global/support/permission/constant';
import { MongoApp } from '@fastgpt/service/core/app/schema';
import { getTeamDefaultGroup } from '@fastgpt/service/support/permission/memberGroup/controllers';
import { updateResourcePermission } from '@/service/support/permission/controller';
import { MongoDataset } from '@fastgpt/service/core/dataset/schema';
import { AppFolderTypeList } from '@fastgpt/global/core/app/constants';
import { DatasetTypeEnum } from '@fastgpt/global/core/dataset/constants';
import {
  syncChildrenPermission,
  syncCollaborators
} from '@fastgpt/service/support/permission/inheritPermission';
import type { AppSchema } from '@fastgpt/global/core/app/type';
import type { DatasetSchemaType } from '@fastgpt/global/core/dataset/type';

/* 
  1. 更新默认权限：原本有团队可读，团队可写的，都增加一个全员组。
  2. root 下目录，或者非继承的目录，增加一个owner 作为协作者
*/
async function handler(req: NextApiRequest, res: NextApiResponse) {
  await authCert({ req, authRoot: true });

  const [apps, datasets] = await Promise.all([
    MongoApp.find(
      {
        defaultPermission: {
          $exists: true
        }
      },
      '_id defaultPermission teamId'
    ).lean(),
    MongoDataset.find(
      {
        defaultPermission: {
          $exists: true
        }
      },
      '_id defaultPermission teamId'
    ).lean()
  ]);

  console.log('app length:', apps.length);
  console.log('dataset length:', datasets.length);
  console.log('=========');
  let appSuccess = 0;
  let datasetSuccess = 0;

  for await (const app of apps) {
    await updateAppDefaultPermission(app);
    appSuccess++;
    console.log('App update success:', appSuccess);
  }

  for await (const dataset of datasets) {
    await updateDatasetDefaultPermission(dataset);
    datasetSuccess++;
    console.log('Dataset update success:', datasetSuccess);
  }

  // ==============

  const appFolders = await MongoApp.find({
    type: {
      $in: AppFolderTypeList
    }
  }).lean();

  const rootAppFolders = appFolders.filter((i) => !i.parentId || !i.inheritPermission);
  console.log('rootAppFolders length:', rootAppFolders.length);
  for await (const app of rootAppFolders) {
    await mongoSessionRun(async (session) => {
      const oldList = await MongoResourcePermission.find({
        resourceType: PerResourceTypeEnum.app,
        teamId: app.teamId,
        resourceId: app._id
      })
        .session(session)
        .lean();

      // 去重 tmbId
      const newList = [
        ...oldList,
        {
          resourceType: PerResourceTypeEnum.app,
          teamId: app.teamId,
          resourceId: app._id,
          permission: OwnerPermissionVal,
          tmbId: app.tmbId
        }
      ].filter((i) => !oldList.some((j) => j.tmbId === i.tmbId));
      await syncCollaborators({
        resourceType: PerResourceTypeEnum.app,
        session,
        collaborators: newList,
        teamId: app.teamId,
        resourceId: app._id
      });
      await syncChildrenPermission({
        resource: app,
        folderTypeList: AppFolderTypeList,
        resourceType: PerResourceTypeEnum.app,
        session,
        collaborators: newList,
        resourceModel: MongoApp
      });
    });
  }

  // ========

  const datasetFolders = await MongoDataset.find({
    type: DatasetTypeEnum.folder
  }).lean();

  const rootDatasetFolders = datasetFolders.filter((i) => !i.parentId || !i.inheritPermission);
  console.log('rootDatasetFolders length:', rootDatasetFolders.length);

  for await (const dataset of rootDatasetFolders) {
    await mongoSessionRun(async (session) => {
      const oldList = await MongoResourcePermission.find({
        resourceType: PerResourceTypeEnum.dataset,
        teamId: dataset.teamId,
        resourceId: dataset._id
      })
        .session(session)
        .lean();

      const newList = [
        ...oldList,
        {
          resourceType: PerResourceTypeEnum.dataset,
          teamId: dataset.teamId,
          resourceId: dataset._id,
          permission: OwnerPermissionVal,
          tmbId: dataset.tmbId
        }
      ].filter((i) => !oldList.some((j) => j.tmbId === i.tmbId));
      await syncCollaborators({
        resourceType: PerResourceTypeEnum.dataset,
        session,
        collaborators: newList,
        teamId: dataset.teamId,
        resourceId: dataset._id
      });
      await syncChildrenPermission({
        resource: dataset,
        folderTypeList: [DatasetTypeEnum.folder],
        resourceType: PerResourceTypeEnum.dataset,
        session,
        collaborators: newList,
        resourceModel: MongoDataset
      });
    });
  }

  await MongoApp.updateMany(
    {},
    {
      $unset: {
        defaultPermission: 1
      }
    }
  );
  await MongoDataset.updateMany(
    {},
    {
      $unset: {
        defaultPermission: 1
      }
    }
  );

  jsonRes(res, {
    message: 'success'
  });
}

export default NextAPI(handler);

const updateAppDefaultPermission = async (app: AppSchema) => {
  try {
    const per = app.defaultPermission!;
    const teamId = app.teamId;

    if (per && per >= 4) {
      const defaultGroup = await getTeamDefaultGroup({ teamId });
      await updateResourcePermission({
        teamId,
        resourceType: PerResourceTypeEnum.app,
        resourceId: app._id,
        permission: per,
        groupIdList: [defaultGroup._id]
      });
    }
  } catch (error) {
    console.log(error);
    await delay(100);
    return updateAppDefaultPermission(app);
  }
};
const updateDatasetDefaultPermission = async (dataset: DatasetSchemaType) => {
  try {
    const per = dataset.defaultPermission!;
    const teamId = dataset.teamId;
    if (per && per >= 4) {
      const defaultGroup = await getTeamDefaultGroup({ teamId });
      await updateResourcePermission({
        teamId,
        resourceType: PerResourceTypeEnum.dataset,
        resourceId: dataset._id,
        permission: per,
        groupIdList: [defaultGroup._id]
      });
    }
  } catch (error) {
    console.log(error);
    await delay(100);
    return updateDatasetDefaultPermission(dataset);
  }
};
