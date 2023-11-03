import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { authUser } from '@fastgpt/service/support/user/auth';
import { connectToDatabase } from '@/service/mongo';
import { MongoPay } from '@/service/support/wallet/pay/schema';
import { PRICE_SCALE } from '@fastgpt/global/support/wallet/bill/constants';
import { WXPay } from '@/service/support/pay/pay';

/* 获取支付二维码 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    let { amount = 0 } = req.query as { amount: string };
    amount = +amount;

    const { teamId, tmbId } = await authUser({ req, authToken: true });

    const wxPay = new WXPay();

    const { code_url, orderId } = await wxPay.getPayQRUrl(amount);

    // add one pay record
    const payOrder = await MongoPay.create({
      teamId,
      tmbId,
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
}
