import { connectToDatabase } from '@/service/mongo';
import { adminCert } from '@/service/support/permission/adminCert';
import { createHashPassword } from '@/utils/tools';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { NextApiRequest, NextApiResponse } from 'next';
import { PRICE_SCALE } from './getUsers';

export default async function addUser(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await adminCert({ req, authToken: true });

    const { username, password, balance = 0, teamName, maxSize } = req.body;
    if (!username || !password) {
      console.log('缺少字段', req.body);
      return res.status(400).json({ message: '缺少字段' });
    }

    const existingUser = await MongoUser.findOne({ username });

    if (existingUser) {
      // check tmb
      const tmb = await MongoTeamMember.findOne({ userId: existingUser._id });

      if (tmb) {
        return res.status(400).json({ message: '用户已注册' });
      }
    }

    const userId = await (async () => {
      if (existingUser) {
        return existingUser._id;
      }
      const { _id } = await MongoUser.create({
        username,
        password: createHashPassword(createHashPassword(password)),
        createTime: new Date()
      });
      return _id;
    })();

    const ownerTeam = await MongoTeam.findOne({ ownerId: userId });

    console.log('create team, userId: ', { userId, ownerTeam });

    const teamId = await (async () => {
      if (ownerTeam) {
        return ownerTeam._id;
      }

      const { _id } = await MongoTeam.create({
        ownerId: userId,
        name: teamName || 'My Team',
        maxSize,
        balance: balance * PRICE_SCALE
      });
      return _id;
    })();

    console.log('create team member, userId: ', { teamId, userId });

    await MongoTeamMember.create({
      teamId,
      userId,
      role: 'owner',
      status: 'active',
      defaultTeam: true
    });

    res.json({ message: '创建成功' });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
