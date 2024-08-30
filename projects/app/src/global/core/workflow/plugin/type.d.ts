import { FlowNodeTemplateTypeEnum } from '@fastgpt/global/core/workflow/constants';
import { SystemPluginTemplateItemType } from '@fastgpt/global/core/workflow/type';

export type EditCustomPluginType = {
  id?: string;
  templateType: FlowNodeTemplateTypeEnum;
  name: string;
  avatar: string;
  intro?: string;
  weight: number;
  originCost: number;
  isActive: boolean;
  inputConfig: {
    key: string;
    value?: string;
  }[];
  workflow: string;
};
