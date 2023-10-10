import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/service/response';
import { authUser } from '@/service/utils/auth';
import { User, connectToDatabase } from '@/service/mongo';
import { getErrText } from '@/utils/tools';
import { customAlphabet } from 'nanoid';
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz1234567890', 8);
import { createHashPassword } from '@/utils/tools';
import { sendInform2User } from '@/service/inform';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();

    await authUser({ req, authRoot: true });

    const users = await User.find(
      {
        username: { $regex: '^git' }
      },
      '_id username'
    ).limit(1000);

    // 修改密码和发送通知
    await Promise.all(
      users.map(async (user) => {
        const password = nanoid();
        await User.findByIdAndUpdate(user._id, {
          password: createHashPassword(password)
        });
        // send default password inform
        sendInform2User({
          userId: user._id,
          type: 'system',
          title: 'Git用户初始密码',
          content: `我们为您的初始化了 Git 账号密码: ${password}, 未来你可以用这个密码和用户名进行登录，请保管好你的密码，并及时修改`
        });
      })
    );

    jsonRes(res, {
      data: users
    });
  } catch (error) {
    jsonRes(res, {
      data: getErrText(error, '内容安全校验不通过')
    });
  }
}
