import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoUser } from '@fastgpt/service/support/user/schema';

export const adminCert = async ({ req }: any) => {
  const result = await authCert({ req, authToken: true });
  const user = await MongoUser.findOne({
    _id: result.userId
  });
  if (user?.username !== 'root') {
    throw new Error('权限不足');
  }
};
