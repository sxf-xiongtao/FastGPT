import { MongoPromotionRecord } from '@fastgpt/service/support/activity/promotion/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { updateTeamBalance } from '../../wallet/controller';

export async function createOnePromotion(data: {
  userId: string; // 加钱的人
  objUId: string; // userId 邀请的对象
  type: 'register' | 'pay';
  amount: number;
}) {
  const { userId, objUId, type, amount } = data;
  try {
    // find default team
    const tmb = await MongoTeamMember.findOne({
      userId,
      defaultTeam: true
    });
    if (!tmb) {
      return;
    }
    try {
      // user add balance
      updateTeamBalance({ teamId: tmb.teamId, amount });
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
