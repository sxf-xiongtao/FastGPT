import { adminCert } from '@/service/support/permission/adminCert';
import { NextAPI } from '@/service/middleware/entry';
import { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { MongoSystemPlugin } from '@fastgpt/service/core/app/plugin/systemPluginSchema';
import { getSystemPluginCb } from '@/service/core/workflow/systemPlugins/register';

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

  await getSystemPluginCb(true);

  return {};
}

export default NextAPI(handler);
