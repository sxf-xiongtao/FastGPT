import { ApiRequestProps } from '@fastgpt/service/type/next';
import { ApiResponseType } from '@fastgpt/service/type/next';
import { adminCert } from '@/service/support/permission/adminCert';
import { NextAPI } from '@/service/middleware/entry';
import { MongoTemplateTypes } from '@fastgpt/service/core/app/templates/templateTypeSchema';
import { addAuditLog } from '@fastgpt/service/support/user/audit/util';
import { AdminAuditEventEnum } from '@fastgpt/global/support/user/audit/constants';
import { getUserDetail } from '@fastgpt/service/support/user/controller';

export type SaveTemplateTypeQuery = {};

export type SaveTemplateTypeBody = {
  typeId: string;
  typeName: string;
  typeOrder: number;
};

export type SaveTemplateTypeResponse = {};

async function handler(
  req: ApiRequestProps<SaveTemplateTypeBody, SaveTemplateTypeQuery>,
  res: ApiResponseType<any>
): Promise<SaveTemplateTypeResponse> {
  const authResult = await adminCert({ req, authToken: true });
  const { typeId, typeName, typeOrder } = req.body;

  await MongoTemplateTypes.updateOne(
    { typeId: typeId },
    { $set: { typeId, typeName, typeOrder } },
    { upsert: true }
  );

  const userDetail = await getUserDetail({ tmbId: authResult.tmbId });
  (async () => {
    addAuditLog({
      tmbId: authResult.tmbId,
      teamId: userDetail.team.teamId,
      event: AdminAuditEventEnum.ADMIN_SAVE_TEMPLATE_TYPE,
      params: {
        name: userDetail.username,
        typeName: typeName
      }
    });
  })();

  return {};
}

export default NextAPI(handler);
