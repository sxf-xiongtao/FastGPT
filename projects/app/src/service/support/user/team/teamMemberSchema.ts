import { connectionMongo, type Model } from '@fastgpt/service/common/mongo';
const { Schema, model, models } = connectionMongo;
import { TeamMemberSchema as TeamMemberType } from '@fastgpt/global/support/user/team/type.d';
import { TeamCollectionName } from './teamSchema';
import { userCollectionName } from '@fastgpt/service/support/user/schema';
import { TeamMemberRoleMap, TeamMemberStatusMap } from '@fastgpt/global/support/user/team/constant';

export const TeamMemberCollectionName = 'teamMembers';

const TeamMemberSchema = new Schema({
  teamId: {
    type: Schema.Types.ObjectId,
    ref: TeamCollectionName,
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: userCollectionName,
    required: true
  },
  role: {
    type: String,
    enum: Object.keys(TeamMemberRoleMap)
  },
  status: {
    type: String,
    enum: Object.keys(TeamMemberStatusMap)
  }
});

try {
} catch (error) {
  console.log(error);
}

export const MongoTeamMember: Model<TeamMemberType> =
  models[TeamMemberCollectionName] || model(TeamMemberCollectionName, TeamMemberSchema);
