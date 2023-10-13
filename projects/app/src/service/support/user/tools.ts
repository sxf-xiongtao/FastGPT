import { authMaxUsers } from '@/service/support/user/auth';
import { MongoUser } from '@fastgpt/support/user/schema';
import { PRICE_SCALE } from '@/constants/common';

export async function findUserByUsername({ username }: { username: string }) {
  const user = await MongoUser.findOne({ username });

  if (!user) {
    return Promise.reject({
      code: 501
    });
  }

  return user;
}

export async function createUserByUsername({
  username,
  password,
  avatar,
  inviterId
}: {
  username: string;
  password: string;
  avatar?: string;
  inviterId?: string;
}) {
  await authMaxUsers();
  const response = await MongoUser.create({
    username,
    avatar,
    password,
    inviterId: inviterId ? inviterId : undefined,
    balance: (global.systemConfig.system?.userDefaultBalance || 2) * PRICE_SCALE
  });

  const user = response.toJSON();
  // @ts-ignore
  delete user.password;

  return user;
}
