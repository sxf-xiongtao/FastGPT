import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { adminCert } from '@/service/support/permission/adminCert';
import { MongoSystemPlugin } from '@fastgpt/service/core/app/plugin/systemPluginSchema';
import { getSystemPluginCb } from '@/service/core/workflow/systemPlugins/register';

export type deletePluginQuery = { id: string };

export type deletePluginBody = {};

export type deletePluginResponse = {};

async function handler(
  req: ApiRequestProps<deletePluginBody, deletePluginQuery>,
  res: ApiResponseType<any>
): Promise<deletePluginResponse> {
  await adminCert({ req, authToken: true });

  await MongoSystemPlugin.deleteOne({ pluginId: req.query.id });

  // 重新获取插件
  await getSystemPluginCb(true);

  return {};
}

export default NextAPI(handler);
