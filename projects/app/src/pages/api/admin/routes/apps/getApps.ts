import { connectToDatabase } from '@/service/mongo';
import { adminCert } from '@/service/support/permission/adminCert';
import { jsonRes } from '@fastgpt/service/common/response';
import { NextApiRequest, NextApiResponse } from 'next';
import { MongoApp } from '@fastgpt/service/core/app/schema';

export default async function getApps(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await adminCert({ req, authToken: true });

    const {
      pageNum = 1,
      pageSize = 20,
      username
    } = req.body as {
      pageNum: number;
      pageSize: number;
      username: string;
    };

    const match = {
      username: new RegExp(username, 'i')
    };

    // const modelsRaw = await MongoApp.find(where)
    //   .skip(start)
    //   .limit(end - start)
    //   .sort({ 'share.collection': -1 });

    // const models = [];

    // for (const modelRaw of modelsRaw) {
    //   const app: any = modelRaw.toObject();

    //   const orderedModel = {
    //     id: app._id.toString(),
    //     userId: app.userId,
    //     name: app.name,
    //     intro: app.intro,
    //     systemPrompt: app.chat?.systemPrompt || '',
    //     temperature: app.chat?.temperature || 0,
    //     'share.topNum': app.share?.topNum || 0,
    //     'share.isShare': app.share?.isShare || false,
    //     'share.collection': app.share?.collection || 0
    //   };

    //   models.push(orderedModel);
    // }
    // const totalCount = await MongoApp.countDocuments(where);

    const [records, total] = await Promise.all([
      MongoApp.find(match)
        .sort({ createTime: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize),
      MongoApp.countDocuments(match)
    ]);

    const newRecords = await Promise.all(
      records.map(async (record) => {
        const app: any = record.toObject();
        return {
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
      })
    );

    jsonRes(res, {
      data: {
        pageNum,
        pageSize,
        data: newRecords,
        total
      }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
