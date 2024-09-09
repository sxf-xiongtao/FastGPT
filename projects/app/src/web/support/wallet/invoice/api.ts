import { POST } from '@/service/common/request';
import { PagingData, RequestPaging } from '@/types';
import { InvoiceSchemaType } from '@fastgpt/global/support/wallet/bill/type';

export const getInvoiceList = (data: RequestPaging & { search?: string }) =>
  POST<PagingData<InvoiceSchemaType>>('/admin/support/wallet/bill/invoice/list', data);
export const finishInvoice = (data: FormData) =>
  POST('/admin/support/wallet/bill/invoice/finish', data, {
    timeout: 600000,
    headers: {
      'Content-Type': 'multipart/form-data; charset=utf-8'
    }
  });
