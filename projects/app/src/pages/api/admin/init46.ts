import { connectToDatabase } from '@/service/mongo';
import { MongoPay } from '@/service/support/wallet/pay/schema';
import { jsonRes } from '@fastgpt/service/common/response';
import { NextApiRequest, NextApiResponse } from 'next';
import { getUserDefaultTeam } from '@fastgpt/service/support/user/team/controller';
import { delay } from '@/utils/tools';
import { authCert } from '@fastgpt/service/support/permission/auth/common';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await authCert({ req, authRoot: true });
    const { limit = 50 } = req.body as { limit: number };
    await connectToDatabase();

    await initMongoTeamId(limit);

    jsonRes(res, {
      data: {}
    });
  } catch (error) {
    console.log(error);
    jsonRes(res, {
      code: 500,
      error
    });
  }
}

async function initMongoTeamId(limit: number) {
  const mongoSchema = [
    {
      label: 'MongoPay',
      schema: MongoPay
    }
  ];
  for await (const item of mongoSchema) {
    console.log('start init', item.label);
    await initTeamTmbId(item.schema);
    console.log('finish init', item.label);
  }

  async function initTeamTmbId(schema: any) {
    const emptyWhere = {
      $or: [{ teamId: { $exists: false } }, { teamId: null }]
    };
    const uniqueUsersWithNoTeamId = await schema.aggregate([
      {
        $match: emptyWhere
      },
      {
        $group: {
          _id: '$userId', // 按 userId 分组以去重
          userId: { $first: '$userId' } // 保留第一个出现的 userId
        }
      },
      {
        $project: {
          _id: 0, // 不显示 _id 字段
          userId: 1 // 只显示 userId 字段
        }
      }
    ]);
    const users = uniqueUsersWithNoTeamId;

    console.log('un init total', users.length);
    // limit 组一次
    const userArr: any[][] = [];
    for (let i = 0; i < users.length; i += limit) {
      userArr.push(users.slice(i, i + limit));
    }

    let success = 0;
    for await (const users of userArr) {
      await Promise.all(users.map((item) => init(item.userId)));
      success += limit;
      console.log(success);
    }

    async function init(userId: string): Promise<any> {
      try {
        const tmb = await getUserDefaultTeam({ userId });

        await schema.updateMany(
          {
            userId,
            ...emptyWhere
          },
          {
            teamId: tmb.teamId,
            tmbId: tmb.tmbId
          }
        );
      } catch (error) {
        if (error === 'team not exist' || error === 'tmbId or userId is required') {
          return;
        }
        console.log(error);
        await delay(1000);
        return init(userId);
      }
    }
  }
}
