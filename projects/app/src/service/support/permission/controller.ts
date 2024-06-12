import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { PermissionValueType } from '@fastgpt/global/support/permission/type';
import { ClientSession } from '@fastgpt/service/common/mongo';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';

export const updateResourcePermission = async ({
  resourceId,
  resourceType,
  teamId,
  tmbIdList,
  permission,
  session
}: {
  resourceId?: string;
  resourceType: PerResourceTypeEnum;
  teamId: string;
  tmbIdList: string[];
  permission: PermissionValueType;
  session?: ClientSession;
}) => {
  const fn = async (session: ClientSession) => {
    for await (const tmbId of tmbIdList) {
      await MongoResourcePermission.findOneAndUpdate(
        {
          resourceType,
          teamId,
          tmbId,
          resourceId
        },
        {
          permission
        },
        {
          session,
          upsert: true
        }
      );
    }
  };

  if (session) {
    return fn(session);
  }
  return mongoSessionRun(fn);
};
