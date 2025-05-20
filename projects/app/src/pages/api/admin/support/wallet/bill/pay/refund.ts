import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoBill } from '@/service/support/wallet/bill/schema';
import { BillStatusEnum } from '@fastgpt/global/support/wallet/bill/constants';
import { PRICE_SCALE } from '@fastgpt/global/support/wallet/constants';
import { createPaymentController } from '@/service/support/wallet/bill/pay/base';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { useIPFrequencyLimit } from '@fastgpt/service/common/middle/reqFrequencyLimit';

export type refundQuery = {};

export type refundBody = {
  amount: number;
  orderId: string;
};

export type refundResponse = {};

async function handler(
  req: ApiRequestProps<refundBody, refundQuery>,
  res: ApiResponseType<any>
): Promise<refundResponse> {
  await authCert({ req, authRoot: true });

  const { amount, orderId } = req.body;

  const bill = await MongoBill.findOne({ orderId });

  if (!bill) {
    return Promise.reject('订单不存在');
  }

  if (bill.status !== BillStatusEnum.SUCCESS) {
    return Promise.reject('订单未支付');
  }

  if (bill.hasInvoice) {
    return Promise.reject('订单已开票，无法直接退款');
  }

  const billReadPrice = bill.price / PRICE_SCALE;

  if (billReadPrice < amount) {
    return Promise.reject('订单金额不足');
  }

  const payController = await createPaymentController(bill.metadata.payWay);

  return mongoSessionRun(async (session) => {
    const refundId = `refundId-${bill.orderId}`;

    bill.status = BillStatusEnum.REFUND;
    bill.refundData = {
      amount,
      refundId,
      refundTime: new Date()
    };
    await bill.save({ session });

    return await payController.refund({
      orderId: bill.orderId,
      amount,
      refundId
    });
  });
}

export default NextAPI(useIPFrequencyLimit({ id: 'refund-bill', seconds: 1, limit: 1 }), handler);
