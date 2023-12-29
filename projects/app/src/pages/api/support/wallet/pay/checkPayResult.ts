import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoPay } from '@/service/support/wallet/pay/schema';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import type { PaySchema } from '@fastgpt/global/support/wallet/pay/type.d';
import dayjs from 'dayjs';
import { WXPay } from '@/service/support/wallet/pay/pay';
import { connectToDatabase } from '@/service/mongo';
import { createOnePromotion } from '@/service/support/activity/promotion/controller';
import { updateTeamBalance } from '@/service/support/wallet/controller';
import { MongoDatasetTraining } from '@fastgpt/service/core/dataset/training/schema';
import { delay } from '@fastgpt/global/common/system/utils';
import { addLog } from '@fastgpt/service/common/system/log';

/* 校验支付结果 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();

    const { payId } = req.query as { payId: string };

    const { userId } = await authCert({ req, authToken: true });

    // 查找订单记录校验
    const payOrder = await MongoPay.findById<PaySchema>(payId);

    if (!payOrder) {
      throw new Error('订单不存在');
    }
    if (payOrder.status !== 'NOTPAY') {
      throw new Error('订单已结算');
    }

    const user = await MongoUser.findById(userId);
    const inviter = user?.inviterId ? await MongoUser.findById(user.inviterId) : null;

    const wxPay = new WXPay();
    const payRes = await wxPay.getPayResult(payOrder.orderId);

    if (payRes.trade_state === 'SUCCESS') {
      // 订单已支付
      try {
        // 更新订单状态. 如果没有合适的订单，说明订单重复了
        const updateRes = await MongoPay.updateOne(
          {
            _id: payId,
            status: 'NOTPAY'
          },
          {
            status: 'SUCCESS'
          }
        );
        if (updateRes.modifiedCount === 1) {
          // Add balance to team
          await updateTeamBalance({ teamId: payOrder.teamId, amount: payOrder.price });

          // 增加邀请者的默认的团队收益
          if (inviter) {
            const amount = (payOrder.price * inviter.promotionRate) / 100;
            createOnePromotion({
              userId: inviter._id,
              objUId: userId,
              type: 'pay',
              amount
            });
          }

          unLockTrainingData(payOrder.teamId);

          return jsonRes(res, {
            data: '支付成功'
          });
        }
      } catch (error) {
        console.log(error);
        // roll back status
        try {
          await MongoPay.findByIdAndUpdate(payId, {
            status: 'NOTPAY'
          });
        } catch (error) {}
      }
      return jsonRes(res, {
        code: 500,
        data: '更新订单失败,请重试'
      });
    }

    // 校验下是否超过一天
    const orderTime = dayjs(payOrder.createTime);
    const diffInHours = dayjs().diff(orderTime, 'hours');

    if (payRes.trade_state === 'CLOSED' || diffInHours > 24) {
      // 订单已关闭
      await MongoPay.findByIdAndUpdate(payId, {
        status: 'CLOSED'
      });
      throw new Error('订单已过期');
    }
    throw new Error(payRes?.trade_state_desc || '订单无效');
  } catch (err) {
    // console.log(err);
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}

async function unLockTrainingData(teamId: string, retry = 3): Promise<any> {
  try {
    await MongoDatasetTraining.updateMany(
      {
        teamId
      },
      {
        lockTime: new Date('2000/1/1')
      }
    );
  } catch (error) {
    addLog.error('unLockTrainingData error', error);
    if (retry >= 0) {
      await delay(100);
      return unLockTrainingData(teamId, retry - 1);
    }
  }
}
