import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { SystemPluginTemplateItemType } from '@fastgpt/global/core/workflow/type';
import { adminCert } from '@/service/support/permission/adminCert';
import { MongoSystemPluginSchema } from '@fastgpt/service/core/app/plugin/systemPluginSchema';

export type updateSystemPluginQuery = {};

export type updateSystemPluginBody = {
  pluginId: string;
  originCost?: number; // n points/one time
  currentCost?: number;
  isActive?: boolean;
  inputConfig?: SystemPluginTemplateItemType['inputConfig'];
};

export type updateSystemPluginResponse = {};

async function handler(
  req: ApiRequestProps<updateSystemPluginBody, updateSystemPluginQuery>,
  res: ApiResponseType<any>
): Promise<updateSystemPluginResponse> {
  await adminCert({ req, authToken: true });

  const { pluginId, originCost, currentCost, isActive, inputConfig } = req.body;

  await MongoSystemPluginSchema.updateOne(
    {
      pluginId
    },
    {
      originCost,
      currentCost: originCost,
      isActive,
      inputConfig
    },
    {
      upsert: true
    }
  );

  return {};
}

export default NextAPI(handler);
