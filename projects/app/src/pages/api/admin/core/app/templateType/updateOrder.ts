import { NextAPI } from '@/service/middleware/entry';
import { adminCert } from '@/service/support/permission/adminCert';
import { AppTemplateTypeEnum } from '@fastgpt/global/core/app/constants';
import { MongoTemplateTypes } from '@fastgpt/service/core/app/templates/templateTypeSchema';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';

export type updateTemplateTypeOrderQuery = {};

export type updateTemplateTypeOrderBody = {
  types: {
    typeId: string;
    typeOrder: number;
  }[];
};

export type updateTemplateTypeOrderResponse = {};

async function handler(
  req: ApiRequestProps<updateTemplateTypeOrderBody, updateTemplateTypeOrderQuery>,
  res: ApiResponseType<any>
): Promise<updateTemplateTypeOrderResponse> {
  await adminCert({ req, authToken: true });
  const { types } = req.body;

  await MongoTemplateTypes.bulkWrite(
    types.map((type, index) => ({
      updateOne: { filter: { typeId: type.typeId }, update: { $set: { typeOrder: index } } }
    }))
  );

  return {};
}

export default NextAPI(handler);
