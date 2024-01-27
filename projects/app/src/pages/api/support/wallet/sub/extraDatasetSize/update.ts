import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { SubDatasetSizeParams } from '@fastgpt/global/support/wallet/sub/api';
import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import { SubTypeEnum } from '@fastgpt/global/support/wallet/sub/constants';
import { authUserNotVisitor } from '@fastgpt/service/support/permission/auth/user';
import { calcDatasetSizeSubUpdateData } from './preCheck';
import { updateTeamExtraDatasetSizeSub } from '@/service/support/wallet/sub/utils';
import { createExtraDatasetSizeSubBill } from '@/service/support/wallet/sub/bill';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';

/* Update dataset size sub. */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // size: N 1000 group
  const { size } = req.body as SubDatasetSizeParams;

  try {
    await connectToDatabase();

    if (size < 0) {
      throw new Error('Size must be greater than 0');
    }

    const { teamId, tmbId, team } = await authUserNotVisitor({ req, authToken: true });

    // find the sub
    const sub = await MongoTeamSub.findOne({
      teamId,
      type: SubTypeEnum.extraDatasetSize
    });

    // 计算需要补的差价(肯定是>=0) & 获取团队余额
    const {
      payForNewSub,
      balanceEnough,
      newSubSize,
      payPrice,
      newPlanPrice,
      newSubStartTime,
      newSubExpiredTime
    } = await calcDatasetSizeSubUpdateData({ size, team });

    if (!payForNewSub) {
      if (sub) {
        sub.nextExtraDatasetSize = newSubSize;
        await sub.save();
      }

      return jsonRes(res, {
        data: {
          price: 0
        }
      });
    }

    if (!balanceEnough) {
      throw new Error('余额不足');
    }

    await mongoSessionRun(async (session) => {
      //  创建订单 & 扣费
      await createExtraDatasetSizeSubBill({
        teamId,
        tmbId,
        payPrice,
        size: newSubSize,
        session
      });

      // 更新订阅
      await updateTeamExtraDatasetSizeSub({
        sub,
        teamId,
        startTime: newSubStartTime,
        expiredTime: newSubExpiredTime,
        price: newPlanPrice,
        currentExtraDatasetSize: newSubSize,
        nextExtraDatasetSize: newSubSize,
        session
      });
    });

    jsonRes(res);
  } catch (err) {
    console.log(err);

    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
