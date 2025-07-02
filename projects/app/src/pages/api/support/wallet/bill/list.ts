import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';

import { MongoBill } from '@/service/support/wallet/bill/schema';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import type { BillTypeEnum } from '@fastgpt/global/support/wallet/bill/constants';
import type { BillSchemaType } from '@fastgpt/global/support/wallet/bill/type';
import { ReadPermissionVal } from '@fastgpt/global/support/permission/constant';
import { readFromSecondary } from '@fastgpt/service/common/mongo/utils';
import type { PaginationResponse } from '@fastgpt/web/common/fetch/type';
import { parsePaginationRequest } from '@fastgpt/service/common/api/pagination';
import { NextAPI } from '@/service/middleware/entry';

type ResponseType = PaginationResponse<BillSchemaType>;

async function handler(req: NextApiRequest, res: NextApiResponse): Promise<ResponseType> {
  const { type } = req.body as {
    type?: BillTypeEnum;
  };
  const { offset, pageSize } = parsePaginationRequest(req);

  const { teamId } = await authUserPer({ req, authToken: true, per: ReadPermissionVal });

  const match = {
    teamId,
    status: { $ne: 'CLOSED' },
    ...(type && { type })
  };

  const [records, total] = await Promise.all([
    MongoBill.find(match, undefined, {
      ...readFromSecondary
    })
      .sort({ createTime: -1 })
      .skip(offset)
      .limit(pageSize),
    MongoBill.countDocuments(match, { ...readFromSecondary })
  ]);

  return {
    list: records,
    total
  };
}

export default NextAPI(handler);
