import { connectToDatabase } from '@/service/mongo';
import { MongoPay } from '@/service/support/wallet/pay/schema';
import { UserModelSchema } from '@fastgpt/global/support/user/type';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { NextApiRequest, NextApiResponse } from 'next';
import { getTeamInfoByTmbId } from '@fastgpt/service/support/user/team/controller';
import { delay } from '@/utils/tools';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
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
  /* init user default Team */
  const users = await MongoUser.find({}, '_id');
  console.log('user total', users.length);
  // limit 组一次
  const userArr: UserModelSchema[][] = [];
  for (let i = 0; i < users.length; i += limit) {
    userArr.push(users.slice(i, i + limit));
  }

  for await (const item of mongoSchema) {
    console.log('start init', item.label);
    await initTeamTmbId(item.schema);
    console.log('finish init', item.label);
  }

  async function initTeamTmbId(schema: any) {
    let success = 0;
    for await (const users of userArr) {
      await Promise.all(users.map(init));
      success += limit;
      console.log(success);
    }

    async function init(user: UserModelSchema): Promise<any> {
      const userId = user._id;
      try {
        const tmb = await getTeamInfoByTmbId({ userId });

        await schema.updateMany(
          {
            userId
          },
          {
            teamId: tmb.teamId,
            tmbId: tmb.tmbId
          }
        );
      } catch (error) {
        if (error === 'default team not exist') {
          return;
        }
        console.log(error);
        await delay(1000);
        return init(user);
      }
    }
  }
}
