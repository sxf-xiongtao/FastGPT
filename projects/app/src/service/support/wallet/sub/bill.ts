import { BillSourceEnum } from '@fastgpt/global/support/wallet/bill/constants';
import { MongoBill } from '@fastgpt/service/support/wallet/bill/schema';
import { updateTeamBalance } from '../controller';

export const createExtraDatasetSizeSubBill = async ({
  teamId,
  tmbId,
  payPrice,
  size
}: {
  teamId: string;
  tmbId: string;
  payPrice: number;
  size: number;
}) => {
  await MongoBill.create({
    teamId,
    tmbId,
    appName: 'support.user.team.subscription.type.extraDatasetSize',
    total: payPrice,
    source: BillSourceEnum.extraDatasetSub,
    list: [
      {
        moduleName: 'support.user.team.subscription.type.extraDatasetSize',
        amount: payPrice,
        datasetSize: size
      }
    ]
  });
  await updateTeamBalance({
    teamId,
    amount: -payPrice
  });
};
