import { User } from '../mongo';

export async function authMaxUsers() {
  const usersCount = await User.countDocuments();

  if (usersCount > global.licenseData.maxRegister) return Promise.reject('超过最大用户数');
}
