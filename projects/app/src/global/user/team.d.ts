import { TeamMemberSchema, TeamSchema } from '@fastgpt/global/support/user/team/type';
import { UserModelSchema } from '@fastgpt/global/support/user/type';

export type TeamMemberSchemaWithTeamAndUser = TeamMemberSchema & {
  teamId: TeamSchema;
  userId: UserModelSchema;
};
export type TeamMemberSchemaWithUser = TeamMemberSchema & {
  userId: UserModelSchema;
};
