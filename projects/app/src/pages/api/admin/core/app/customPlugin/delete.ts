import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { adminCert } from '@/service/support/permission/adminCert';
import { MongoSystemPluginSchema } from '@fastgpt/service/core/app/plugin/systemPluginSchema';

export type deleteCustomPluginQuery = { id: string };

export type deleteBody = {};

export type deleteResponse = {};

async function handler(
  req: ApiRequestProps<deleteBody, deleteCustomPluginQuery>,
  res: ApiResponseType<any>
): Promise<deleteResponse> {
  await adminCert({ req, authToken: true });

  await MongoSystemPluginSchema.deleteOne({ pluginId: req.query.id });

  return {};
}

export default NextAPI(handler);
