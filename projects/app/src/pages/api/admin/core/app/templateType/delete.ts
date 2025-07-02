import { NextAPI } from '@/service/middleware/entry';
import { adminCert } from '@/service/support/permission/adminCert';
import { MongoAppTemplate } from '@fastgpt/service/core/app/templates/templateSchema';
import { MongoTemplateTypes } from '@fastgpt/service/core/app/templates/templateTypeSchema';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { addAuditLog } from '@fastgpt/service/support/user/audit/util';
import { AdminAuditEventEnum } from '@fastgpt/global/support/user/audit/constants';
import { getUserDetail } from '@fastgpt/service/support/user/controller';

export type deleteTemplateTypeQuery = {
  typeId: string;
};

export type deleteTemplateTypeBody = {};

export type deleteTemplateTypeResponse = {};

async function handler(
  req: ApiRequestProps<deleteTemplateTypeBody, deleteTemplateTypeQuery>,
  res: ApiResponseType<any>
): Promise<deleteTemplateTypeResponse> {
  const authResult = await adminCert({ req, authToken: true });
  const { typeId } = req.query;

  const templateType = await MongoTemplateTypes.findOne({ typeId }, 'typeName').lean();
  const typeName = templateType?.typeName || 'Unknown Type';

  await mongoSessionRun(async (session) => {
    await MongoTemplateTypes.deleteOne({ typeId }).session(session);
    await MongoAppTemplate.deleteMany({ tags: typeId }).session(session);
  });

  const userDetail = await getUserDetail({ tmbId: authResult.tmbId });
  (async () => {
    addAuditLog({
      tmbId: authResult.tmbId,
      teamId: userDetail.team.teamId,
      event: AdminAuditEventEnum.ADMIN_DELETE_TEMPLATE_TYPE,
      params: {
        name: userDetail.username,
        typeName: typeName
      }
    });
  })();

  return {};
}

export default NextAPI(handler);
