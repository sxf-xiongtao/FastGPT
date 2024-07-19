import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { SystemPluginTemplateItemType } from '@fastgpt/global/core/workflow/type';
import { getSystemPluginTemplates } from '@/service/core/workflow/systemPlugins/register';
import { replaceVariable } from '@fastgpt/global/common/string/tools';
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

  const systemPlugins = getSystemPluginTemplates();

  systemPlugins.forEach((plugin) => {
    const pluginConfig = pluginConfigs.find((config) => config.pluginId === plugin.id);

    if (pluginConfig) {
      // 修改自身以及 children 的属性
      const children = systemPlugins.filter((item) => item.parentId === plugin.id);
      const list = [plugin, ...children];
      list.forEach((item) => {
        item.isActive = pluginConfig.isActive ?? false;
        item.originCost = pluginConfig.originCost ?? 0;
        item.currentCost = pluginConfig.currentCost ?? 0;

        // 使用 inputConfig 的内容，替换插件的 nodes
        if (pluginConfig.inputConfig) {
          let nodeString = JSON.stringify(item.workflow.nodes);
          pluginConfig.inputConfig.forEach((inputConfig) => {
            nodeString = replaceVariable(nodeString, {
              [inputConfig.key]: inputConfig.value
            });
          });

          item.workflow.nodes = JSON.parse(nodeString);
        }
      });
    }
  });

  return systemPlugins;
}

export default NextAPI(handler);
