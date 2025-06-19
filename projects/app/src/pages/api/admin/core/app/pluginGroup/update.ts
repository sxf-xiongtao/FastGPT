import { adminCert } from '@/service/support/permission/adminCert';
import { NextAPI } from '@/service/middleware/entry';
import { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { MongoPluginGroups } from '@fastgpt/service/core/app/plugin/pluginGroupSchema';
import { TGroupType } from '@fastgpt/service/core/app/plugin/type';
import { MongoSystemPlugin } from '@fastgpt/service/core/app/plugin/systemPluginSchema';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { addAuditLog } from '@fastgpt/service/support/user/audit/util';
import { AdminAuditEventEnum } from '@fastgpt/global/support/user/audit/constants';
import { getUserDetail } from '@fastgpt/service/support/user/controller';

export type updatePluginGroupQuery = {};

export type updatePluginGroupBody = {
  groupId: string;
  groupName?: string;
  groupAvatar?: string;
  groupTypes?: TGroupType[];
  groupOrder?: number;
};

export type updatePluginGroupResponse = {};

async function handler(
  req: ApiRequestProps<updatePluginGroupBody, updatePluginGroupQuery>,
  res: ApiResponseType<any>
): Promise<updatePluginGroupResponse> {
  const authResult = await adminCert({ req, authToken: true });
  const userDetail = await getUserDetail({ tmbId: authResult.tmbId });
  const { groupId, groupName, groupAvatar, groupTypes, groupOrder } = req.body;

  const group = await MongoPluginGroups.findOne({ groupId });

  if (!group) {
    return Promise.reject('group not found');
  }

  await mongoSessionRun(async (session) => {
    // 比较哪些 groupTypes 被删除了
    if (groupTypes) {
      const oldGroupTypes = group.groupTypes;
      const deletedGroupTypes = oldGroupTypes.filter(
        (type) => !groupTypes.find((t) => t.typeId === type.typeId)
      );

      if (deletedGroupTypes.length > 0) {
        await MongoSystemPlugin.deleteMany(
          { 'customConfig.templateType': { $in: deletedGroupTypes.map((type) => type.typeId) } },
          { session }
        );
      }
    }

    await MongoPluginGroups.updateOne(
      { groupId: groupId },
      {
        $set: {
          ...(groupName && { groupName }),
          ...(groupAvatar && { groupAvatar }),
          ...(groupTypes && { groupTypes }),
          ...(groupOrder && { groupOrder })
        }
      },
      { session }
    );
  });

  (async () => {
    addAuditLog({
      tmbId: authResult.tmbId,
      teamId: userDetail.team.teamId,
      event: AdminAuditEventEnum.ADMIN_UPDATE_PLUGIN_GROUP,
      params: {
        name: groupName || group.groupName,
        groupName: groupName || group.groupName
      }
    });
  })();

  return {};
}

export default NextAPI(handler);
