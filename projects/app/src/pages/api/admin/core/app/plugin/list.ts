import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { SystemPluginTemplateItemType } from '@fastgpt/global/core/workflow/type';
import { getSystemPluginsAndLoadThem } from '@/service/core/workflow/systemPlugins/register';
import { MongoSystemPlugin } from '@fastgpt/service/core/app/plugin/systemPluginSchema';

export type getSystemPluginsQuery = {};

export type getSystemPluginsBody = {};

export type getSystemPluginsResponse = SystemPluginTemplateItemType[];

async function handler(
  req: ApiRequestProps<getSystemPluginsBody, getSystemPluginsQuery>,
  res: ApiResponseType<any>
): Promise<getSystemPluginsResponse> {
  // Get mongodb plugin config
  // const pluginConfigs = await MongoSystemPlugin.find();

  const systemPlugins = (await getSystemPluginsAndLoadThem()).filter((item) => !item.parentId);

  // systemPlugins.forEach((plugin) => {
  //   const pluginConfig = pluginConfigs.find((config) => config.pluginId === plugin.id);
  //   if (pluginConfig) {
  //     plugin.isActive = pluginConfig.isActive ?? plugin.isActive ?? false;
  //     plugin.inputConfig = pluginConfig.inputConfig ?? [];
  //     plugin.originCost = pluginConfig.originCost ?? 0;
  //     plugin.currentCost = pluginConfig.currentCost ?? 0;
  //     plugin.hasTokenFee = pluginConfig.hasTokenFee ?? false;
  //     // plugin.customWorkflow = pluginConfig.customConfig
  //     //   ? JSON.stringify(pluginConfig.customConfig?.workflow || {}, null, 2)
  //     //   : undefined;
  //   }
  // });

  return systemPlugins;
}

export default NextAPI(handler);
