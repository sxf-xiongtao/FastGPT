import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { adminCert } from '@/service/support/permission/adminCert';
import { MongoSystemConfigs } from '@fastgpt/service/common/system/config/schema';
import { SystemConfigsTypeEnum } from '@fastgpt/global/common/system/config/constants';
import { getNanoid } from '@fastgpt/global/common/string/tools';

/* 更新系统消息弹窗 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { content } = req.body as { content: string };
    await adminCert({ req, authToken: true });

    // 创一个一个 type = systemMsgModal 的系统消息
    await MongoSystemConfigs.updateOne(
      {
        type: SystemConfigsTypeEnum.systemMsgModal
      },
      {
        type: SystemConfigsTypeEnum.systemMsgModal,
        value: {
          id: getNanoid(),
          content
        }
      },
      {
        upsert: true
      }
    );

    jsonRes(res, {
      message: '发送通知成功'
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
