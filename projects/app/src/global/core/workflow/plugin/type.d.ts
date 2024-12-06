import { AppListItemType, SystemPluginListItemType } from '@fastgpt/global/core/app/type';
import { FlowNodeTemplateTypeEnum } from '@fastgpt/global/core/workflow/constants';
import { SystemPluginTemplateItemType } from '@fastgpt/global/core/workflow/type';

export type EditCustomPluginType = {
  id?: string;
  templateType: string;
  name: string;
  avatar: string;
  intro?: string;
  originCost?: number;
  currentCost?: number;
  hasTokenFee?: boolean;
  isActive: boolean;
  inputConfig: {
    key: string;
    value?: string;
  }[];
  workflow: string;
  associatedPluginId?: string;
  userGuide?: string;
};
