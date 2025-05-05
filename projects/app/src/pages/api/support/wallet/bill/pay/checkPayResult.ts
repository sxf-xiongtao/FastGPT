import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoBill } from '@/service/support/wallet/bill/schema';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import type { BillSchemaType } from '@fastgpt/global/support/wallet/bill/type.d';
import dayjs from 'dayjs';
import { createOnePromotion } from '@/service/support/activity/promotion/controller';
import { MongoDatasetTraining } from '@fastgpt/service/core/dataset/training/schema';
import { delay } from '@fastgpt/global/common/system/utils';
import { addLog } from '@fastgpt/service/common/system/log';
import { BillStatusEnum, BillTypeEnum } from '@fastgpt/global/support/wallet/bill/constants';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { subModeMap } from '@fastgpt/global/support/wallet/sub/constants';
import { ClientSession } from '@fastgpt/service/common/mongo';
import { NextAPI } from '@/service/middleware/entry';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { getStandardPlanConfig } from '@fastgpt/service/support/wallet/sub/utils';
import { UserModelSchema } from '@fastgpt/global/support/user/type';
import { useIPFrequencyLimit } from '@fastgpt/service/common/middle/reqFrequencyLimit';
import {
  addExtraDatasetSizeSub,
  addExtraPointsSub,
  addStandardSub
} from '@/service/support/wallet/sub/controller';
import { BillPayWayEnum } from '@fastgpt/global/support/wallet/bill/constants';
import { createPaymentController } from '@/service/support/wallet/bill/pay/base';
import { CheckPayResultResponse } from '@fastgpt/global/support/wallet/bill/api';
import { i18nT } from '@fastgpt/web/i18n/utils';

/* 校验支付结果 */
async function handler(req: NextApiRequest, res: NextApiResponse): Promise<CheckPayResultResponse> {
  const { payId } = req.query as { payId: string };

  await authCert({ req, authToken: true });

  // 查找订单记录校验
  const payOrder = await MongoBill.findById<BillSchemaType>(payId).lean();
  if (!payOrder) {
    return Promise.reject('订单不存在');
  }
  if (payOrder.status === BillStatusEnum.SUCCESS) {
    return {
      status: BillStatusEnum.SUCCESS,
      description: i18nT('common:bill_already_processed')
    };
  }
  if (
    payOrder.metadata.payWay === BillPayWayEnum.bank ||
    payOrder.metadata.payWay === BillPayWayEnum.coupon ||
    payOrder.metadata.payWay === BillPayWayEnum.balance
  ) {
    return {
      status: BillStatusEnum.NOTPAY,
      description: i18nT('common:bill_not_pay_processed')
    };
  }

  const paymentProcessor = await createPaymentController(payOrder.metadata.payWay);
  const payRes = await paymentProcessor.getPayResult(payOrder.orderId);

  //  重点检查：支付成功
  if (payRes.status === BillStatusEnum.SUCCESS) {
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

    return {
      status: BillStatusEnum.SUCCESS,
      description: i18nT('common:pay_success')
    };
  }

  // 校验下是否超过一天, 超过一天并且已经关闭的订单，则设置成关闭状态
  const orderTime = dayjs(payOrder.createTime);
  const diffInHours = dayjs().diff(orderTime, 'hours');
  if (payRes.status === BillStatusEnum.CLOSED || diffInHours > 24) {
    await MongoBill.findByIdAndUpdate(payId, {
      status: 'CLOSED'
    });
    return {
      status: BillStatusEnum.CLOSED,
      description: i18nT('common:bill_expired')
    };
  }

  return {
    status: BillStatusEnum.NOTPAY,
    description: i18nT('common:support.wallet.bill.status.notpay')
  };
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

const dealStandardPlanPay = async (payOrder: BillSchemaType, session: ClientSession) => {
  const subLevel = payOrder.metadata.standSubLevel!;
  const subMode = payOrder.metadata.subMode;
  const plan = getStandardPlanConfig(subLevel);

  if (!subLevel || !subMode || !plan) {
    throw new Error('缺少关键参数，更新账单失败，请联系管理员');
  }

  // 计算新增的时长
  const durationMonth = subModeMap[subMode].durationMonth;

  // 计算新增的总积分
  const totalPoints = plan.totalPoints * durationMonth;

  // 新增标准订阅
  await addStandardSub({
    teamId: payOrder.teamId,
    level: subLevel,
    totalPoints,
    durationDay: durationMonth * 30,
    subMode,
    session
  });
};
const dealExtraDatasetSubPay = async (payOrder: BillSchemaType, session: ClientSession) => {
  const { month, datasetSize } = payOrder.metadata;
  if (!month || !datasetSize) {
    throw new Error('缺少关键参数，更新账单失败，请联系管理员');
  }

  await addExtraDatasetSizeSub({
    teamId: payOrder.teamId,
    datasetSize,
    durationDay: month * 30,
    price: payOrder.price,
    session
  });
};
const dealExtraPointsSubPay = async (payOrder: BillSchemaType, session: ClientSession) => {
  const { month, extraPoints } = payOrder.metadata;
  if (!month || !extraPoints) {
    throw new Error('缺少关键参数，更新账单失败，请联系管理员');
  }

  await addExtraPointsSub({
    teamId: payOrder.teamId,
    points: extraPoints,
    durationDay: month * 30,
    price: payOrder.price,
    session
  });
};
