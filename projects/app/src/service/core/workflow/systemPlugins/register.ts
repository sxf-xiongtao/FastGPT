import { PluginSourceEnum } from '@fastgpt/global/core/plugin/constants';
import { SystemPluginResponseType } from '@fastgpt/plugins/type';
import { isProduction } from '@fastgpt/service/common/system/constants';
import { SystemPluginTemplateItemType } from '@fastgpt/global/core/workflow/type';
import { getCommunityCb, getCommunityPlugins } from '@fastgpt/plugins/register';
import { cloneDeep } from 'lodash';

let list: string[] = ['dalle3'];

/* Get plugins */
export const getSystemPluginTemplates = (refresh = false) => {
  if (isProduction && global.systemPlugins && !refresh) return cloneDeep(global.systemPlugins);

  if (!global.systemPlugins) {
    global.systemPlugins = [];
  }

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

  global.systemPlugins = [...communityPlugins, ...commercialPlugins];
  global.systemPlugins.sort((a, b) => (b.weight || 0) - (a.weight || 0));

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
