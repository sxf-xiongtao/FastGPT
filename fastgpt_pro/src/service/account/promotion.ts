import { PRICE_SCALE } from '@/constants/common';
import { User, PromotionRecord } from '../mongo';

export async function sendRegisterPromotion({
  registerName,
  userId,
  objUId
}: {
  registerName: string;
  userId: string;
  objUId: string;
}) {
  try {
    if (!userId || registerName.includes('@')) return;

    const amount = 5 * PRICE_SCALE;

    try {
      // user add balance
      await User.findByIdAndUpdate(userId, {
        $inc: { balance: amount }
      });
    } catch (error) {
      return setTimeout(() => {
        sendRegisterPromotion({ registerName, userId, objUId });
      }, 2000);
    }
    // create promotion record
    await PromotionRecord.create({
      userId,
      objUId,
      type: 'register',
      amount
    });
  } catch (error) {}
}
