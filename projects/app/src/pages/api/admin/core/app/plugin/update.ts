import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import {
  SystemPluginTemplateItemType,
  WorkflowTemplateBasicType
} from '@fastgpt/global/core/workflow/type/index';
import { adminCert } from '@/service/support/permission/adminCert';
import { MongoSystemPlugin } from '@fastgpt/service/core/app/plugin/systemPluginSchema';
import { getNanoid } from '@fastgpt/global/common/string/tools';
import { isEqual } from 'lodash';
import { getSystemPluginCb } from '@/service/core/workflow/systemPlugins/register';

export type updatePluginQuery = {};

export type updatePluginBody = {
  pluginId: string;
  // 基础字段
  originCost?: number;
  currentCost?: number;
  hasTokenFee?: boolean;
  isActive?: boolean;
  inputConfig?: SystemPluginTemplateItemType['inputConfig'];
  // 自定义插件字段
  name?: string;
  avatar?: string;
  intro?: string;
  weight?: number;
  workflow?: WorkflowTemplateBasicType;
  templateType?: string;
  associatedPluginId?: string;
  userGuide?: string;
  author?: string;
};

export type updatePluginResponse = {};

async function handler(
  req: ApiRequestProps<updatePluginBody, updatePluginQuery>,
  res: ApiResponseType<any>
): Promise<updatePluginResponse> {
  await adminCert({ req, authToken: true });
  const { pluginId, ...updateFields } = req.body;

  // 查找插件
  const plugin = await MongoSystemPlugin.findOne({ pluginId });
  // if (!plugin) {
  //   return Promise.reject('plugin not found');
  // }

  // 基础更新字段
  const baseUpdateFields = {
    pluginId,
    isActive: updateFields.isActive,
    inputConfig: updateFields.inputConfig,
    originCost: updateFields.originCost,
    currentCost: updateFields.currentCost,
    hasTokenFee: updateFields.hasTokenFee
  };

  // 如果是自定义插件,需要更新 customConfig
  if (plugin && plugin.customConfig) {
    const isUpdateVersion =
      !isEqual(plugin.customConfig.workflow, updateFields.workflow) ||
      plugin.customConfig.name !== updateFields.name ||
      plugin.customConfig.avatar !== updateFields.avatar ||
      plugin.customConfig.intro !== updateFields.intro ||
      !isEqual(plugin.inputConfig, updateFields.inputConfig);

    await MongoSystemPlugin.findOneAndUpdate(
      { pluginId },
      {
        ...baseUpdateFields,
        customConfig: {
          name: updateFields.name,
          avatar: updateFields.avatar,
          intro: updateFields.intro,
          version: isUpdateVersion ? getNanoid() : plugin.customConfig.version,
          weight: updateFields.weight,
          workflow: updateFields.workflow,
          templateType: updateFields.templateType,
          associatedPluginId: updateFields.associatedPluginId,
          userGuide: updateFields.userGuide,
          author: updateFields.author
        }
      }
    );
  } else {
    // 系统插件只更新基础字段
    await MongoSystemPlugin.updateOne({ pluginId }, baseUpdateFields, { upsert: true });
  }

  // 重新获取插件
  await getSystemPluginCb(true);

  return {};
}

export default NextAPI(handler);
