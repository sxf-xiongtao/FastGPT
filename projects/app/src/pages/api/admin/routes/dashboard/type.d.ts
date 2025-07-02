import type { UsageSourceEnum } from '@fastgpt/global/support/wallet/usage/constants';

export type GetDataChartsQuery = {
  startTime: string;
  sources?: UsageSourceEnum[];
};
