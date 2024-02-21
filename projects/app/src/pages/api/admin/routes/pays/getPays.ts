import { connectToDatabase } from '@/service/mongo';
import { adminCert } from '@/service/support/permission/adminCert';
import { jsonRes } from '@fastgpt/service/common/response';
import { NextApiRequest, NextApiResponse } from 'next';
import { MongoBill } from '@/service/support/wallet/bill/schema';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { PRICE_SCALE } from '@fastgpt/global/support/wallet/constants';
import { isValidObjectIdString } from '../users/getUsers';

export default async function getPays(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await adminCert({ req, authToken: true });

    const start = parseInt(req.query._start as string) || 0;
    const end = parseInt(req.query._end as string) || 20;
    const order = req.query._order === 'ASC' ? 1 : -1;
    const sort = req.query._sort === 'id' ? '_id' : req.query._sort || '_id';
    const search = (req.query.search as string) || '';

    const users = await MongoUser.find({ username: new RegExp(search, 'i') });
    const userIds = users.map((user) => user._id);

    let where = {};
    if (search && isValidObjectIdString(search)) {
      where = {
        $or: [{ userId: Object(search) }, { userId: { $in: userIds } }]
      };
    } else if (search) {
      where = { userId: { $in: userIds } };
    }

    const paysRaw = await MongoBill.find(where)
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

    const totalCount = await MongoBill.countDocuments(where);

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
