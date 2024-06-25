import { connectToDatabase } from '@/service/mongo';
import { adminCert } from '@/service/support/permission/adminCert';
import { jsonRes } from '@fastgpt/service/common/response';
import { NextApiRequest, NextApiResponse } from 'next';
import { MongoDataset } from '@fastgpt/service/core/dataset/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoUser } from '@fastgpt/service/support/user/schema';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await adminCert({ req, authToken: true });

    const { pageNum = 1, pageSize = 20 } = req.body as {
      pageNum: number;
      pageSize: number;
    };

    const match = {};

    // const kbsRaw = await MongoDataset.find(where)
    //   .skip(start)
    //   .limit(end - start)
    //   .sort({ [sort as string]: order });

    const datasets = [];

    const [records, total] = await Promise.all([
      MongoDataset.find(match)
        .sort({ createTime: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize),
      MongoDataset.countDocuments(match)
    ]);

    for (const kbRaw of records) {
      const kb: any = kbRaw.toObject();

      const tmb = await MongoTeamMember.findOne({
        _id: kb.tmbId
      });

      const user = await MongoUser.findOne({
        _id: tmb?.userId
      });

      const orderedKb = {
        id: kb._id.toString(),
        username: user?.username,
        name: kb.name,
        intro: kb.intro
      };

      datasets.push(orderedKb);
    }

    jsonRes(res, {
      data: {
        pageNum,
        pageSize,
        data: datasets,
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
