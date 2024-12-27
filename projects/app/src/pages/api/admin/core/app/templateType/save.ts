import { ApiRequestProps } from '@fastgpt/service/type/next';
import { ApiResponseType } from '@fastgpt/service/type/next';
import { adminCert } from '@/service/support/permission/adminCert';
import { NextAPI } from '@/service/middleware/entry';
import { MongoTemplateTypes } from '@fastgpt/service/core/app/templates/templateTypeSchema';

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
  await adminCert({ req, authToken: true });
  const { typeId, typeName, typeOrder } = req.body;

  await MongoTemplateTypes.updateOne(
    { typeId: typeId },
    { $set: { typeId, typeName, typeOrder } },
    { upsert: true }
  );

  return {};
}

export default NextAPI(handler);
