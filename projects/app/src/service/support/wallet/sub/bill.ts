import { BillSourceEnum } from '@fastgpt/global/support/wallet/bill/constants';
import { MongoBill } from '@fastgpt/service/support/wallet/bill/schema';
import { updateTeamBalance } from '../controller';
import { ClientSession } from '@fastgpt/service/common/mongo';
import { StandardSubLevelEnum, SubModeEnum } from '@fastgpt/global/support/wallet/sub/constants';

export const createStandardSubBill = async ({
  teamId,
  tmbId,
  payPrice,
  level,
  mode,
  session
}: {
  teamId: string;
  tmbId: string;
  payPrice: number;
  level: `${StandardSubLevelEnum}`;
  mode: `${SubModeEnum}`;
  session: ClientSession;
}) => {
  await updateTeamBalance({
    teamId,
    amount: -payPrice,
    session
  });
  await MongoBill.create(
    [
      {
        teamId,
        tmbId,
        appName: 'support.wallet.subscription.type.standard',
        total: payPrice,
        source: BillSourceEnum.standSubPlan,
        list: [
          {
            moduleName: 'support.wallet.subscription.type.standard',
            amount: payPrice,
            level,
            mode
          }
        ]
      }
    ],
    { session }
  );
};

export const createExtraDatasetSizeSubBill = async ({
  teamId,
  tmbId,
  payPrice,
  size,
  session
}: {
  teamId: string;
  tmbId: string;
  payPrice: number;
  size: number;
  session: ClientSession;
}) => {
  await updateTeamBalance({
    teamId,
    amount: -payPrice,
    session
  });
  await MongoBill.create(
    [
      {
        teamId,
        tmbId,
        appName: 'support.wallet.subscription.type.extraDatasetSize',
        total: payPrice,
        source: BillSourceEnum.extraDatasetSub,
        list: [
          {
            moduleName: 'support.wallet.subscription.type.extraDatasetSize',
            amount: payPrice,
            datasetSize: size
          }
        ]
      }
    ],
    { session }
  );
};
