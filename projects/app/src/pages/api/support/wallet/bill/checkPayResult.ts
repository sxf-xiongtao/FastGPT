import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoBill } from '@/service/support/wallet/bill/schema';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import type { BillSchemaType } from '@fastgpt/global/support/wallet/bill/type.d';
import dayjs from 'dayjs';
import { WXPay } from '@/service/support/wallet/bill/pay';
import { connectToDatabase } from '@/service/mongo';
import { createOnePromotion } from '@/service/support/activity/promotion/controller';
import { updateTeamBalance } from '@/service/support/wallet/controller';
import { MongoDatasetTraining } from '@fastgpt/service/core/dataset/training/schema';
import { delay } from '@fastgpt/global/common/system/utils';
import { addLog } from '@fastgpt/service/common/system/log';
import { BillTypeEnum } from '@fastgpt/global/support/wallet/bill/constants';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { TeamMemberWithUserSchema } from '@fastgpt/global/support/user/team/type';
import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import { SubStatusEnum, SubTypeEnum } from '@fastgpt/global/support/wallet/sub/constants';
import { addMonths } from 'date-fns';
import { getErrText } from '@fastgpt/global/common/error/utils';
import { ClientSession } from '@fastgpt/service/common/mongo';

/* 校验支付结果 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { payId } = req.query as { payId: string };

    const { tmbId } = await authCert({ req, authToken: true });

    // 查找订单记录校验
    const payOrder = await MongoBill.findById<BillSchemaType>(payId);

    if (!payOrder) {
      throw new Error('订单不存在');
    }
    if (payOrder.status === 'SUCCESS') {
      throw new Error('订单已结算');
    }

    // find inviter
    const tmb = (await MongoTeamMember.findById(tmbId, 'userId').populate(
      'userId',
      'inviterId'
    )) as TeamMemberWithUserSchema;
    const inviter = tmb?.userId?.inviterId ? await MongoUser.findById(tmb.userId.inviterId) : null;

    // check pay result
    const wxPay = new WXPay();
    const payRes = await wxPay.getPayResult(payOrder.orderId);

    // if (payRes.trade_state === 'SUCCESS') {
    if (payRes.trade_state !== 'SUCCESS') {
      // 订单已支付
      try {
        // 更新订单状态. 如果没有合适的订单，说明订单重复了
        const updateRes = await MongoBill.updateOne(
          {
            _id: payId,
            status: 'NOTPAY'
          },
          {
            status: 'SUCCESS'
          }
        );
        if (updateRes.modifiedCount === 1) {
          await dealWithSuccessOrder(payOrder);

          // 增加邀请者的默认的团队收益
          if (inviter) {
            const amount = (payOrder.price * inviter.promotionRate) / 100;
            createOnePromotion({
              userId: inviter._id,
              objUId: tmb.userId._id,
              type: 'pay',
              amount
            });
          }

          return jsonRes(res, {
            data: '支付成功'
          });
        }
      } catch (err) {
        console.log(err);
        // roll back status
        try {
          await MongoBill.findByIdAndUpdate(payId, {
            status: 'NOTPAY'
          });
        } catch (error) {}
        return jsonRes(res, {
          code: 500,
          message: getErrText(err, '更新订单失败,请重试')
        });
      }
    }

    // 校验下是否超过一天
    const orderTime = dayjs(payOrder.createTime);
    const diffInHours = dayjs().diff(orderTime, 'hours');

    if (payRes.trade_state === 'CLOSED' || diffInHours > 24) {
      // 订单已关闭
      await MongoBill.findByIdAndUpdate(payId, {
        status: 'CLOSED'
      });
      throw new Error('订单已过期');
    }
    throw new Error(payRes?.trade_state_desc || '订单无效');
  } catch (err) {
    // console.log(err);
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}

export const dealWithSuccessOrder = async (payOrder: BillSchemaType, session?: ClientSession) => {
  // Add balance to team
  if (payOrder.type === BillTypeEnum.balance) {
    await dealBalancePay(payOrder);
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

const dealBalancePay = async (payOrder: BillSchemaType) => {
  await updateTeamBalance({ teamId: payOrder.teamId, amount: payOrder.price });
};
const dealExtraDatasetSubPay = async (payOrder: BillSchemaType, session?: ClientSession) => {
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
        status: SubStatusEnum.active,
        startTime: new Date(),
        expiredTime: addMonths(new Date(), month),
        price: payOrder.price,

        currentExtraDatasetSize: datasetSize
      }
    ],
    { session }
  );
};
const dealExtraPointsSubPay = async (payOrder: BillSchemaType, session?: ClientSession) => {
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
        status: SubStatusEnum.active,
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
