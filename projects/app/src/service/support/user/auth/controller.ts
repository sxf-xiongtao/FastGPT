import { UserAuthTypeEnum } from '@fastgpt/global/support/user/auth/constants';
import { MongoUserAuth } from './schema';
import { i18nT } from '@fastgpt/web/i18n/utils';

export const authCode = async ({
  username,
  type,
  code
}: {
  username: string;
  type: `${UserAuthTypeEnum}`;
  code: string;
}) => {
  const result = await MongoUserAuth.findOne({
    key: username,
    type,
    code: { $regex: new RegExp(code, 'i') }
  });

  if (!result) {
    return Promise.reject(i18nT('common:error.code_error'));
  }

  return 'SUCCESS';
};
