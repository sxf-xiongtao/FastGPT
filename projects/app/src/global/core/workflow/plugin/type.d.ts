import { SecretValueType } from '@fastgpt/global/common/secret/type';
import { AppListItemType, SystemPluginListItemType } from '@fastgpt/global/core/app/type';
import { FlowNodeTemplateTypeEnum } from '@fastgpt/global/core/workflow/constants';
import type { FlowNodeInputItemType } from '@fastgpt/global/core/workflow/type/io';

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
  associatedPluginId?: string;
  userGuide?: string;
  author?: string;

  inputList?: FlowNodeInputItemType['inputList'];
  inputListVal?: Record<string, any>;

  // @deprecated
  workflow?: string;
};
