import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import { addDays, differenceInDays } from 'date-fns';
import { sendInform2OneUser } from '../../inform/controller';
import { addLog } from '@fastgpt/service/common/system/log';
import { readFromSecondary } from '@fastgpt/service/common/mongo/utils';
import { StandardSubLevelEnum, SubTypeEnum } from '@fastgpt/global/support/wallet/sub/constants';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';

async function notifyOneExpireSoon(teamId: string, day: number) {
  const team = await MongoTeam.findById(teamId).lean();
  if (!team) {
    addLog.error('Can not find team', teamId);
    return false;
  }

  sendInform2OneUser({
    level: 'emergency',
    templateCode: 'EXPIRE_SOON',
    templateParam: { sub: '订阅套餐', day },
    teamId,
    userId: team.ownerId
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

    const NOTIFY_DAYS = new Set([7, 3, 1]);

    // Send inform before expire in 7 days, 3 days, 1 day
    for (const sub of SevenDaysExpireAll) {
      const diffDay = differenceInDays(sub.expiredTime, new Date());
      if (NOTIFY_DAYS.has(diffDay)) {
        await notifyOneExpireSoon(sub.teamId, diffDay);
      }
    }
  } catch (error) {
    addLog.error(`notifyAllExpireSoon error`, error);
  }
}
