import { getTeamStandPlan } from '@fastgpt/service/support/wallet/sub/utils';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import { TeamMemberStatusEnum } from '@fastgpt/global/support/user/team/constant';

export const checkTeamWebSyncPermission = async (teamId: string) => {
  const { standardConstants } = await getTeamStandPlan({
    teamId
  });

  if (standardConstants && !standardConstants?.permissionWebsiteSync) {
    return Promise.reject(TeamErrEnum.websiteSyncNotEnough);
  }
};
export const checkTeamMaxMembersPermission = async (teamId: string, newCount: number) => {
  const [{ standardConstants }, memberCount] = await Promise.all([
    getTeamStandPlan({
      teamId
    }),
    MongoTeamMember.countDocuments({
      teamId,
      status: { $ne: TeamMemberStatusEnum.leave }
    })
  ]);

  if (standardConstants && newCount + memberCount > standardConstants?.maxTeamMember) {
    return Promise.reject(TeamErrEnum.teamOverSize);
  }
};
