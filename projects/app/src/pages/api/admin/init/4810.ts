import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { NextAPI } from '@/service/middleware/entry';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { readFromSecondary } from '@fastgpt/service/common/mongo/utils';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { addLog } from '@fastgpt/service/common/system/log';
import { MongoBill } from '@/service/support/wallet/bill/schema';
import { BillStatusEnum } from '@fastgpt/global/support/wallet/bill/constants';

/* 
    初始化开票状态
    status === success
    1. payway 不是微信的，都设置成 true（包括不存在的）
*/
let index = 0;
async function handler(req: NextApiRequest, res: NextApiResponse) {
  await authCert({ req, authRoot: true });

  jsonRes(res, {
    message: 'success',
    data: await MongoBill.updateMany(
      {
        hasInvoice: { $ne: true },
        status: BillStatusEnum.SUCCESS,
        'metadata.payWay': { $ne: 'wx' }
      },
      {
        $set: {
          hasInvoice: true
        }
      }
    )
  });
}

export default NextAPI(handler);
