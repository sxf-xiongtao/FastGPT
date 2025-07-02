import type { ConcatBillQueueItemType } from '@fastgpt/service/support/wallet/usage/type';

declare global {
  var reduceAiPointsQueue: { teamId: string; totalPoints: number }[];
  var concatBillQueue: ConcatBillQueueItemType[];
}
