import { FlowNodeTemplateTypeEnum } from '@fastgpt/global/core/workflow/constants';

export const getPluginTemplates = () => [
  {
    type: FlowNodeTemplateTypeEnum.tools,
    label: '工具',
    list: []
  },
  {
    type: FlowNodeTemplateTypeEnum.search,
    label: '搜索',
    list: []
  },
  {
    type: FlowNodeTemplateTypeEnum.multimodal,
    label: '多模态',
    list: []
  },
  {
    type: FlowNodeTemplateTypeEnum.other,
    label: '其他',
    list: []
  }
];
