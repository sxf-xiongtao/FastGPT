import { ERROR_ENUM } from '@fastgpt/global/common/error/errorCode';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoUser } from '@fastgpt/service/support/user/schema';

export const adminCert = async ({ req }: any) => {
  try {
    const result = await authCert({ req, authToken: true });
    const user = await MongoUser.findOne({
      _id: result.userId
    });

    if (user && user.username !== 'root') {
      return Promise.reject(ERROR_ENUM.unAuthorization);
    }
  } catch (error) {
    throw error;
  }
};
