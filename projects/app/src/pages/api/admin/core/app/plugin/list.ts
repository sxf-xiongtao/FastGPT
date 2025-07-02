// import { getSystemPlugins } from '@/service/core/workflow/systemTools/register';
import { NextAPI } from '@/service/middleware/entry';
import type { SystemPluginTemplateListItemType } from '@fastgpt/global/core/app/plugin/type';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { getLocale } from '@fastgpt/service/common/middle/i18n';
import { getSystemPlugins } from '@fastgpt/service/core/app/plugin/controller';
import { parseI18nString } from '@fastgpt/global/common/i18n/utils';
import { MongoSystemPlugin } from '@fastgpt/service/core/app/plugin/systemPluginSchema';

export type getSystemPluginsQuery = {};

export type getSystemPluginsBody = {};

export type getSystemPluginsResponse = Array<
  SystemPluginTemplateListItemType & {
    inputListVal?: Record<string, any>;
  }
>;

async function handler(
  req: ApiRequestProps<getSystemPluginsBody, getSystemPluginsQuery>,
  res: ApiResponseType<any>
): Promise<getSystemPluginsResponse> {
  const lang = getLocale(req);
  const systemPlugins = (await getSystemPlugins()).filter((item) => !item.parentId);

  const dbPlugins = await MongoSystemPlugin.find().lean();

  return systemPlugins.map((item) => {
    const dbPlugin = dbPlugins.find((dbItem) => String(dbItem.pluginId) === String(item.id));
    return {
      ...item,
      name: parseI18nString(item.name, lang),
      intro: parseI18nString(item.intro, lang),
      inputListVal: dbPlugin?.inputListVal
    };
  });
}

export default NextAPI(handler);
