import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { addLog } from '@fastgpt/service/common/system/log';
import { addDays } from 'date-fns';
import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import { SubStatusEnum, SubTypeEnum } from '@fastgpt/global/support/wallet/sub/constants';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { createExtraDatasetSizeSubBill } from '@/service/support/wallet/sub/bill';
import { updateTeamExtraDatasetSizeSub } from '@/service/support/wallet/sub/utils';
import { PRICE_SCALE } from '@fastgpt/global/support/wallet/bill/constants';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';

/* 更新额外知识库订阅 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await authCert({ req, authRoot: true });
    await connectToDatabase();
    const DatasetStorePrice = global.systemConfig?.subscription?.datasetStorePrice || 0;

    // 1. Get all expired plan
    const plans = await MongoTeamSub.find({
      type: SubTypeEnum.extraDatasetSize,
      expiredTime: { $lte: new Date() }
    });

    console.log('total sub need to update', plans.length);

    // 2. Update every expired plan
    for await (const plan of plans) {
      try {
        // 取消的订阅,则直接删除
        if (plan.status === SubStatusEnum.canceled) {
          await plan.deleteOne();
          continue;
        }

        const team = await MongoTeam.findById(plan.teamId);
        const ownerTmb = await MongoTeamMember.findOne({
          userId: team?.ownerId
        });
        if (!team || !ownerTmb) {
          console.log('error teamId', plan.teamId);
          continue;
        }

        const extraSize = plan.nextExtraDatasetSize || 0;
        const price = (extraSize / 1000) * DatasetStorePrice * PRICE_SCALE;

        // check balance
        if (team.balance < price) {
          await plan.deleteOne();
          console.log('team balance not enough, delete sub', team.balance, price);
          continue;
        }

        // create bill and update team balance
        await createExtraDatasetSizeSubBill({
          teamId: team._id,
          tmbId: ownerTmb._id,
          payPrice: price,
          size: extraSize
        });
        await updateTeamExtraDatasetSizeSub({
          sub: plan,
          teamId: team._id,
          startTime: new Date(),
          expiredTime: addDays(new Date(), 30),
          price,
          currentExtraDatasetSize: extraSize,
          nextExtraDatasetSize: extraSize
        });

        console.log('update sub success', {
          subId: plan._id,
          size: extraSize,
          payPrice: price
        });
      } catch (error) {
        console.log('update sub failed', plan);
      }
    }

    jsonRes(res, {
      data: plans.length,
      message: 'success'
    });
  } catch (error) {
    addLog.error(`check Invalid user error`, error);

    jsonRes(res, {
      code: 500,
      error
    });
  }
}
