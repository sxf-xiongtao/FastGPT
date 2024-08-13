import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { SystemPluginTemplateItemType } from '@fastgpt/global/core/workflow/type';
import { getSystemPluginsAndLoadThem } from '@/service/core/workflow/systemPlugins/register';

export type getSystemPluginsQuery = {};

export type getSystemPluginsBody = {};

export type getSystemPluginsResponse = SystemPluginTemplateItemType[];

async function handler(
  req: ApiRequestProps<getSystemPluginsBody, getSystemPluginsQuery>,
  res: ApiResponseType<any>
): Promise<getSystemPluginsResponse> {
  // Get mongodb plugin config

  const systemPlugins = getSystemPluginsAndLoadThem();

  return systemPlugins;
}

export default NextAPI(handler);
