import { UserAuthTypeEnum } from '@fastgpt/global/support/user/auth/constants';
import { MongoUserAuth } from './schema';

export const authCode = async ({
  username,
  code,
  type
}: {
  username: string;
  code: string;
  type: `${UserAuthTypeEnum}`;
}) => {
  const result = await MongoUserAuth.findOne({
    key: username,
    type,
    code
  });

  if (!result || result.code !== code) {
    return Promise.reject('验证码错误');
  }

  return 'SUCCESS';
};
