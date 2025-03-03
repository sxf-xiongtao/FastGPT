import { updateTeamBalance } from '../controller';
import { ClientSession } from '@fastgpt/service/common/mongo';
import { StandardSubLevelEnum, SubModeEnum } from '@fastgpt/global/support/wallet/sub/constants';
import { MongoBill } from '../bill/schema';
import { getNanoid } from '@fastgpt/global/common/string/tools';
import {
  BillPayWayEnum,
  BillStatusEnum,
  BillTypeEnum
} from '@fastgpt/global/support/wallet/bill/constants';

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
        orderId: getNanoid(24),
        status: BillStatusEnum.SUCCESS,
        type: BillTypeEnum.standSubPlan,
        price: payPrice,
        hasInvoice: true,
        metadata: {
          payWay: BillPayWayEnum.balance,
          subMode: mode,
          standSubLevel: level
        }
      }
    ],
    { session, ordered: true }
  );
};
