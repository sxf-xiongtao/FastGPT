import { NextAPI } from '@/service/middleware/entry';
import { parseI18nString } from '@fastgpt/global/common/i18n/utils';
import type { SystemPluginTemplateListItemType } from '@fastgpt/global/core/app/plugin/type';
import { getLocale } from '@fastgpt/service/common/middle/i18n';
import { getSystemToolById, getSystemTools } from '@fastgpt/service/core/app/plugin/controller';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';

export type getSystemPluginsQuery = {
  toolId?: string;
};

export type getSystemPluginsBody = {};

export type getSystemPluginsResponse = SystemPluginTemplateListItemType[];

async function handler(
  req: ApiRequestProps<getSystemPluginsBody, getSystemPluginsQuery>,
  res: ApiResponseType<any>
): Promise<getSystemPluginsResponse> {
  const lang = getLocale(req);
  const { toolId } = req.query;
  if (!toolId) {
    return (await getSystemTools()).map((item) => ({
      ...item,
      name: parseI18nString(item.name, lang),
      intro: parseI18nString(item.intro, lang)
    }));
  } else {
    const res = await getSystemToolById(toolId);
    return res
      ? [
          {
            ...res,
            name: parseI18nString(res.name, lang),
            intro: parseI18nString(res.intro, lang)
          }
        ]
      : [];
  }
}

export default NextAPI(handler);
