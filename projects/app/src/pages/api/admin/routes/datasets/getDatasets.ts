import { connectToDatabase } from '@/service/mongo';
import { adminCert } from '@/service/support/permission/adminCert';
import { jsonRes } from '@fastgpt/service/common/response';
import { NextApiRequest, NextApiResponse } from 'next';
import { MongoDataset } from '@fastgpt/service/core/dataset/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { readFromSecondary } from '@fastgpt/service/common/mongo/utils';
import { NextAPI } from '@/service/middleware/entry';
import { PagingData } from '@/types';
import { MongoDatasetData } from '@fastgpt/service/core/dataset/data/schema';
import { getVectorCountByDatasetId } from '@fastgpt/service/common/vectorStore/controller';

export type GetDatasetsResponseData = PagingData<{
  id: string;
  teamId: string;
  name: string;
  intro: string;
  username: string;
  totalDatas: number;
  totalVectors: number;
}>;

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await adminCert({ req, authToken: true });

  const { pageNum = 1, pageSize = 20 } = req.body as {
    pageNum: number;
    pageSize: number;
  };

  const match = {};

  const [records, total] = await Promise.all([
    MongoDataset.find(match, 'name intro teamId tmbId', { ...readFromSecondary })
      .sort({ createTime: -1 })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize),
    MongoDataset.countDocuments(match, { ...readFromSecondary })
  ]);

  const tmbIdList = Array.from(new Set(records.map((kb) => String(kb.tmbId))));
  const tmbList = await MongoTeamMember.find(
    {
      _id: {
        $in: tmbIdList
      }
    },
    'userId',
    { ...readFromSecondary }
  );

  const userIdList = Array.from(new Set(tmbList.map((tmb) => String(tmb.userId))));
  const userList = await MongoUser.find(
    {
      _id: {
        $in: userIdList
      }
    },
    'username',
    { ...readFromSecondary }
  );

  let datasets = records.map((kb) => {
    const tmb = tmbList.find((tmb) => String(tmb._id) === String(kb.tmbId))!;
    const user = userList.find((user) => String(user._id) === String(tmb?.userId));

    return {
      id: kb._id,
      teamId: kb.teamId,
      name: kb.name,
      intro: kb.intro,
      username: user?.username || '这人被删除了',
      totalDatas: 0,
      totalVectors: 0
    };
  });

  // 分别计算，不同 datasets 下，dataset.datas 的数量总和
  const totalDatas = await MongoDatasetData.aggregate(
    [
      {
        $match: {
          datasetId: {
            $in: records.map((kb) => kb._id)
          }
        }
      },
      {
        $group: {
          _id: '$datasetId',
          total: {
            $sum: 1
          }
        }
      }
    ],
    {
      ...readFromSecondary
    }
  );
  datasets = datasets.map((item) => {
    const total = totalDatas.find((totalData) => String(totalData._id) === String(item.id));
    return {
      ...item,
      totalDatas: total?.total || 0
    };
  });

  // 计算 vector 的
  datasets = await Promise.all(
    datasets.map(async (item) => {
      const total = await getVectorCountByDatasetId(item.teamId, item.id);
      return {
        ...item,
        totalVectors: total
      };
    })
  );

  jsonRes(res, {
    data: {
      pageNum,
      pageSize,
      data: datasets,
      total
    }
  });
}

export default NextAPI(handler);
