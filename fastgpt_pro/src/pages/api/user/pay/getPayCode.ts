import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/service/response';
import { authUser } from '@/service/utils/auth';
import { Pay, connectToDatabase } from '@/service/mongo';
import { PRICE_SCALE } from '@/constants/common';
import { WXPay } from '@/service/utils/pay';
import { withNextCors } from '@/service/utils/tools';

/* 获取支付二维码 */
export default withNextCors(async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    let { amount = 0 } = req.query as { amount: string };
    amount = +amount;

    await connectToDatabase();

    const { userId } = await authUser({ req, authToken: true });

    const wxPay = new WXPay();

    const { code_url, orderId } = await wxPay.getPayQRUrl(amount);

    // add one pay record
    const payOrder = await Pay.create({
      userId,
      price: amount * PRICE_SCALE,
      orderId
    });

    jsonRes(res, {
      data: {
        payId: payOrder._id,
        codeUrl: code_url
      }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
});
