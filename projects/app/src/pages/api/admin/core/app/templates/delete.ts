import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { adminCert } from '@/service/support/permission/adminCert';
import { MongoAppTemplate } from '@fastgpt/service/core/app/templates/templateSchema';
import { addAuditLog } from '@fastgpt/service/support/user/audit/util';
import { AdminAuditEventEnum } from '@fastgpt/global/support/user/audit/constants';
import { getUserDetail } from '@fastgpt/service/support/user/controller';

export type deleteTemplateQuery = {
  id: string;
};

export type deleteTemplateBody = {};

export type deleteTemplateResponse = {};

async function handler(
  req: ApiRequestProps<deleteTemplateBody, deleteTemplateQuery>,
  res: ApiResponseType<any>
): Promise<deleteTemplateResponse> {
  const authResult = await adminCert({ req, authToken: true });

  const template = await MongoAppTemplate.findOne({ templateId: req.query.id }, 'name').lean();
  const templateName = template?.name || 'Unknown Template';

  await MongoAppTemplate.deleteOne({ templateId: req.query.id });

  const userDetail = await getUserDetail({ tmbId: authResult.tmbId });
  (async () => {
    addAuditLog({
      tmbId: authResult.tmbId,
      teamId: userDetail.team.teamId,
      event: AdminAuditEventEnum.ADMIN_DELETE_APP_TEMPLATE,
      params: {
        name: userDetail.username,
        templateName: templateName
      }
    });
  })();

  return {};
}

export default NextAPI(handler);
