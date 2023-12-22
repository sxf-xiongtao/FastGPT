import { connectToDatabase } from '@/service/mongo';
import { adminCert } from '@/service/support/permission/adminCert';
import { jsonRes } from '@fastgpt/service/common/response';
import { NextApiRequest, NextApiResponse } from 'next';
import { MongoPay } from '@/service/support/wallet/pay/schema';
import { PRICE_SCALE } from '../users/getUsers';
import dayjs from 'dayjs';
import { MongoUser } from '@fastgpt/service/support/user/schema';

export default async function getPays(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await adminCert({ req, authToken: true });

    const start = parseInt(req.query._start as string) || 0;
    const end = parseInt(req.query._end as string) || 20;
    const order = req.query._order === 'ASC' ? 1 : -1;
    const sort = req.query._sort === 'id' ? '_id' : req.query._sort || '_id';
    const userId = req.query.userId || '';
    const where = userId ? { userId: Object(userId) } : {};

    const paysRaw = await MongoPay.find(where)
      .skip(start)
      .limit(end - start)
      .sort({ [sort as string]: order })
      .populate('tmbId')
      .lean();

    const pays = await Promise.all(
      paysRaw
        .filter((item) => item.tmbId)
        .map(async (item: any) => {
          const user = await MongoUser.findById(item.tmbId.userId, 'username');

          return {
            id: item._id.toString(),
            username: user?.username,
            price: item.price / PRICE_SCALE,
            orderId: item.orderId,
            status: item.status,
            createTime: item.createTime
          };
        })
    );

    const totalCount = await MongoPay.countDocuments(where);

    jsonRes(res, {
      data: {
        pays,
        total: totalCount
      }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
