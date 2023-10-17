import { MongoUser } from '@fastgpt/service/support/user/schema';

export async function authMaxUsers() {
  const usersCount = await MongoUser.countDocuments();

  if (usersCount > global.licenseData.maxRegister) return Promise.reject('超过最大用户数');
}
