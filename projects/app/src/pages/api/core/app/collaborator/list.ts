import type { NextApiRequest } from 'next';
import { NextAPI } from '@/service/middleware/entry';
import { authApp } from '@fastgpt/service/support/permission/app/auth';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import {
  ReadPermissionVal,
  PerResourceTypeEnum
} from '@fastgpt/global/support/permission/constant';
import { CollaboratorItemType } from '@fastgpt/global/support/permission/collaborator';
import { ResourcePerWithTmbWithUser } from '@fastgpt/global/support/permission/type';
import { AppPermission } from '@fastgpt/global/support/permission/app/controller';

async function handler(req: NextApiRequest): Promise<CollaboratorItemType[]> {
  // Authorization
  const { appId } = req.query as { appId: string };
  const { teamId } = await authApp({
    req,
    authToken: true,
    appId,
    per: ReadPermissionVal
  });

  const collaboratorList = (await MongoResourcePermission.find({
    teamId,
    resourceId: appId,
    resourceType: PerResourceTypeEnum.app
  }).populate({
    path: 'tmbId',
    select: 'name userId',
    populate: {
      path: 'userId',
      select: 'avatar'
    }
  })) as ResourcePerWithTmbWithUser[];

  return collaboratorList.map((item) => {
    return {
      tmbId: item.tmbId._id,
      teamId: item.teamId,
      permission: new AppPermission({ per: item.permission }),
      name: item.tmbId.name,
      avatar: item.tmbId.userId.avatar
    };
  });
}

export default NextAPI(handler);
