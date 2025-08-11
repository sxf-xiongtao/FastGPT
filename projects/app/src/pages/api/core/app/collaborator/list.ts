import { NextAPI } from '@/service/middleware/entry';
import { DEFAULT_ORG_AVATAR } from '@fastgpt/global/common/system/constants';
import { AppFolderTypeList } from '@fastgpt/global/core/app/constants';
import { AppPermission } from '@fastgpt/global/support/permission/app/controller';
import type { CollaboratorItemType } from '@fastgpt/global/support/permission/collaborator';
import { ReadPermissionVal } from '@fastgpt/global/support/permission/constant';
import { authApp } from '@fastgpt/service/support/permission/app/auth';
import { getClbsAndGroupsWithInfo } from '@fastgpt/service/support/permission/controller';
import type { NextApiRequest } from 'next';

// get app's collaborator list (members and groups)
async function handler(req: NextApiRequest): Promise<CollaboratorItemType[]> {
  // Authorization
  const { appId } = req.query as { appId: string };
  const { teamId, app } = await authApp({
    req,
    authToken: true,
    appId,
    per: ReadPermissionVal
  });

  const [clbs, groups, orgs] = await (async () => {
    const isFolder = AppFolderTypeList.includes(app.type);
    const isInherit = app.inheritPermission;
    const isRoot = !app.parentId;

    if (isFolder || !isInherit || isRoot) {
      return getClbsAndGroupsWithInfo({ resourceId: app._id, resourceType: 'app', teamId });
    }
    return getClbsAndGroupsWithInfo({ resourceId: app.parentId, resourceType: 'app', teamId });
  })();

  const clbsWithInfo = clbs
    .map((item) => {
      return {
        tmbId: item.tmb._id,
        teamId: item.teamId,
        permission: new AppPermission({ role: item.permission }),
        name: item.tmb.name,
        avatar: item.tmb.avatar
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const groupsWithInfo = groups.map((item) => {
    return {
      groupId: item.group._id,
      teamId: item.teamId,
      permission: new AppPermission({ role: item.permission }),
      name: item.group.name,
      avatar: item.group.avatar
    };
  });

  const orgsWithInfo = orgs.map((item) => ({
    orgId: item.org._id,
    teamId: item.teamId,
    permission: new AppPermission({ role: item.permission }),
    name: item.org.name,
    avatar: item.org.avatar || DEFAULT_ORG_AVATAR
  }));

  return [...clbsWithInfo, ...groupsWithInfo, ...orgsWithInfo];
}

export default NextAPI(handler);
