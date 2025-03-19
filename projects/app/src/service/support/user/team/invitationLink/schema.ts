import { getNanoid } from '@fastgpt/global/common/string/tools';
import { TeamCollectionName } from '@fastgpt/global/support/user/team/constant';
import { connectionMongo, getMongoModel } from '@fastgpt/service/common/mongo';
import { InvitationSchemaType } from '@fastgpt/service/support/user/team/invitationLink/type';
const { Schema } = connectionMongo;

export const InvitationCollectionName = 'team_invitation_links';

const InvitationSchema = new Schema({
  linkId: {
    type: String,
    unique: true,
    default: () => getNanoid()
  },
  teamId: {
    type: Schema.Types.ObjectId,
    ref: TeamCollectionName,
    required: true
  },
  usedTimesLimit: {
    type: Number,
    default: 1,
    enum: [1, -1]
  },
  forbidden: Boolean,
  expires: Date,
  description: String,
  members: {
    type: [String],
    default: []
  }
});

InvitationSchema.virtual('team', {
  ref: TeamCollectionName,
  localField: 'teamId',
  foreignField: '_id',
  justOne: true
});

try {
  InvitationSchema.index({ teamId: 1 });
  InvitationSchema.index({ expires: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
} catch (error) {
  console.log(error);
}

export const MongoInvitationLink = getMongoModel<InvitationSchemaType>(
  InvitationCollectionName,
  InvitationSchema
);
