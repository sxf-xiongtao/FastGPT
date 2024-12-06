import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { SystemPluginTemplateItemType } from '@fastgpt/global/core/workflow/type/index';
import { adminCert } from '@/service/support/permission/adminCert';
import { MongoSystemPlugin } from '@fastgpt/service/core/app/plugin/systemPluginSchema';
import { getNanoid } from '@fastgpt/global/common/string/tools';
import { PluginSourceEnum } from '@fastgpt/global/core/plugin/constants';

export type createPluginQuery = {};

export type createPluginBody = {
  name: string;
  avatar: string;
  intro?: string;
  templateType: string;
  originCost?: number;
  currentCost?: number;
  hasTokenFee?: boolean;
  inputConfig: SystemPluginTemplateItemType['inputConfig'];
  associatedPluginId?: string;
  userGuide?: string;
};

export type createPluginResponse = {};

async function handler(
  req: ApiRequestProps<createPluginBody, createPluginQuery>,
  res: ApiResponseType<any>
): Promise<createPluginResponse> {
  await adminCert({ req, authToken: true });
  const {
    name,
    avatar,
    intro,
    templateType,
    inputConfig,
    originCost,
    currentCost,
    hasTokenFee,
    associatedPluginId,
    userGuide
  } = req.body;

  const pluginId = `${PluginSourceEnum.commercial}-${getNanoid(12)}`;

  await MongoSystemPlugin.create({
    pluginId,
    isActive: true,
    inputConfig,
    originCost,
    currentCost,
    hasTokenFee,
    customConfig: {
      name,
      avatar,
      intro,
      version: getNanoid(),
      templateType,
      associatedPluginId,
      userGuide
    }
  });

  return {};
}

export default NextAPI(handler);
