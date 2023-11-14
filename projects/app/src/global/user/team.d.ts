import { TeamMemberSchema, TeamSchema } from '@fastgpt/global/support/user/team/type';
import { UserModelSchema } from '@fastgpt/global/support/user/type';

export type TeamMemberSchemaWithTeam = TeamMemberSchema & {
  teamId: TeamSchema;
};
export type TeamMemberSchemaWithTeamAndUser = TeamMemberSchemaWithTeam & {
  userId: UserModelSchema;
};
export type TeamMemberSchemaWithUser = TeamMemberSchema & {
  userId: UserModelSchema;
};
