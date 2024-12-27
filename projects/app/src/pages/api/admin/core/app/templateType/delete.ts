import { NextAPI } from '@/service/middleware/entry';
import { adminCert } from '@/service/support/permission/adminCert';
import { MongoAppTemplate } from '@fastgpt/service/core/app/templates/templateSchema';
import { MongoTemplateTypes } from '@fastgpt/service/core/app/templates/templateTypeSchema';
import { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';

export type deleteTemplateTypeQuery = {
  typeId: string;
};

export type deleteTemplateTypeBody = {};

export type deleteTemplateTypeResponse = {};

async function handler(
  req: ApiRequestProps<deleteTemplateTypeBody, deleteTemplateTypeQuery>,
  res: ApiResponseType<any>
): Promise<deleteTemplateTypeResponse> {
  await adminCert({ req, authToken: true });
  const { typeId } = req.query;

  await mongoSessionRun(async (session) => {
    await MongoTemplateTypes.deleteOne({ typeId }).session(session);
    await MongoAppTemplate.deleteMany({ tags: typeId }).session(session);
  });

  return {};
}

export default NextAPI(handler);
