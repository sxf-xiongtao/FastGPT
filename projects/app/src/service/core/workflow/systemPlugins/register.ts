import { PluginSourceEnum } from '@fastgpt/global/core/plugin/constants';
import { SystemPluginResponseType } from '@fastgpt/plugins/type';
import { isProduction } from '@fastgpt/service/common/system/constants';
import { SystemPluginTemplateItemType } from '@fastgpt/global/core/workflow/type';
import { getCommunityCb, getCommunityPlugins } from '@fastgpt/plugins/register';
import { cloneDeep } from 'lodash';
import { MongoSystemPluginSchema } from '@fastgpt/service/core/app/plugin/systemPluginSchema';
import { replaceVariable } from '@fastgpt/global/common/string/tools';

let list: string[] = ['dalle3'];

/* Get plugins */
export const getSystemPlugins = () => {
  const communityPlugins = getCommunityPlugins();

  const commercialPlugins = list.map<SystemPluginTemplateItemType>((name) => {
    const config = require(`./src/${name}/template.json`);

    const isFolder = list.find((item) => item.startsWith(`${name}/`));
    const parentIdList = name.split('/').slice(0, -1);
    const parentId =
      parentIdList.length > 0 ? `${PluginSourceEnum.commercial}-${parentIdList.join('/')}` : null;

    return {
      ...config,
      id: `${PluginSourceEnum.commercial}-${name}`,
      isActive: false,
      isFolder,
      parentId
    };
  });

  const plugins = [...communityPlugins, ...commercialPlugins];

  plugins.sort((a, b) => (b.weight || 0) - (a.weight || 0));

  return plugins;
};

export const getSystemPluginsAndLoadThem = async (refresh = false) => {
  if (isProduction && global.systemPlugins && !refresh) return cloneDeep(global.systemPlugins);

  if (!global.systemPlugins) {
    global.systemPlugins = [];
  }

  const systemPlugins = getSystemPlugins();

  const pluginConfigs = await MongoSystemPluginSchema.find();
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
  global.systemPlugins = systemPlugins;

  return cloneDeep(global.systemPlugins);
};

/* Get callback */
export const getSystemPluginCb = async () => {
  if (isProduction && global.systemPluginCb) return global.systemPluginCb;

  global.systemPluginCb = {};

  // Do not modify the following code
  const loadModule = async (name: string) => {
    const plugin = await import(`./src/${name}/index`);
    return plugin.default;
  };

  const result = (
    await Promise.all(
      list.map(async (name) => {
        try {
          return {
            name,
            cb: await loadModule(name)
          };
        } catch (error) {
          return;
        }
      })
    )
  ).filter(Boolean) as {
    name: string;
    cb: any;
  }[];

  global.systemPluginCb = result.reduce<Record<string, (e: any) => SystemPluginResponseType>>(
    (acc, { name, cb }) => {
      acc[name] = cb;
      return acc;
    },
    await getCommunityCb()
  );

  return global.systemPluginCb;
};
