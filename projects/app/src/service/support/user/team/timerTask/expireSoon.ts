import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import { addDays, differenceInDays } from 'date-fns';
import { sendInform2OneUser } from '../../inform/controller';
import { addLog } from '@fastgpt/service/common/system/log';
import { readFromSecondary } from '@fastgpt/service/common/mongo/utils';
import { StandardSubLevelEnum, SubTypeEnum } from '@fastgpt/global/support/wallet/sub/constants';

function notifyOneExpireSoon(teamId: string, day: number) {
  sendInform2OneUser({
    level: 'emergency',
    templateCode: 'EXPIRE_SOON',
    templateParam: {
      sub: '订阅套餐',
      day
    },
    teamId
  });
}

// Notify all users, whose subscription will expire soon
export async function notifyAllExpireSoon() {
  try {
    // get all subscriptions that will expire in 7 days
    const SevenDaysExpireAll = await MongoTeamSub.find(
      {
        type: SubTypeEnum.standard,
        currentSubLevel: { $ne: StandardSubLevelEnum.free },
        expiredTime: { $lte: addDays(new Date(), 8) }
      },
      'teamId expiredTime',
      {
        ...readFromSecondary
      }
    ).lean();

    // Send inform before expire in 7 days, 3 days, 1 day
    SevenDaysExpireAll.forEach((sub) => {
      const diffDay = differenceInDays(sub.expiredTime, new Date());
      if (diffDay === 7) {
        notifyOneExpireSoon(sub.teamId, 7);
      } else if (diffDay === 3) {
        notifyOneExpireSoon(sub.teamId, 3);
      } else if (diffDay === 1) {
        notifyOneExpireSoon(sub.teamId, 1);
      }
    });
  } catch (error) {
    addLog.error(`notifyAllExpireSoon error`, error);
  }
}
