import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { SystemPluginTemplateItemType } from '@fastgpt/global/core/workflow/type';
import { getSystemPluginsAndLoadThem } from '@/service/core/workflow/systemPlugins/register';
import { MongoSystemPluginSchema } from '@fastgpt/service/core/app/plugin/systemPluginSchema';

export type getSystemPluginsQuery = {};

export type getSystemPluginsBody = {};

export type getSystemPluginsResponse = SystemPluginTemplateItemType[];

async function handler(
  req: ApiRequestProps<getSystemPluginsBody, getSystemPluginsQuery>,
  res: ApiResponseType<any>
): Promise<getSystemPluginsResponse> {
  // Get mongodb plugin config
  const pluginConfigs = await MongoSystemPluginSchema.find();

  const systemPlugins = (await getSystemPluginsAndLoadThem()).filter((item) => !item.parentId);

  systemPlugins.forEach((plugin) => {
    const pluginConfig = pluginConfigs.find((config) => config.pluginId === plugin.id);
    if (pluginConfig) {
      plugin.isActive = pluginConfig.isActive ?? plugin.isActive ?? false;
      plugin.inputConfig = pluginConfig.inputConfig ?? [];
      plugin.originCost = pluginConfig.originCost ?? 0;
      plugin.currentCost = pluginConfig.currentCost ?? 0;
    }
  });

  // isActive = false 的排前面
  systemPlugins.sort((a, b) => {
    if (a.isActive === b.isActive) {
      return 0;
    } else {
      return a.isActive ? 1 : -1;
    }
  });

  return systemPlugins;
}

export default NextAPI(handler);
