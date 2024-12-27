import type { NextApiRequest } from 'next';
import { NextAPI } from '@/service/middleware/entry';
import { authApp } from '@fastgpt/service/support/permission/app/auth';
import { ReadPermissionVal } from '@fastgpt/global/support/permission/constant';
import { CollaboratorItemType } from '@fastgpt/global/support/permission/collaborator';
import { AppPermission } from '@fastgpt/global/support/permission/app/controller';
import { AppFolderTypeList } from '@fastgpt/global/core/app/constants';
import { getClbsAndGroupsWithInfo } from '@fastgpt/service/support/permission/controller';

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

  const [clbs, groups] = await (async () => {
    const isFolder = AppFolderTypeList.includes(app.type);
    const isInherit = app.inheritPermission;
    const isRoot = !app.parentId;

    if (isFolder || !isInherit || isRoot) {
      return getClbsAndGroupsWithInfo({ resourceId: app._id, resourceType: 'app', teamId });
    } else {
      return getClbsAndGroupsWithInfo({ resourceId: app.parentId, resourceType: 'app', teamId });
    }
  })();

  const clbsWithInfo = clbs
    .map((item) => {
      return {
        tmbId: item.tmb._id,
        teamId: item.teamId,
        permission: new AppPermission({ per: item.permission }),
        name: item.tmb.name,
        avatar: item.tmb.user.avatar
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const groupsWithInfo = groups.map((item) => {
    return {
      groupId: item.group._id,
      teamId: item.teamId,
      permission: new AppPermission({ per: item.permission }),
      name: item.group.name,
      avatar: item.group.avatar
    };
  });

  return [...clbsWithInfo, ...groupsWithInfo];
}

export default NextAPI(handler);
