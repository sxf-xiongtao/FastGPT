import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/service/response';
import { User, Pay, promotionRecord } from '@/service/mongo';
import { authUser } from '@/service/utils/auth';
import { PaySchema } from '@/types/mongoSchema';
import dayjs from 'dayjs';
import { WXPay } from '@/service/utils/pay';
import { formatPrice } from '@/utils/user';
import { connectToDatabase } from '@/service/mongo';

/* 校验支付结果 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();

    const { payId } = req.query as { payId: string };

    const { userId } = await authUser({ req, authToken: true });

    // 查找订单记录校验
    const payOrder = await Pay.findById<PaySchema>(payId);

    if (!payOrder) {
      throw new Error('订单不存在');
    }
    if (payOrder.status !== 'NOTPAY') {
      throw new Error('订单已结算');
    }

    const user = await User.findById(userId);

    const inviterId = user?.inviterId;

    const inviter = inviterId ? await User.findById(inviterId) : null;

    const wxPay = new WXPay();

    const payRes = await wxPay.getPayResult(payOrder.orderId);

    if (payRes.trade_state === 'SUCCESS') {
      // 订单已支付
      try {
        // 更新订单状态. 如果没有合适的订单，说明订单重复了
        const updateRes = await Pay.updateOne(
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
          await User.findByIdAndUpdate(userId, {
            $inc: { balance: payOrder.price }
          });

          // 增加邀请者的收益
          if (inviter) {
            try {
              const amount = (payOrder.price * inviter.promotionRate) / 100;
              await Promise.all([
                User.findByIdAndUpdate(inviterId, {
                  $inc: { balance: amount }
                }),
                promotionRecord.create({
                  userId: inviterId,
                  objUId: userId,
                  type: 'pay',
                  amount: formatPrice(amount)
                })
              ]);
            } catch (error) {}
          }

          return jsonRes(res, {
            data: '支付成功'
          });
        }
      } catch (error) {
        console.log(error);
        // roll back status
        try {
          await Pay.findByIdAndUpdate(payId, {
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
      await Pay.findByIdAndUpdate(payId, {
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
