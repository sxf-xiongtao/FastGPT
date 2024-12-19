import { Schema, getMongoModel } from '@fastgpt/service/common/mongo';
import { TeamCollectionName } from '@fastgpt/global/support/user/team/constant';
import type { TeamInvoiceHeaderInfoSchemaType } from '@fastgpt/global/support/user/team/type';
export const TeamInvoiceCollectionName = 'team_Invoice_titles';

export const teamInvoiceTitleScheme = {
  teamId: {
    type: Schema.Types.ObjectId,
    ref: TeamCollectionName,
    required: true
  },
  teamName: {
    type: String,
    required: true
  },
  unifiedCreditCode: {
    type: String,
    required: true
  },
  companyAddress: {
    type: String
  },
  companyPhone: {
    type: String
  },
  bankName: {
    type: String
  },
  bankAccount: {
    type: String
  },
  needSpecialInvoice: {
    type: Boolean,
    required: true,
    default: false
  },
  contactPhone: {
    type: String
  },
  emailAddress: {
    type: String,
    required: true
  }
};

const TeamInvoiceSchema = new Schema(teamInvoiceTitleScheme);

try {
  TeamInvoiceSchema.index({ teamId: 1 });
} catch (error) {
  console.log(error);
}

export const MongoTeamInvoiceTitle = getMongoModel<TeamInvoiceHeaderInfoSchemaType>(
  TeamInvoiceCollectionName,
  TeamInvoiceSchema
);
