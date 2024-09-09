import { POST } from '@/service/common/request';
import { PagingData } from '@/types';
import { BillSchemaType } from '@fastgpt/global/support/wallet/bill/type';

export const getPays = (data: any) =>
  POST<PagingData<BillSchemaType>>('/admin/routes/pays/getPays', data);
