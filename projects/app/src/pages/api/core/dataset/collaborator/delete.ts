import { NextAPI } from '@/service/middleware/entry';
import { authDataset } from '@fastgpt/service/support/permission/dataset/auth';
import {
  PerResourceTypeEnum,
  ManagePermissionVal
} from '@fastgpt/global/support/permission/constant';
import { DatasetCollaboratorDeleteParams } from '@fastgpt/global/core/dataset/collaborator';
import {
  delResourcePermission,
  getResourceAllClbs
} from '@fastgpt/service/support/permission/controller';
import { ApiRequestProps } from '@fastgpt/service/type/next';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { DatasetTypeEnum } from '@fastgpt/global/core/dataset/constants';
import {
  syncChildrenPermission,
  syncCollaborators
} from '@fastgpt/service/support/permission/inheritPermission';
import { MongoDataset } from '@fastgpt/service/core/dataset/schema';

async function handler(req: ApiRequestProps<{}, DatasetCollaboratorDeleteParams>) {
  // Authorization
  const { datasetId, tmbId } = req.query;

  const { teamId, dataset } = await authDataset({
    req,
    authToken: true,
    datasetId,
    per: ManagePermissionVal
  });

  await mongoSessionRun(async (session) => {
    if (dataset.type == DatasetTypeEnum.folder) {
      const folderClbs = await getResourceAllClbs({
        teamId,
        resourceId: datasetId,
        resourceType: PerResourceTypeEnum.dataset,
        session
      });

      await delResourcePermission({
        resourceType: PerResourceTypeEnum.dataset,
        teamId,
        tmbId,
        resourceId: dataset._id,
        session
      });

      await syncChildrenPermission({
        resource: dataset,
        folderTypeList: [DatasetTypeEnum.folder],
        resourceType: PerResourceTypeEnum.dataset,
        resourceModel: MongoDataset,
        collaborators: folderClbs.filter((clb) => String(clb.tmbId) !== tmbId),
        session
      });
    } else {
      if (dataset.inheritPermission && dataset.parentId) {
        const parentClbs = await getResourceAllClbs({
          teamId,
          resourceId: dataset.parentId,
          resourceType: PerResourceTypeEnum.dataset,
          session
        });

        await syncCollaborators({
          teamId,
          resourceId: datasetId,
          resourceType: PerResourceTypeEnum.dataset,
          session,
          collaborators: parentClbs.filter((clb) => String(clb.tmbId) !== tmbId)
        });
      } else {
        await delResourcePermission({
          resourceType: PerResourceTypeEnum.dataset,
          teamId,
          tmbId,
          resourceId: dataset._id,
          session
        });
      }
    }

    if (dataset.inheritPermission && dataset.parentId) {
      const parent = await MongoDataset.findById(dataset.parentId, 'defaultPermission')
        .session(session)
        .lean();

      await MongoDataset.updateOne(
        { _id: dataset._id },
        {
          inheritPermission: false,
          defaultPermission: parent?.defaultPermission ?? dataset.defaultPermission
        }
      ).session(session);
    }
  });
}

export default NextAPI(handler);
