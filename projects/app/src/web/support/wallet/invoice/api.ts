import { POST } from '@/service/common/request';
import { InvoiceSchemaType } from '@fastgpt/global/support/wallet/bill/type';
import { PaginationProps, PaginationResponse } from '@fastgpt/web/common/fetch/type';

export const getInvoiceList = (data: PaginationProps<{ search?: string }>) =>
  POST<PaginationResponse<InvoiceSchemaType>>('/admin/support/wallet/bill/invoice/list', data);
export const finishInvoice = (data: FormData) =>
  POST('/admin/support/wallet/bill/invoice/finish', data, {
    timeout: 600000,
    headers: {
      'Content-Type': 'multipart/form-data; charset=utf-8'
    }
  });
