import { adminCert } from '@/service/support/permission/adminCert';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { PagingData, PagingParams } from '@/types';
import { UserModelSchema } from '@fastgpt/global/support/user/type';

export type AdminGetUsersQuery = {};
export type AdminGetUsersBody = PagingParams<{
  username: string;
}>;
export type AdminGetUsersResponse = PagingData<UserModelSchema>;

async function handler(
  req: ApiRequestProps<AdminGetUsersBody, AdminGetUsersQuery>,
  _res: ApiResponseType<any>
): Promise<AdminGetUsersResponse> {
  await adminCert({ req, authToken: true });
  const { pageNum = 1, pageSize = 20, username } = req.body;

  const match = {
    username: new RegExp(username, 'i')
  };

  const [records, total] = await Promise.all([
    MongoUser.find(match)
      .sort({ createTime: -1 })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    MongoUser.countDocuments(match)
  ]);
  return {
    total,
    pageNum,
    pageSize,
    data: records
  };
}
export default NextAPI(handler);
