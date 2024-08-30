import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import {
  SystemPluginTemplateItemType,
  WorkflowTemplateBasicType
} from '@fastgpt/global/core/workflow/type/index';
import { FlowNodeTemplateTypeEnum } from '@fastgpt/global/core/workflow/constants';
import { adminCert } from '@/service/support/permission/adminCert';
import { MongoSystemPluginSchema } from '@fastgpt/service/core/app/plugin/systemPluginSchema';
import { getNanoid } from '@fastgpt/global/common/string/tools';
import { isEqual } from 'lodash';

export type updateCustomPluginQuery = {};

export type updateCustomPluginBody = {
  pluginId: string;
  name: string;
  avatar: string;
  intro?: string;
  weight?: number;
  workflow: WorkflowTemplateBasicType;
  templateType: FlowNodeTemplateTypeEnum;
  originCost: number; // n points/one time
  inputConfig: SystemPluginTemplateItemType['inputConfig'];
  isActive: boolean;
};

export type updateCustomPluginResponse = {};

async function handler(
  req: ApiRequestProps<updateCustomPluginBody, updateCustomPluginQuery>,
  res: ApiResponseType<any>
): Promise<updateCustomPluginResponse> {
  await adminCert({ req, authToken: true });
  const {
    pluginId,
    name,
    avatar,
    isActive,
    intro,
    weight,
    workflow,
    templateType,
    originCost,
    inputConfig
  } = req.body;

  const plugin = await MongoSystemPluginSchema.findOne({ pluginId });

  if (!plugin || !plugin.customConfig) {
    return Promise.reject('plugin not found');
  }

  const isUpdateVersion =
    !isEqual(plugin.customConfig.workflow, workflow) ||
    plugin.customConfig.name !== name ||
    plugin.customConfig.avatar !== avatar ||
    plugin.customConfig.intro !== intro ||
    !isEqual(plugin.inputConfig, inputConfig);

  await MongoSystemPluginSchema.findOneAndUpdate(
    { pluginId },
    {
      isActive,
      inputConfig,
      originCost,
      currentCost: originCost,
      customConfig: {
        name,
        avatar,
        intro,
        version: isUpdateVersion ? getNanoid() : plugin.customConfig.version,
        weight,
        workflow,
        templateType
      }
    }
  );

  return {};
}

export default NextAPI(handler);
