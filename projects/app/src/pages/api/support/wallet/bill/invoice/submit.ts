import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authMember } from '@/service/support/permission/team/auth';
import { ManagePermissionVal } from '@fastgpt/global/support/permission/constant';
import { MongoInvoice } from '@/service/support/wallet/bill/invoiceSchema';
import { MongoBill } from '@/service/support/wallet/bill/schema';
import { InvoiceType } from '@fastgpt/global/support/wallet/bill/type';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { ClientSession } from '@fastgpt/service/common/mongo';
import { InvoiceStatusEnum } from '@fastgpt/global/support/wallet/bill/invoice/constants';
import axios from 'axios';
import { formatStorePrice2Read } from '@fastgpt/global/support/wallet/usage/tools';

export type submitQuery = {};
export type submitBody = InvoiceType;

export type submitResponse = {};

const webhookUrl = process.env.INVOICE_FEISHU_WEBHOOK_URL;
const webhookCallBackUrl = process.env.INVOICE_FEISHU_WEBHOOK_CALLBACK_URL;

async function getBillIdListTotalAmount(billIdList: string[], teamId: string) {
  const match = {
    teamId,
    status: 'SUCCESS',
    hasInvoice: { $ne: true }
  };
  const bills = await MongoBill.find({ _id: { $in: billIdList }, ...match });
  return bills.reduce((acc, bill) => acc + bill.price, 0);
}

async function handler(
  req: ApiRequestProps<submitBody, submitQuery>,
  res: ApiResponseType<any>
): Promise<submitResponse> {
  const {
    amount,
    billIdList,
    bankAccount,
    bankName,
    companyAddress,
    companyPhone,
    emailAddress,
    unifiedCreditCode,
    needSpecialInvoice,
    teamName,
    contactPhone
  } = req.body;
  const { teamId } = await authMember({ req, authToken: true, per: ManagePermissionVal });
  const totalAmount = await getBillIdListTotalAmount(billIdList, teamId);

  if (totalAmount < 0 || totalAmount !== amount) return Promise.reject('invalid billIdList');

  await mongoSessionRun(async (session) => {
    await MongoBill.updateMany(
      { _id: { $in: billIdList }, teamId },
      { $set: { hasInvoice: true } },
      { session }
    );
    await MongoInvoice.create(
      [
        {
          teamId,
          status: InvoiceStatusEnum.submitted,
          amount,
          bankName,
          bankAccount,
          companyAddress,
          companyPhone,
          emailAddress,
          unifiedCreditCode,
          needSpecialInvoice,
          teamName,
          billIdList,
          contactPhone
        }
      ],
      {
        session,
        ordered: true
      }
    );

    // Send feishu webhook
    await sendFeishuWebhook({
      name: teamName,
      amount: formatStorePrice2Read(totalAmount),
      session
    });
  });

  return {};
}
export default NextAPI(handler);

async function sendFeishuWebhook({
  amount,
  name,
  session
}: {
  name: string;
  amount: number;
  session: ClientSession;
}) {
  if (!webhookUrl || !webhookCallBackUrl) return;

  // 获取未开票的数量
  const total = await MongoInvoice.countDocuments({
    status: InvoiceStatusEnum.submitted
  }).session(session);

  // 发送飞书消息
  const result = await axios.post(webhookUrl, {
    msg_type: 'interactive',
    card: {
      config: {
        update_multi: true
      },
      i18n_elements: {
        zh_cn: [
          {
            tag: 'markdown',
            content: `组织名：${name}\n金额: ${amount}元\n待开票数量：${total}`,
            text_align: 'left',
            text_size: 'normal'
          },
          {
            tag: 'action',
            actions: [
              {
                tag: 'button',
                text: {
                  tag: 'plain_text',
                  content: '前去查看'
                },
                type: 'primary_filled',
                complex_interaction: true,
                width: 'default',
                size: 'medium',
                url: `${webhookCallBackUrl}`
              }
            ]
          }
        ]
      },
      i18n_header: {
        zh_cn: {
          title: {
            tag: 'plain_text',
            content: '有新的开票申请'
          },
          subtitle: {
            tag: 'plain_text',
            content: ''
          },
          template: 'blue'
        }
      }
    }
  });
  console.log(result);
}
