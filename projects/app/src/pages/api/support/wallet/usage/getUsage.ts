// // Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { MongoUsage } from '@fastgpt/service/support/wallet/usage/schema';
import { addDays } from 'date-fns';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { Types } from '@fastgpt/service/common/mongo';
import { UsageSourceEnum } from '@fastgpt/global/support/wallet/usage/constants';
import { ReadPermissionVal } from '@fastgpt/global/support/permission/constant';
import { readFromSecondary } from '@fastgpt/service/common/mongo/utils';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { PaginationProps, PaginationResponse } from '@fastgpt/web/common/fetch/type';
import { parsePaginationRequest } from '@fastgpt/service/common/api/pagination';
import { UsageListItemType } from '@fastgpt/global/support/wallet/usage/type';

export type GetUsageQuery = {};
export type GetUsageBody = PaginationProps<{
  dateStart: Date;
  dateEnd: Date;
  source?: `${UsageSourceEnum}`;
  teamMemberId: string;
}>;
export type GetUsageResponse = PaginationResponse<{
  id: string;
  source: `${UsageSourceEnum}`;
  time: Date;
  totalPoints: number;
  appName: string;
  list: UsageListItemType[];
}>;

async function handler(
  req: ApiRequestProps<GetUsageBody, GetUsageQuery>,
  _res: ApiResponseType<any>
): Promise<GetUsageResponse> {
  const {
    dateStart = addDays(new Date(), -7),
    dateEnd = new Date(),
    source,
    teamMemberId
  } = req.body;

  const { offset, pageSize } = parsePaginationRequest(req);

  const { teamId, tmbId, permission } = await authUserPer({
    req,
    authToken: true,
    per: ReadPermissionVal
  });

  const where = {
    teamId: new Types.ObjectId(teamId),
    ...(permission.hasManagePer && teamMemberId ? { tmbId: teamMemberId } : { tmbId }),
    ...(source && { source }),
    time: {
      $gte: new Date(dateStart),
      $lte: new Date(dateEnd)
    }
  };

  // get bill record and total by record
  const [bills, total] = await Promise.all([
    MongoUsage.find(where, undefined, {
      ...readFromSecondary
    })
      .sort({ time: -1 })
      .skip(offset)
      .limit(pageSize),
    MongoUsage.countDocuments(where, {
      ...readFromSecondary
    })
  ]);

  return {
    list: bills.map((bill) => ({
      id: bill._id,
      source: bill.source,
      time: bill.time,
      totalPoints: bill.totalPoints,
      appName: bill.appName,
      list: bill.list
    })),
    total
  };
}
export default NextAPI(handler);
