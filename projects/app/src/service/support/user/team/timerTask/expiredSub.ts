import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import { StandardSubLevelEnum } from '@fastgpt/global/support/wallet/sub/constants';
import { addDays } from 'date-fns';
import { sendInform2OneUser } from '../../inform/controller';

export function notifyOneExpired(teamId: string, day: number) {
  sendInform2OneUser({
    teamId,
    templateCode: 'EXPIRED',
    templateParam: {
      day,
      sub: '订阅套餐'
    },
    level: 'emergency'
  });
}

export function notifyOneLackofPoints(teamId: string) {
  sendInform2OneUser({
    teamId,
    templateCode: 'LACK_OF_POINTS',
    templateParam: {},
    level: 'emergency'
  });
}

// 这个方案有问题，过期的套餐会被删除，无记录了。
// Notify all users, whose subscription has expired
export async function notifyAllExpired() {
  const Now = new Date(); // when the function is called

  // get all expired subscriptions
  const Expired = await MongoTeamSub.find({
    expiredTime: {
      $lte: Now
    }
  }).lean();

  // filter subscriptions that have expired today, 3 days ago, 7 days ago, 30 days ago
  const ExpiredToday = Expired.filter((sub) => {
    return sub.expiredTime.getDate() === Now.getDate();
  });
  const Expired3Days = Expired.filter((sub) => {
    return sub.expiredTime.getDate() === Now.getDate() - 3;
  });
  const Expired7Days = Expired.filter((sub) => {
    return sub.expiredTime.getDate() === Now.getDate() - 7;
  });
  const Expired30Days = Expired.filter((sub) => {
    return sub.expiredTime.getDate() === Now.getDate() - 30;
  });

  // construct the promises array
  const ExpiredTodayPromises = ExpiredToday.map((sub) => notifyOneExpired(String(sub.teamId), 0));
  const Expired3DaysPromises = Expired3Days.map((sub) => notifyOneExpired(String(sub.teamId), 3));
  const Expired7DaysPromises = Expired7Days.map((sub) => notifyOneExpired(String(sub.teamId), 7));
  const Expired30DaysPromises = Expired30Days.map((sub) =>
    notifyOneExpired(String(sub.teamId), 30)
  );

  await Promise.allSettled(
    ExpiredTodayPromises.concat(Expired3DaysPromises, Expired7DaysPromises, Expired30DaysPromises)
  );
}
