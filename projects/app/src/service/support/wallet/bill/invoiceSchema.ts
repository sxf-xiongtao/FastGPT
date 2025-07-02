import type { InvoiceSchemaType } from '@fastgpt/global/support/wallet/bill/type';
import { getMongoModel, Schema } from '@fastgpt/service/common/mongo';
import { teamInvoiceTitleScheme } from '../../user/team/invoiceAccount/teamInvoiceSchema';
import { InvoiceStatusEnum } from '@fastgpt/global/support/wallet/bill/invoice/constants';

export const InvoiceCollectionName = 'bill_invoices';

const InvoiceSchema = new Schema({
  ...teamInvoiceTitleScheme,
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: Number,
    enum: Object.values(InvoiceStatusEnum).filter((value) => typeof value === 'number'),
    required: true
  },
  billIdList: {
    type: [String],
    ref: 'pays',
    required: true
  },
  createTime: {
    type: Date,
    default: () => new Date(),
    required: true
  },
  finishTime: Date,
  file: {
    type: Buffer,
    required: false
  }
});

try {
  InvoiceSchema.index({ teamId: 1 });
} catch (error) {
  console.log(error);
}

export const MongoInvoice = getMongoModel<InvoiceSchemaType>(InvoiceCollectionName, InvoiceSchema);
