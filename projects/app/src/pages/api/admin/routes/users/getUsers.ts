import { adminCert } from '@/service/support/permission/adminCert';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { UserModelSchema } from '@fastgpt/global/support/user/type';
import { PaginationProps, PaginationResponse } from '@fastgpt/web/common/fetch/type';
import { parsePaginationRequest } from '@fastgpt/service/common/api/pagination';

export type AdminGetUsersQuery = {};
export type AdminGetUsersBody = PaginationProps<{
  username: string;
}>;
export type AdminGetUsersResponse = PaginationResponse<UserModelSchema>;

async function handler(
  req: ApiRequestProps<AdminGetUsersBody, AdminGetUsersQuery>,
  _res: ApiResponseType<any>
): Promise<AdminGetUsersResponse> {
  await adminCert({ req, authToken: true });
  const { username } = req.body;
  const { offset, pageSize } = parsePaginationRequest(req);

  const match = {
    username: new RegExp(username, 'i')
  };

  const [records, total] = await Promise.all([
    MongoUser.find(match).sort({ createTime: -1 }).skip(offset).limit(pageSize).lean(),
    MongoUser.countDocuments(match)
  ]);
  return {
    total,
    list: records
  };
}
export default NextAPI(handler);
