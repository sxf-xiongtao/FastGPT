import { connectToDatabase } from '@/service/mongo';
import { adminCert } from '@/service/support/permission/adminCert';
import { jsonRes } from '@fastgpt/service/common/response';
import { NextApiRequest, NextApiResponse } from 'next';
import { MongoApp } from '@fastgpt/service/core/app/schema';

export default async function getApps(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await adminCert({ req, authToken: true });

    const start = parseInt(req.query._start as string) || 0;
    const end = parseInt(req.query._end as string) || 20;
    const name = req.query.name || '';
    const id = req.query.id || '';

    const where = {
      ...(name && { name: { $regex: name, $options: 'i' } }),
      ...(id && { _id: id })
    };

    const modelsRaw = await MongoApp.find(where)
      .skip(start)
      .limit(end - start)
      .sort({ 'share.collection': -1 });

    const models = [];

    for (const modelRaw of modelsRaw) {
      const app: any = modelRaw.toObject();

      const orderedModel = {
        id: app._id.toString(),
        userId: app.userId,
        name: app.name,
        intro: app.intro,
        systemPrompt: app.chat?.systemPrompt || '',
        temperature: app.chat?.temperature || 0,
        'share.topNum': app.share?.topNum || 0,
        'share.isShare': app.share?.isShare || false,
        'share.collection': app.share?.collection || 0
      };

      models.push(orderedModel);
    }
    const totalCount = await MongoApp.countDocuments(where);
    jsonRes(res, {
      data: {
        models,
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
