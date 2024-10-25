import { NextAPI } from '@/service/middleware/entry';
import { authDataset } from '@fastgpt/service/support/permission/dataset/auth';
import { ReadPermissionVal } from '@fastgpt/global/support/permission/constant';
import { CollaboratorItemType } from '@fastgpt/global/support/permission/collaborator';
import { DatasetPermission } from '@fastgpt/global/support/permission/dataset/controller';
import { ApiRequestProps } from '@fastgpt/service/type/next';
import { DatasetTypeEnum } from '@fastgpt/global/core/dataset/constants';
import { getClbsAndGroupsWithInfo } from '@fastgpt/service/support/permission/controller';

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

  const [clbs, groups] = await (async () => {
    const isFolder = dataset.type === DatasetTypeEnum.folder;
    const isInherit = dataset.inheritPermission;
    const isRoot = !dataset.parentId;
    if (isFolder || !isInherit || isRoot) {
      return getClbsAndGroupsWithInfo({ resourceId: dataset._id, resourceType: 'dataset', teamId });
    } else {
      return getClbsAndGroupsWithInfo({
        resourceId: dataset.parentId,
        resourceType: 'dataset',
        teamId
      });
    }
  })();

  const clbsWithInfo = clbs
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

  const groupsWithInfo = groups.map((item) => {
    return {
      groupId: item.groupId._id,
      teamId: item.teamId,
      permission: new DatasetPermission({ per: item.permission }),
      name: item.groupId.name,
      avatar: item.groupId.avatar
    };
  });

  return [...clbsWithInfo, ...groupsWithInfo];
}

export default NextAPI(handler);
