import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { adminCert } from '@/service/support/permission/adminCert';
import type { LogLevelEnum } from '@fastgpt/service/common/system/log/constant';
import { getMongoLog } from '@fastgpt/service/common/system/log/schema';
import { readFromSecondary } from '@fastgpt/service/common/mongo/utils';
import type { PaginationProps, PaginationResponse } from '@fastgpt/web/common/fetch/type';
import { parsePaginationRequest } from '@fastgpt/service/common/api/pagination';
import type { SystemLogType } from '@fastgpt/service/common/system/log/type';
export type listQuery = {};

export type listBody = PaginationProps<{
  search?: string;
  logLevel?: LogLevelEnum[];
}>;

export type listResponse = PaginationResponse<SystemLogType>;

async function handler(
  req: ApiRequestProps<listBody, listQuery>,
  res: ApiResponseType<any>
): Promise<listResponse> {
  await adminCert({ req, authToken: true });
  const { search, logLevel = [3] } = req.body;
  const { offset, pageSize } = parsePaginationRequest(req);

  const match = {
    level: {
      $in: logLevel
    },
    ...(search && { text: new RegExp(search, 'i') })
  };

  const [records, total] = await Promise.all([
    getMongoLog()
      .find(match, undefined, {
        skip: offset,
        limit: pageSize,
        ...readFromSecondary
      })
      .sort({ _id: -1 }),
    getMongoLog().countDocuments(match, { ...readFromSecondary })
  ]);

  return {
    list: records,
    total
  };
}

export default NextAPI(handler);
