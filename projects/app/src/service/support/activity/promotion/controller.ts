import { MongoPromotionRecord } from '@fastgpt/service/support/activity/promotion/schema';
import { MongoUser } from '@fastgpt/service/support/user/schema';

export async function createOnePromotion(data: {
  userId: string; // 加钱的人
  objUId: string; // userId 邀请的对象
  type: 'register' | 'pay';
  amount: number;
}) {
  const { userId, objUId, type, amount } = data;
  try {
    try {
      // user add balance
      await MongoUser.findByIdAndUpdate(userId, {
        $inc: { balance: amount }
      });
    } catch (error) {
      return setTimeout(() => {
        createOnePromotion(data);
      }, 2000);
    }
    // create promotion record
    await MongoPromotionRecord.create({
      userId,
      objUId,
      type,
      amount
    });
  } catch (error) {}
}
