import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/service/response';
import { MongoPay } from '@fastgpt/service/support/wallet/pay/schema';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { authUser } from '@fastgpt/service/support/user/auth';
import type { PaySchema } from '@fastgpt/global/support/wallet/type.d';
import dayjs from 'dayjs';
import { WXPay } from '@/service/support/pay/pay';
import { connectToDatabase } from '@/service/mongo';
import { createOnePromotion } from '@/service/support/user/promotion';

/* 校验支付结果 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();

    const { payId } = req.query as { payId: string };

    const { userId } = await authUser({ req, authToken: true });

    // 查找订单记录校验
    const payOrder = await MongoPay.findById<PaySchema>(payId);

    if (!payOrder) {
      throw new Error('订单不存在');
    }
    if (payOrder.status !== 'NOTPAY') {
      throw new Error('订单已结算');
    }

    const user = await MongoUser.findById(userId);

    const inviterId = user?.inviterId;

    const inviter = inviterId ? await MongoUser.findById(inviterId) : null;

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
          // 给用户账号充钱
          await MongoUser.findByIdAndUpdate(userId, {
            $inc: { balance: payOrder.price }
          });

          // 增加邀请者的收益
          if (inviter && inviterId) {
            const amount = (payOrder.price * inviter.promotionRate) / 100;
            createOnePromotion({
              userId: inviterId,
              objUId: userId,
              type: 'pay',
              amount
            });
          }

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
