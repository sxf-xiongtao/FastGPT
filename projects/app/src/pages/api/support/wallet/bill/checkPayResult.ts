import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoBill } from '@/service/support/wallet/bill/schema';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import type { BillSchemaType } from '@fastgpt/global/support/wallet/bill/type.d';
import dayjs from 'dayjs';
import { WXPay } from '@/service/support/wallet/bill/pay';
import { createOnePromotion } from '@/service/support/activity/promotion/controller';
import { MongoDatasetTraining } from '@fastgpt/service/core/dataset/training/schema';
import { delay } from '@fastgpt/global/common/system/utils';
import { addLog } from '@fastgpt/service/common/system/log';
import { BillTypeEnum } from '@fastgpt/global/support/wallet/bill/constants';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import { SubTypeEnum, subModeMap } from '@fastgpt/global/support/wallet/sub/constants';
import { addMonths } from 'date-fns';
import { ClientSession } from '@fastgpt/service/common/mongo';
import { NextAPI } from '@/service/middleware/entry';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { getStandardPlanConfig, sortStandPlans } from '@fastgpt/service/support/wallet/sub/utils';
import { UserModelSchema } from '@fastgpt/global/support/user/type';
import { useIPFrequencyLimit } from '@fastgpt/service/common/middle/reqFrequencyLimit';

/* 校验支付结果 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { payId } = req.query as { payId: string };

  await authCert({ req, authToken: true });

  // 查找订单记录校验
  const payOrder = await MongoBill.findById<BillSchemaType>(payId);

  if (!payOrder) {
    return Promise.reject('订单不存在');
  }
  if (payOrder.status === 'SUCCESS') {
    return Promise.reject('订单已结算');
  }

  // check pay result
  const wxPay = new WXPay();
  const payRes = await wxPay.getPayResult(payOrder.orderId);

  //  重点检查：支付成功
  if (payRes.trade_state === 'SUCCESS') {
    const payResult = await mongoSessionRun(async (session) => {
      // 更新订单状态. 如果没有合适的订单，说明订单重复了
      const updateRes = await MongoBill.findOneAndUpdate(
        {
          _id: payId,
          status: 'NOTPAY'
        },
        {
          status: 'SUCCESS'
        },
        {
          session,
          new: true
        }
      );
      if (!updateRes) {
        return Promise.reject('Bill not found');
      }
      await dealWithSuccessOrder(updateRes, session);

      return updateRes;
    });

    // 增加邀请者的默认的团队收益
    try {
      // 1. 找到充值的人
      const orderTmbId = payResult.tmbId;
      // 2. 找到充值的人的邀请者
      const tmb = await MongoTeamMember.findById(orderTmbId, 'userId')
        .populate<{
          user: UserModelSchema;
        }>('user', 'inviterId')
        .lean();
      const inviter = tmb?.user?.inviterId
        ? await MongoUser.findById(tmb.user.inviterId, 'promotionRate')
        : null;
      // 3. 增加邀请者的默认的团队收益
      if (inviter && tmb) {
        const amount = (payResult.price * inviter.promotionRate) / 100;
        await createOnePromotion({
          userId: inviter._id,
          objUId: tmb?.userId,
          type: 'pay',
          amount
        });
      }
    } catch (error) {}
    return '支付成功';
  }

  // 校验下是否超过一天
  const orderTime = dayjs(payOrder.createTime);
  const diffInHours = dayjs().diff(orderTime, 'hours');

  if (payRes.trade_state === 'CLOSED' || diffInHours > 24) {
    // 订单已关闭
    await MongoBill.findByIdAndUpdate(payId, {
      status: 'CLOSED'
    });
    return Promise.reject('订单已过期');
  }

  return Promise.reject(payRes?.trade_state_desc || '订单无效');
}

export default NextAPI(
  useIPFrequencyLimit({ id: 'check-pay-result', seconds: 1, limit: 1, force: true }),
  handler
);

export const dealWithSuccessOrder = async (payOrder: BillSchemaType, session: ClientSession) => {
  // Add balance to team
  if (payOrder.type === BillTypeEnum.standSubPlan) {
    await dealStandardPlanPay(payOrder, session);
  } else if (payOrder.type === BillTypeEnum.extraDatasetSub) {
    await dealExtraDatasetSubPay(payOrder, session);
  } else if (payOrder.type === BillTypeEnum.extraPoints) {
    await dealExtraPointsSubPay(payOrder, session);
  } else {
    return Promise.reject('订单类型错误');
  }
  unLockTrainingData(payOrder.teamId);
};

const unLockTrainingData = async (teamId: string, retry = 3): Promise<any> => {
  try {
    await MongoDatasetTraining.updateMany(
      {
        teamId
      },
      {
        lockTime: new Date('2000/1/1')
      }
    );
  } catch (error) {
    addLog.error('unLockTrainingData error', error);
    if (retry >= 0) {
      await delay(100);
      return unLockTrainingData(teamId, retry - 1);
    }
  }
};

/* 
  标准套餐从新计算开始和结束时间
  最大的套餐，开始和结束时间不变。（最大的套餐，开始时间肯定早于当前时间）
  逐一从高套餐往低套餐遍历：
  i 的时长 = i 的结束时间 - i 的开始时间
  i 的开始时间 = i-1 的结束时间
  i 的结束时间 = i 新的开始时间 + i 的时长
*/
export const reComputeStandPlans = async (teamId: string, session: ClientSession) => {
  const plans = await MongoTeamSub.find({
    teamId,
    type: SubTypeEnum.standard
  }).session(session);

  sortStandPlans(plans);

  for (let i = 1; i < plans.length; i++) {
    const plan = plans[i];
    const lastPlan = plans[i - 1];
    const duration = plan.expiredTime.getTime() - plan.startTime.getTime();
    plan.startTime = lastPlan.expiredTime;
    plan.expiredTime = new Date(plan.startTime.getTime() + duration);
  }

  for await (const plan of plans) {
    await plan.save({ session });
  }
};

