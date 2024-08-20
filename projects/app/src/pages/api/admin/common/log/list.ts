import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { adminCert } from '@/service/support/permission/adminCert';
import { LogLevelEnum } from '@fastgpt/service/common/system/log/constant';
import { getMongoLog } from '@fastgpt/service/common/system/log/schema';
export type listQuery = {};

export type listBody = {
  pageNum: number;
  pageSize: number;
  search?: string;
  logLevel?: LogLevelEnum[];
};

export type listResponse = {};

async function handler(
  req: ApiRequestProps<listBody, listQuery>,
  res: ApiResponseType<any>
): Promise<listResponse> {
  await adminCert({ req, authToken: true });
  const { pageNum = 1, pageSize = 10, search, logLevel = [3] } = req.body;
  const match = {
    level: {
      $in: logLevel
    },
    ...(search && { text: new RegExp(search, 'i') })
  };
  const [records, total] = await Promise.all([
    getMongoLog()
      .find(match, undefined, {
        skip: (pageNum - 1) * pageSize,
        limit: pageSize
      })
      .sort({ createTime: -1 }),
    getMongoLog().countDocuments({})
  ]);
  return {
    data: records,
    total
  };
}

export default NextAPI(handler);
