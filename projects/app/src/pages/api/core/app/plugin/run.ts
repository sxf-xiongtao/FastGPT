import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { getSystemPluginCb } from '@/service/core/workflow/systemPlugins/register';

export type runQuery = {};

export type runBody = {
  pluginName: string;
  data: any;
};

export type runResponse = {};

async function handler(
  req: ApiRequestProps<runBody, runQuery>,
  res: ApiResponseType<any>
): Promise<runResponse> {
  const { pluginName, data } = req.body;
  const pluginCb = await getSystemPluginCb();

  if (pluginCb[pluginName]) {
    return pluginCb[pluginName](data);
  }

  return Promise.reject('Plugin not found');
}

export default NextAPI(handler);
