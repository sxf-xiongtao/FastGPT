import { NextAPI } from '@/service/middleware/entry';
import type { SystemPluginTemplateListItemType } from '@fastgpt/global/core/app/plugin/type';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { getLocale } from '@fastgpt/service/common/middle/i18n';
import { getSystemTools } from '@fastgpt/service/core/app/plugin/controller';
import { parseI18nString } from '@fastgpt/global/common/i18n/utils';
import { MongoSystemPlugin } from '@fastgpt/service/core/app/plugin/systemPluginSchema';
import type { InputConfigType } from '@fastgpt/global/core/workflow/type/io';
import type { SystemPluginConfigSchemaType } from '@fastgpt/service/core/app/plugin/type';

export type getSystemPluginsQuery = {
  parentId?: string;
};

export type getSystemPluginsBody = {};

export type getSystemPluginsResponse = Array<SystemPluginTemplateListItemType>;

async function handler(
  req: ApiRequestProps<getSystemPluginsBody, getSystemPluginsQuery>,
  res: ApiResponseType<any>
): Promise<getSystemPluginsResponse> {
  const lang = getLocale(req);
  const { parentId } = req.query;

  const allSystemTools = await getSystemTools();
  const systemTools = parentId
    ? allSystemTools.filter((item) => item.parentId === parentId)
    : allSystemTools.filter((item) => !item.parentId);

  const dbPlugins = await MongoSystemPlugin.find()
    .lean()
    .then((res) => {
      const map = new Map<string, SystemPluginConfigSchemaType>();
      res.forEach((item) => {
        map.set(String(item.pluginId), item);
      });
      return map;
    });

  return systemTools.map((item) => {
    const dbPlugin = dbPlugins.get(String(item.id));

    const formattedInputList = item.inputList?.map((cfg: InputConfigType) => {
      const value = dbPlugin?.inputListVal?.[cfg.key] ?? '';

      return {
        ...cfg,
        value
      };
    });

    return {
      ...item,
      name: parseI18nString(item.name, lang),
      intro: parseI18nString(item.intro, lang),
      inputList: formattedInputList,
      inputListVal: dbPlugin?.inputListVal
    };
  });
}

export default NextAPI(handler);
