import type { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import type { PermissionValueType } from '@fastgpt/global/support/permission/type';
import type { ClientSession } from '@fastgpt/service/common/mongo';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';

export const updateResourcePermission = async ({
  resourceId,
  resourceType,
  teamId,
  tmbIdList = [],
  groupIdList = [],
  orgIdList = [],
  permission,
  session
}: {
  resourceId?: string;
  resourceType: Omit<`${PerResourceTypeEnum}`, 'team'>;
  teamId: string;
  permission: PermissionValueType;
  session?: ClientSession;
  tmbIdList?: string[];
  groupIdList?: string[];
  orgIdList?: string[];
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

    for await (const groupId of groupIdList) {
      await MongoResourcePermission.findOneAndUpdate(
        {
          resourceType,
          teamId,
          groupId,
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

    for await (const orgId of orgIdList) {
      await MongoResourcePermission.findOneAndUpdate(
        {
          resourceType,
          teamId,
          orgId,
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
