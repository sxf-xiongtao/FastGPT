import { NextAPI } from '@/service/middleware/entry';
import { authDataset } from '@fastgpt/service/support/permission/dataset/auth';
import { ReadPermissionVal } from '@fastgpt/global/support/permission/constant';
import { CollaboratorItemType } from '@fastgpt/global/support/permission/collaborator';
import { DatasetPermission } from '@fastgpt/global/support/permission/dataset/controller';
import { ApiRequestProps } from '@fastgpt/service/type/next';
import { DatasetTypeEnum } from '@fastgpt/global/core/dataset/constants';
import { getClbsAndGroupsWithInfo } from '@fastgpt/service/support/permission/controller';
import { DEFAULT_ORG_AVATAR } from '@fastgpt/global/common/system/constants';

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

  const [clbs, groups, orgs] = await (async () => {
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
        tmbId: item.tmb._id,
        teamId: item.teamId,
        permission: new DatasetPermission({ per: item.permission }),
        name: item.tmb.name,
        avatar: item.tmb.avatar
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const groupsWithInfo = groups.map((item) => {
    return {
      groupId: item.group._id,
      teamId: item.teamId,
      permission: new DatasetPermission({ per: item.permission }),
      name: item.group.name,
      avatar: item.group.avatar
    };
  });

  const orgsWithInfo = orgs.map((item) => ({
    orgId: item.org._id,
    teamId: item.teamId,
    permission: new DatasetPermission({ per: item.permission }),
    name: item.org.name,
    avatar: item.org.avatar || DEFAULT_ORG_AVATAR
  }));

  return [...clbsWithInfo, ...groupsWithInfo, ...orgsWithInfo];
}

export default NextAPI(handler);
