import { adminCert } from '@/service/support/permission/adminCert';
import { MongoBill } from '@/service/support/wallet/bill/schema';
import type { NextApiResponse } from 'next';
import { NextAPI } from '@/service/middleware/entry';
import type { GetDataChartsQuery } from './type';
import type { ApiRequestProps } from '@fastgpt/service/type/next';
import { getMongoTimezoneCode } from '@fastgpt/global/common/time/timezone';
import { BillPayWayEnum, BillStatusEnum } from '@fastgpt/global/support/wallet/bill/constants';
import { PRICE_SCALE } from '@fastgpt/global/support/wallet/constants';

export type GetPaysFormDataResponse = {
  orderAmounts: {
    date: string;
    totalCount: number;
    successCount: number;
  }[];
  payAmounts: {
    date: string;
    totalCount: number;
  }[];
  payTeams: {
    date: string;
    totalCount: number;
  }[];
};

async function handler(
  req: ApiRequestProps<{}, GetDataChartsQuery>,
  res: NextApiResponse
): Promise<GetPaysFormDataResponse> {
  await adminCert({ req, authToken: true });
  const startTime = req.query.startTime;

  // 全部订单数
  const orderAmounts = (await MongoBill.aggregate([
    {
      $match: {
        status: { $in: [BillStatusEnum.SUCCESS, BillStatusEnum.NOTPAY] },
        'metadata.payWay': { $in: [BillPayWayEnum.wx, BillPayWayEnum.alipay, BillPayWayEnum.bank] },
        createTime: {
          $gte: new Date(startTime)
        }
      }
    },
    {
      $addFields: {
        localTime: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createTime',
            timezone: getMongoTimezoneCode(startTime)
          }
        }
      }
    },
    {
      $group: {
        _id: '$localTime',
        payAmount: {
          $sum: {
            $cond: {
              if: { $eq: ['$status', BillStatusEnum.SUCCESS] },
              then: '$price',
              else: 0
            }
          }
        },
        totalCount: { $sum: 1 },
        successCount: {
          $sum: { $cond: { if: { $eq: ['$status', BillStatusEnum.SUCCESS] }, then: 1, else: 0 } }
        },
        teamIds: { $addToSet: '$teamId' } // Collect unique team IDs for all orders
      }
    },
    {
      $project: {
        _id: 0,
        date: { $dateFromString: { dateString: '$_id' } },
        payAmount: 1,
        totalCount: 1,
        successCount: 1,
        teamCount: { $size: '$teamIds' } // Count unique teams that placed orders
      }
    },
    { $sort: { date: 1 } }
  ])) as {
    date: string;
    payAmount: number;
    totalCount: number;
    successCount: number;
    teamCount: 1;
  }[];

  return {
    orderAmounts: orderAmounts.map((item) => ({
      date: item.date,
      totalCount: item.totalCount,
      successCount: item.successCount
    })),
    payAmounts: orderAmounts.map((item) => ({
      date: item.date,
      totalCount: item.payAmount / PRICE_SCALE
    })),
    payTeams: orderAmounts.map((item) => ({
      date: item.date,
      totalCount: item.teamCount
    }))
  };
}

export default NextAPI(handler);
