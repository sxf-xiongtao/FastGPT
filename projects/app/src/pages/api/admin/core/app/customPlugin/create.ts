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
import { PluginSourceEnum } from '@fastgpt/global/core/plugin/constants';

export type createSystemPluginQuery = {};

export type createSystemPluginBody = {
  name: string;
  avatar: string;
  intro?: string;
  weight?: number;
  workflow: WorkflowTemplateBasicType;
  templateType: FlowNodeTemplateTypeEnum;
  originCost: number; // n points/one time
  inputConfig: SystemPluginTemplateItemType['inputConfig'];
};

export type createSystemPluginResponse = {};

async function handler(
  req: ApiRequestProps<createSystemPluginBody, createSystemPluginQuery>,
  res: ApiResponseType<any>
): Promise<createSystemPluginResponse> {
  await adminCert({ req, authToken: true });
  const { name, avatar, intro, weight, workflow, templateType, originCost, inputConfig } = req.body;

  const pluginId = `${PluginSourceEnum.commercial}-${getNanoid(12)}`;

  await MongoSystemPluginSchema.create({
    pluginId,
    isActive: true,
    inputConfig,
    originCost,
    currentCost: originCost,
    customConfig: {
      name,
      avatar,
      intro,
      version: getNanoid(),
      weight,
      workflow,
      templateType
    }
  });

  return {};
}

export default NextAPI(handler);
