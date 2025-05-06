import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { ReadPermissionVal } from '@fastgpt/global/support/permission/constant';
import { MongoBill } from '@/service/support/wallet/bill/schema';
import { BillPayWayEnum, BillTypeEnum } from '@fastgpt/global/support/wallet/bill/constants';

export type unInvoiceListQuery = {};

export type unInvoiceListBody = {};

export type unInvoiceListResponse = {
  price: number;
  type: BillTypeEnum;
  createTime: Date;
  orderId: string;
}[];

async function handler(
  req: ApiRequestProps<unInvoiceListBody, unInvoiceListQuery>,
  res: ApiResponseType<any>
): Promise<unInvoiceListResponse> {
  const { teamId } = await authUserPer({ req, authToken: true, per: ReadPermissionVal });

  const unInvoiceList = await MongoBill.find(
    {
      teamId,
      status: 'SUCCESS',
      hasInvoice: { $ne: true },
      'metadata.payWay': { $in: [BillPayWayEnum.alipay, BillPayWayEnum.wx, BillPayWayEnum.bank] }
    },
    { price: 1, type: 1, createTime: 1, orderId: 1 }
  );
  return unInvoiceList;
}

export default NextAPI(handler);
