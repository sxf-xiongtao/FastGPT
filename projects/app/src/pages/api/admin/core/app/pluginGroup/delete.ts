import { NextAPI } from '@/service/middleware/entry';
import { adminCert } from '@/service/support/permission/adminCert';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { MongoPluginGroups } from '@fastgpt/service/core/app/plugin/pluginGroupSchema';
import { MongoSystemPlugin } from '@fastgpt/service/core/app/plugin/systemPluginSchema';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { addAuditLog } from '@fastgpt/service/support/user/audit/util';
import { AdminAuditEventEnum } from '@fastgpt/global/support/user/audit/constants';
import { getUserDetail } from '@fastgpt/service/support/user/controller';

export type deletePluginGroupQuery = {
  groupId: string;
};

export type deletePluginGroupBody = {};

export type deletePluginGroupResponse = {};

// 删除一个分组，以及分组下的所有插件
async function handler(
  req: ApiRequestProps<deletePluginGroupBody, deletePluginGroupQuery>,
  res: ApiResponseType<any>
): Promise<deletePluginGroupResponse> {
  const authResult = await adminCert({ req, authToken: true });
  const userDetail = await getUserDetail({ tmbId: authResult.tmbId });
  const { groupId } = req.query;

  await mongoSessionRun(async (session) => {
    // 获取group下的所有groupTypes
    const group = await MongoPluginGroups.findOne({ groupId }, 'groupTypes groupName', { session });
    if (!group) {
      return Promise.reject('group not found');
    }
    const groupTypes = group.groupTypes;
    const groupName = group.groupName;

    for await (const type of groupTypes) {
      await MongoSystemPlugin.deleteMany({ 'customConfig.templateType': type.typeId }, { session });
    }
    await group.deleteOne({ session });

    (async () => {
      addAuditLog({
        tmbId: authResult.tmbId,
        teamId: userDetail.team.teamId,
        event: AdminAuditEventEnum.ADMIN_DELETE_PLUGIN_GROUP,
        params: {
          name: groupName,
          groupName: groupName
        }
      });
    })();
  });

  return {};
}

export default NextAPI(handler);
