/* switch team to new team */
import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authUser } from '@fastgpt/service/support/user/auth';
import { authTeamRole } from '@/service/support/user/team/controller';
import { createJWT } from '@fastgpt/service/support/permission/controller';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { tmbId = '' } = req.body as { tmbId: string };
    await connectToDatabase();
    const { userId } = await authUser({ req, authToken: true });
    const token = await (async () => {
      if (tmbId) {
        await authTeamRole({ userId, tmbId });
      }
      const token = createJWT(userId, tmbId);
      return token;
    })();

    jsonRes(res, {
      data: { cookie: token }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
