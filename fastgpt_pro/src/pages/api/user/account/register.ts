import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/service/response';
import { User } from '@/service/models/user';
import { connectToDatabase, promotionRecord } from '@/service/mongo';
import { generateToken, setCookie } from '@/service/utils/tools';
import { PRICE_SCALE, UserAuthTypeEnum } from '@/constants/common';
import { authCode } from './sendCode';
import { formatPrice } from '@/utils/user';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    const { username, code, password, inviterId } = req.body;
    await connectToDatabase();

    if (!username || !code || !password) {
      throw new Error('缺少参数');
    }

    // 验证码校验
    await authCode({
      username,
      type: UserAuthTypeEnum.register,
      code
    });

    // 重名校验
    const authRepeat = await User.findOne({
      username
    });

    if (authRepeat) {
      throw new Error('该用户已被注册');
    }

    const user = await User.create({
      username,
      password,
      inviterId: inviterId ? inviterId : undefined
    });

    const token = generateToken(user._id);
    setCookie(res, token);

    sendRegisterPromotion({
      userId: inviterId,
      objUId: user._id,
      registerName: username
    });

    jsonRes(res, {
      data: {
        user,
        token
      }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}

export async function sendRegisterPromotion({
  registerName,
  userId,
  objUId
}: {
  registerName: string;
  userId: string;
  objUId: string;
}) {
  try {
    if (!userId || registerName.includes('@')) return;

    const amount = 5 * PRICE_SCALE;

    try {
      await User.findByIdAndUpdate(userId, {
        $inc: { balance: amount }
      });
    } catch (error) {
      return setTimeout(() => {
        sendRegisterPromotion({ registerName, userId, objUId });
      }, 2000);
    }
    await promotionRecord.create({
      userId,
      objUId,
      type: 'register',
      amount: formatPrice(amount)
    });
  } catch (error) {}
}