const dealStandardPlanPay = async (payOrder: BillSchemaType, session: ClientSession) => {
  const subLevel = payOrder.metadata.standSubLevel!;
  const subMode = payOrder.metadata.subMode;
  const plan = getStandardPlanConfig(subLevel);

  if (!subLevel || !subMode || !plan) {
    throw new Error('缺少关键参数，更新账单失败，请联系管理员');
  }

  const durationMonth = subModeMap[subMode].durationMonth;

  // 1. 查找是否有相同类型的订阅，有的话，直接更新过期时间和增加积分；没有的话，创建新的订阅
  const teamSub = await MongoTeamSub.findOne({
    teamId: payOrder.teamId,
    type: SubTypeEnum.standard,
    currentSubLevel: subLevel
  }).session(session);

  // 计算总积分
  const totalPoints = plan.totalPoints * durationMonth;

  if (teamSub) {
    teamSub.totalPoints += totalPoints;
    teamSub.surplusPoints += totalPoints;
    teamSub.expiredTime = addMonths(teamSub.expiredTime, durationMonth);
    await teamSub.save({ session });
  } else {
    await MongoTeamSub.create(
      [
        {
          teamId: payOrder.teamId,
          type: SubTypeEnum.standard,
          startTime: new Date(),
          expiredTime: addMonths(new Date(), durationMonth),
          currentMode: subMode,
          nextMode: subMode,
          currentSubLevel: subLevel,
          nextSubLevel: subLevel,
          totalPoints,
          surplusPoints: totalPoints
        }
      ],
      { session }
    );
  }

  // 2. 重新排序标准订阅
  await reComputeStandPlans(payOrder.teamId, session);
};
const dealExtraDatasetSubPay = async (payOrder: BillSchemaType, session: ClientSession) => {
  const { month, datasetSize } = payOrder.metadata;
  if (!month || !datasetSize) {
    throw new Error('缺少关键参数，更新账单失败，请联系管理员');
  }

  // push extra dataset size sub
  await MongoTeamSub.create(
    [
      {
        teamId: payOrder.teamId,
        type: SubTypeEnum.extraDatasetSize,
        startTime: new Date(),
        expiredTime: addMonths(new Date(), month),
        price: payOrder.price,

        currentExtraDatasetSize: datasetSize
      }
    ],
    { session }
  );
};
const dealExtraPointsSubPay = async (payOrder: BillSchemaType, session: ClientSession) => {
  const { month, extraPoints } = payOrder.metadata;
  if (!month || !extraPoints) {
    throw new Error('缺少关键参数，更新账单失败，请联系管理员');
  }

  // push extra dataset size sub
  await MongoTeamSub.create(
    [
      {
        teamId: payOrder.teamId,
        type: SubTypeEnum.extraPoints,
        startTime: new Date(),
        expiredTime: addMonths(new Date(), month),
        price: payOrder.price,

        totalPoints: extraPoints,
        surplusPoints: extraPoints
      }
    ],
    { session }
  );
};
