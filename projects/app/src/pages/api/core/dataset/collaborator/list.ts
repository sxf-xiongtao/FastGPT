import { NextAPI } from '@/service/middleware/entry';
import { authDataset } from '@fastgpt/service/support/permission/dataset/auth';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import {
  ReadPermissionVal,
  PerResourceTypeEnum
} from '@fastgpt/global/support/permission/constant';
import { CollaboratorItemType } from '@fastgpt/global/support/permission/collaborator';
import { ResourcePerWithTmbWithUser } from '@fastgpt/global/support/permission/type';
import { DatasetPermission } from '@fastgpt/global/support/permission/dataset/controller';
import { ApiRequestProps } from '@fastgpt/service/type/next';
import { DatasetTypeEnum } from '@fastgpt/global/core/dataset/constants';

async function handler(
  req: ApiRequestProps<
    {},
    {
      datasetId: string;
    }
  >
): Promise<CollaboratorItemType[]> {
  // Authorization
  const { datasetId } = req.query;
  const { teamId, dataset } = await authDataset({
    req,
    authToken: true,
    datasetId,
    per: ReadPermissionVal
  });

  const isFolder = dataset.type === DatasetTypeEnum.folder;
  const isInherit = dataset.inheritPermission;
  const isRoot = !dataset.parentId;

  const collaboratorList = await (async () => {
    if (isFolder || !isInherit || isRoot) {
      return (await MongoResourcePermission.find({
        teamId,
        resourceId: datasetId,
        resourceType: PerResourceTypeEnum.dataset
      }).populate({
        path: 'tmbId',
        select: 'name userId',
        populate: {
          path: 'userId',
          select: 'avatar'
        }
      })) as ResourcePerWithTmbWithUser[];
    } else {
      return (await MongoResourcePermission.find({
        teamId,
        resourceId: dataset.parentId,
        resourceType: PerResourceTypeEnum.dataset
      }).populate({
        path: 'tmbId',
        select: 'name userId',
        populate: {
          path: 'userId',
          select: 'avatar'
        }
      })) as ResourcePerWithTmbWithUser[];
    }
  })();

  return collaboratorList
    .map((item) => {
      return {
        tmbId: item.tmbId._id,
        teamId: item.teamId,
        permission: new DatasetPermission({ per: item.permission }),
        name: item.tmbId.name,
        avatar: item.tmbId.userId.avatar
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export default NextAPI(handler);
