import { ApiRequestProps } from '@fastgpt/service/type/next';

import { ApiResponseType } from '@fastgpt/service/type/next';
import { MongoAppTemplate } from '@fastgpt/service/core/app/templates/templateSchema';

import { adminCert } from '@/service/support/permission/adminCert';
import { NextAPI } from '@/service/middleware/entry';
import { isCommunityTemplate } from '@fastgpt/templates/register';
import { AppTemplateSchemaType } from '@fastgpt/global/core/app/type';
import { addAuditLog } from '@fastgpt/service/support/user/audit/util';
import { AdminAuditEventEnum } from '@fastgpt/global/support/user/audit/constants';
import { getUserDetail } from '@fastgpt/service/support/user/controller';

export type updateTemplateQuery = {};

export type updateTemplateBody = Omit<AppTemplateSchemaType, 'isQuickTemplate' | 'order'>;
export type updateTemplateResponse = {};

async function handler(
  req: ApiRequestProps<updateTemplateBody, updateTemplateQuery>,
  res: ApiResponseType<any>
): Promise<updateTemplateResponse> {
  const authResult = await adminCert({ req, authToken: true });
  const { templateId, name, intro, avatar, tags, type, isActive, userGuide, workflow, author } =
    req.body;

  const updateData = isCommunityTemplate(templateId)
    ? { isActive, tags, userGuide }
    : { name, intro, avatar, tags, type, isActive, userGuide, workflow, author };

  await MongoAppTemplate.updateOne({ templateId }, { $set: updateData }, { upsert: true });

  const userDetail = await getUserDetail({ tmbId: authResult.tmbId });
  (async () => {
    addAuditLog({
      tmbId: authResult.tmbId,
      teamId: userDetail.team.teamId,
      event: AdminAuditEventEnum.ADMIN_UPDATE_APP_TEMPLATE,
      params: {
        name: userDetail.username,
        templateName: name || 'Unknown Template'
      }
    });
  })();

  return {};
}

export default NextAPI(handler);
