import { connectToDatabase } from '@/service/mongo';
import { adminCert } from '@/service/support/permission/adminCert';
import { jsonRes } from '@fastgpt/service/common/response';
import { NextApiRequest, NextApiResponse } from 'next';
import { MongoDataset } from '@fastgpt/service/core/dataset/schema';

export default async function getApps(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await adminCert({ req, authToken: true });

    const start = parseInt(req.query._start as string) || 0;
    const end = parseInt(req.query._end as string) || 20;
    const order = req.query._order === 'DESC' ? -1 : 1;
    const sort = req.query._sort === 'id' ? '_id' : req.query._sort || '_id';
    const tag = req.query.tag || '';
    const name = req.query.name || '';

    const where = {
      ...(name
        ? {
            name: { $regex: name, $options: 'i' }
          }
        : {}),
      ...(tag
        ? {
            tags: { $elemMatch: { $regex: tag, $options: 'i' } }
          }
        : {})
    };

    const kbsRaw = await MongoDataset.find(where)
      .skip(start)
      .limit(end - start)
      .sort({ [sort as string]: order });

    const datasets = [];

    for (const kbRaw of kbsRaw) {
      const kb: any = kbRaw.toObject();

      const orderedKb = {
        id: kb._id.toString(),
        userId: kb.userId,
        name: kb.name,
        tags: kb.tags,
        avatar: kb.avatar
      };

      datasets.push(orderedKb);
    }
    const totalCount = await MongoDataset.countDocuments(where);
    jsonRes(res, {
      data: {
        datasets,
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
