import { NextAPI } from '@/service/middleware/entry';
import { adminCert } from '@/service/support/permission/adminCert';
import { MongoSystemPlugin } from '@fastgpt/service/core/app/plugin/systemPluginSchema';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';

export type updatePluginOrderQuery = {};

export type updatePluginOrderBody = {
  plugins: {
    pluginId: string;
    pluginOrder: number;
  }[];
};

export type updatePluginOrderResponse = {};

async function handler(
  req: ApiRequestProps<updatePluginOrderBody, updatePluginOrderQuery>,
  res: ApiResponseType<any>
): Promise<updatePluginOrderResponse> {
  await adminCert({ req, authToken: true });
  const { plugins } = req.body;

  await MongoSystemPlugin.bulkWrite(
    plugins.map((plugin, index) => ({
      updateOne: {
        filter: { pluginId: plugin.pluginId },
        update: { $set: { pluginOrder: index } },
        upsert: true
      }
    }))
  );
  return {};
}

export default NextAPI(handler);
