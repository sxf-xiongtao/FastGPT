import { POST } from '@/web/common/api/request';
import { hashStr } from '@fastgpt/global/common/string/tools';
import type {
  CreatePasswordVerificationBody,
  CreatePasswordVerificationResponse,
  PasswordAuthorizationBody,
  PasswordAuthorizationResponse
} from '@fastgpt/global/openapi/support/user/account/password/api';

export const createPasswordVerification = (body: CreatePasswordVerificationBody) =>
  POST<CreatePasswordVerificationResponse>(
    '/proApi/support/user/account/password/verification/create',
    body
  );

export const authorizePasswordChange = (body: PasswordAuthorizationBody) =>
  POST<PasswordAuthorizationResponse>('/proApi/support/user/account/password/authorization', body);

/** 沿用现有登录协议，只向服务端提交新密码的 SHA-256 摘要。 */
export const updatePassword = ({
  newPassword,
  passwordChangeSession
}: {
  newPassword: string;
  passwordChangeSession: string;
}) =>
  POST<void>('/support/user/account/password/update', {
    newPsw: hashStr(newPassword),
    passwordChangeSession
  });

/**
 * 强制改密：使用独立端点，不依赖 pro 签发的一次性改密 Session，
 * 改为提交旧密码摘要由服务端比对。
 */
export const forceUpdatePassword = ({
  oldPassword,
  newPassword
}: {
  oldPassword: string;
  newPassword: string;
}) =>
  POST<void>('/support/user/account/password/forceUpdate', {
    oldPsw: hashStr(oldPassword),
    newPsw: hashStr(newPassword)
  });
