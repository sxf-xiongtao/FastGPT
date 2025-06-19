import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { adminCert } from '@/service/support/permission/adminCert';
import { MongoSystemPlugin } from '@fastgpt/service/core/app/plugin/systemPluginSchema';
import { getSystemPluginCb } from '@/service/core/workflow/systemPlugins/register';
import { addAuditLog } from '@fastgpt/service/support/user/audit/util';
import { AdminAuditEventEnum } from '@fastgpt/global/support/user/audit/constants';
import { getUserDetail } from '@fastgpt/service/support/user/controller';

export type deletePluginQuery = { id: string };

export type deletePluginBody = {};

export type deletePluginResponse = {};

async function handler(
  req: ApiRequestProps<deletePluginBody, deletePluginQuery>,
  res: ApiResponseType<any>
): Promise<deletePluginResponse> {
  const authResult = await adminCert({ req, authToken: true });
  const userDetail = await getUserDetail({ tmbId: authResult.tmbId });

  const plugin = await MongoSystemPlugin.findOne({ pluginId: req.query.id });
  const pluginName = plugin?.customConfig?.name || plugin?.pluginId || req.query.id;

  await MongoSystemPlugin.deleteOne({ pluginId: req.query.id });

  // 重新获取插件
  await getSystemPluginCb(true);

  (async () => {
    addAuditLog({
      tmbId: authResult.tmbId,
      teamId: userDetail.team.teamId,
      event: AdminAuditEventEnum.ADMIN_DELETE_PLUGIN,
      params: {
        name: pluginName,
        pluginName: pluginName
      }
    });
  })();

  return {};
}

export default NextAPI(handler);
