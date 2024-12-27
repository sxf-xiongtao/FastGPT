import { ApiRequestProps } from '@fastgpt/service/type/next';
import { ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { adminCert } from '@/service/support/permission/adminCert';
import { WorkflowTemplateBasicType } from '@fastgpt/global/core/workflow/type';
import { PluginSourceEnum } from '@fastgpt/global/core/plugin/constants';
import { getNanoid } from '@fastgpt/global/common/string/tools';
import { MongoAppTemplate } from '@fastgpt/service/core/app/templates/templateSchema';

export type createTemplateQuery = {};

export type createTemplateBody = {
  name: string;
  intro: string;
  avatar: string;
  tags: string[];
  type: string;
  isActive?: boolean;
  userGuide?: {
    type: 'markdown' | 'link';
    content: string;
  };
  workflow: WorkflowTemplateBasicType;
};

export type createTemplateResponse = {};

async function handler(
  req: ApiRequestProps<createTemplateBody, createTemplateQuery>,
  res: ApiResponseType<any>
): Promise<createTemplateResponse> {
  await adminCert({ req, authToken: true });
  const { name, intro, avatar, tags, type, isActive, userGuide, workflow } = req.body;

  const templateId = `${PluginSourceEnum.commercial}-${getNanoid(12)}`;

  await MongoAppTemplate.create({
    templateId,
    name,
    intro,
    avatar,
    tags,
    type,
    isActive,
    userGuide,
    workflow
  });

  return {};
}

export default NextAPI(handler);
