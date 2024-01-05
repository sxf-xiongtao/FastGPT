import { connectToDatabase } from '@/service/mongo';
import { adminCert } from '@/service/support/permission/adminCert';
import { hashStr } from '@fastgpt/global/common/string/tools';
import { PRICE_SCALE } from '@fastgpt/global/support/wallet/bill/constants';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function addUser(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await adminCert({ req, authToken: true });

    const { username, password } = req.body;
    if (!username || !password) {
      throw new Error('缺少字段');
    }

    const existingUser = await MongoUser.findOne({ username });

    if (existingUser) {
      // check tmb
      const tmb = await MongoTeamMember.findOne({ userId: existingUser._id });

      if (tmb) {
        throw new Error('用户已存在');
      }
    }

    const userId = await (async () => {
      if (existingUser) {
        return existingUser._id;
      }
      const { _id } = await MongoUser.create({
        username,
        password: hashStr(password),
        createTime: new Date()
      });
      return _id;
    })();

    const ownerTeam = await MongoTeam.findOne({ ownerId: userId });

    const teamId = await (async () => {
      if (ownerTeam) {
        return ownerTeam._id;
      }

      const { _id } = await MongoTeam.create({
        ownerId: userId,
        name: 'My Team',
        maxSize: global.systemConfig.system?.teamDefaultMaxMember || 5,
        balance: (global.systemConfig.system?.userDefaultBalance || 2) * PRICE_SCALE
      });
      return _id;
    })();

    await MongoTeamMember.create({
      teamId,
      userId,
      role: 'owner',
      status: 'active',
      defaultTeam: true
    });

    jsonRes(res, {
      data: {
        userId,
        teamId,
        err: null
      }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
