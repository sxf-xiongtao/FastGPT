import { getVectorCountByTeamId } from '@fastgpt/service/common/vectorStore/controller';
import { getTeamSubPlans, getTeamStandPlan } from '@fastgpt/service/support/wallet/sub/utils';
import { getStandardPlans } from '../wallet/sub/utils';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';

export const checkDatasetLimit = async ({
  teamId,
  insertLen = 0
}: {
  teamId: string;
  insertLen?: number;
}) => {
  const [{ totalPoints, usedPoints, datasetMaxSize }, usedSize] = await Promise.all([
    getTeamSubPlans({ teamId, standardPlans: getStandardPlans() }),
    getVectorCountByTeamId(teamId)
  ]);

  if (usedSize + insertLen >= datasetMaxSize) {
    return Promise.reject(TeamErrEnum.datasetSizeNotEnough);
  }

  if (usedPoints >= totalPoints) {
    return Promise.reject(TeamErrEnum.aiPointsNotEnough);
  }
  return;
};
export const checkTeamWebSyncPermission = async (teamId: string) => {
  const { standardConstants } = await getTeamStandPlan({
    teamId,
    standardPlans: getStandardPlans()
  });

  if (standardConstants && !standardConstants?.permissionWebsiteSync) {
    return Promise.reject(TeamErrEnum.websiteSyncNotEnough);
  }
};
export const checkTeamMaxMembersPermission = async (teamId: string, newMembers: number) => {
  const [{ standardConstants }, memberCount] = await Promise.all([
    getTeamStandPlan({
      teamId,
      standardPlans: getStandardPlans()
    }),
    MongoTeamMember.countDocuments({ teamId })
  ]);

  if (standardConstants && newMembers + memberCount > standardConstants?.maxTeamMember) {
    return Promise.reject(TeamErrEnum.teamOverSize);
  }
};
