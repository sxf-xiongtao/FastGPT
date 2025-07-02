import { getFakeUsers } from '@test/datas/users';
import { Call } from '@test/utils/request';
import { describe, expect, it } from 'vitest';
import * as getTeamPlans from '@/pages/api/support/user/team/plan/getTeamPlans';
import type { TeamSubSchema } from '@fastgpt/global/support/wallet/sub/type';
import dayjs from 'dayjs';
import {
  addStandardSub,
  addExtraDatasetSizeSub,
  addExtraPointsSub
} from '@/service/support/wallet/sub/controller';
import { StandardSubLevelEnum } from '@fastgpt/global/support/wallet/sub/constants';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';

const formatTeamPlans = (teamPlans: TeamSubSchema[]) => {
  return teamPlans.map((item) => ({
    type: item.type,
    currentSubLevel: item.currentSubLevel,
    totalPoints: item.totalPoints,
    surplusPoints: item.surplusPoints,
    durationDay: dayjs(item.expiredTime).diff(dayjs(item.startTime), 'day'),
    currentExtraDatasetSize: item.currentExtraDatasetSize
  }));
};

describe('Update sub', () => {
  it('Create first sub', async () => {
    const user = await getFakeUsers();

    let teamPlans = (
      await Call(getTeamPlans.default, {
        auth: user.manager
      })
    ).data;
    expect(teamPlans.length).toBe(0);

    await mongoSessionRun(async (session) => {
      // Create first sub
      await addStandardSub({
        teamId: user.owner.teamId,
        level: StandardSubLevelEnum.experience,
        totalPoints: 1000,
        durationDay: 30,
        session
      });
    });
    teamPlans = (
      await Call(getTeamPlans.default, {
        auth: user.manager
      })
    ).data;
    expect(formatTeamPlans(teamPlans)).toEqual([
      {
        type: 'standard',
        currentSubLevel: 'experience',
        totalPoints: 1000,
        surplusPoints: 1000,
        durationDay: 30
      }
    ]);
  });

  it('Create two same standard sub', async () => {
    const user = await getFakeUsers();

    await mongoSessionRun(async (session) => {
      // Create first sub
      await addStandardSub({
        teamId: user.owner.teamId,
        level: StandardSubLevelEnum.experience,
        totalPoints: 1000,
        durationDay: 30,
        session
      });
      await addStandardSub({
        teamId: user.owner.teamId,
        level: StandardSubLevelEnum.experience,
        totalPoints: 2000,
        durationDay: 10,
        session
      });
    });
    let teamPlans = (
      await Call(getTeamPlans.default, {
        auth: user.manager
      })
    ).data;
    expect(formatTeamPlans(teamPlans)).toEqual([
      {
        type: 'standard',
        currentSubLevel: 'experience',
        totalPoints: 3000,
        surplusPoints: 3000,
        durationDay: 40
      }
    ]);
  });

  it('Create higher level standard sub', async () => {
    const user = await getFakeUsers();

    await mongoSessionRun(async (session) => {
      // Create first sub
      await addStandardSub({
        teamId: user.owner.teamId,
        level: StandardSubLevelEnum.experience,
        totalPoints: 1000,
        durationDay: 30,
        session
      });
      await addStandardSub({
        teamId: user.owner.teamId,
        level: StandardSubLevelEnum.enterprise,
        totalPoints: 2000,
        durationDay: 10,
        session
      });
      await addStandardSub({
        teamId: user.owner.teamId,
        level: StandardSubLevelEnum.team,
        totalPoints: 4000,
        durationDay: 5,
        session
      });
    });
    let teamPlans = (
      await Call(getTeamPlans.default, {
        auth: user.manager
      })
    ).data;
    expect(formatTeamPlans(teamPlans)).toEqual([
      {
        type: 'standard',
        currentSubLevel: 'enterprise',
        totalPoints: 2000,
        surplusPoints: 2000,
        durationDay: 10
      },
      {
        type: 'standard',
        currentSubLevel: 'team',
        totalPoints: 4000,
        surplusPoints: 4000,
        durationDay: 5
      },
      {
        type: 'standard',
        currentSubLevel: 'experience',
        totalPoints: 1000,
        surplusPoints: 1000,
        durationDay: 30
      }
    ]);
  });

  it('Create lower level standard sub', async () => {
    const user = await getFakeUsers();

    await mongoSessionRun(async (session) => {
      await addStandardSub({
        teamId: user.owner.teamId,
        level: StandardSubLevelEnum.enterprise,
        totalPoints: 2000,
        durationDay: 10,
        session
      });
      await addStandardSub({
        teamId: user.owner.teamId,
        level: StandardSubLevelEnum.team,
        totalPoints: 4000,
        durationDay: 5,
        session
      });
      await addStandardSub({
        teamId: user.owner.teamId,
        level: StandardSubLevelEnum.experience,
        totalPoints: 1000,
        durationDay: 30,
        session
      });
      await addStandardSub({
        teamId: user.owner.teamId,
        level: StandardSubLevelEnum.team,
        totalPoints: 4000,
        durationDay: 5,
        session
      });
    });
    let teamPlans = (
      await Call(getTeamPlans.default, {
        auth: user.manager
      })
    ).data;
    expect(formatTeamPlans(teamPlans)).toEqual([
      {
        type: 'standard',
        currentSubLevel: 'enterprise',
        totalPoints: 2000,
        surplusPoints: 2000,
        durationDay: 10
      },
      {
        type: 'standard',
        currentSubLevel: 'team',
        totalPoints: 8000,
        surplusPoints: 8000,
        durationDay: 10
      },
      {
        type: 'standard',
        currentSubLevel: 'experience',
        totalPoints: 1000,
        surplusPoints: 1000,
        durationDay: 30
      }
    ]);
  });

  it('Create extra sub', async () => {
    const user = await getFakeUsers();

    await mongoSessionRun(async (session) => {
      await addStandardSub({
        teamId: user.owner.teamId,
        level: StandardSubLevelEnum.experience,
        totalPoints: 1000,
        durationDay: 30,
        session
      });
      await addExtraDatasetSizeSub({
        teamId: user.owner.teamId,
        datasetSize: 1000,
        durationDay: 20,
        price: 0,
        session
      });
      await addExtraDatasetSizeSub({
        teamId: user.owner.teamId,
        datasetSize: 2000,
        durationDay: 10,
        price: 0,
        session
      });
      await addExtraPointsSub({
        teamId: user.owner.teamId,
        points: 1000,
        durationDay: 40,
        price: 0,
        session
      });
      await addExtraPointsSub({
        teamId: user.owner.teamId,
        points: 2000,
        durationDay: 1,
        price: 0,
        session
      });
      await addStandardSub({
        teamId: user.owner.teamId,
        level: StandardSubLevelEnum.team,
        totalPoints: 1000,
        durationDay: 30,
        session
      });
    });

    let teamPlans = (
      await Call(getTeamPlans.default, {
        auth: user.manager
      })
    ).data;

    expect(formatTeamPlans(teamPlans)).toEqual([
      {
        type: 'extraPoints',
        durationDay: 1,
        totalPoints: 2000,
        surplusPoints: 2000
      },
      {
        type: 'extraDatasetSize',
        durationDay: 10,
        currentExtraDatasetSize: 2000
      },
      {
        type: 'extraDatasetSize',
        durationDay: 20,
        currentExtraDatasetSize: 1000
      },
      {
        type: 'standard',
        currentSubLevel: 'team',
        totalPoints: 1000,
        surplusPoints: 1000,
        durationDay: 30
      },
      {
        type: 'extraPoints',
        durationDay: 40,
        totalPoints: 1000,
        surplusPoints: 1000
      },
      {
        type: 'standard',
        currentSubLevel: 'experience',
        totalPoints: 1000,
        surplusPoints: 1000,
        durationDay: 30
      }
    ]);
  });
});
