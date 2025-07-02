import type { ApiRequestProps } from '@fastgpt/service/type/next';
import type { ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { adminCert } from '@/service/support/permission/adminCert';
import type { WorkflowTemplateBasicType } from '@fastgpt/global/core/workflow/type';
import { PluginSourceEnum } from '@fastgpt/global/core/app/plugin/constants';
import { getNanoid } from '@fastgpt/global/common/string/tools';
import { MongoAppTemplate } from '@fastgpt/service/core/app/templates/templateSchema';
import { addAuditLog } from '@fastgpt/service/support/user/audit/util';
import { AdminAuditEventEnum } from '@fastgpt/global/support/user/audit/constants';
import { getUserDetail } from '@fastgpt/service/support/user/controller';

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
  const authResult = await adminCert({ req, authToken: true });
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

  const userDetail = await getUserDetail({ tmbId: authResult.tmbId });
  (async () => {
    addAuditLog({
      tmbId: authResult.tmbId,
      teamId: userDetail.team.teamId,
      event: AdminAuditEventEnum.ADMIN_CREATE_APP_TEMPLATE,
      params: {
        name: userDetail.username,
        templateName: name
      }
    });
  })();

  return {};
}

export default NextAPI(handler);
