import { RedirectFn, GetUserInfoFn } from '../type.d';

// 用于存储生成的code和对应的用户信息
const codeMap = new Map();

export const test_redirectFn: RedirectFn = async ({ redirect_uri, state }) => {
  // 生成随机 code
  const code = Math.random().toString(36).substring(2, 15);

  // 存储 code 对应的模拟用户信息
  codeMap.set(code, {
    username: 'testuser1234',
    avatar: 'https://example.com/avatar.jpg',
    contact: '15677751111'
  });

  const redirectUrl = `${redirect_uri}?code=${code}${state ? `&state=${state}` : ''}`;

  return { redirectUrl };
};

export const test_getUserInfo: GetUserInfoFn = async (code: string) => {
  // 获取存储的用户信息
  const userInfo = codeMap.get(code);
  console.log(userInfo, code);
  if (!userInfo) {
    return Promise.reject('Invalid code');
  }

  // 使用完后删除 code
  codeMap.delete(code);

  return userInfo;
};
