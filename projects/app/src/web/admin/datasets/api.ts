import { POST } from '@/service/common/request';
import type { GetDatasetsResponseData } from '@/pages/api/admin/routes/datasets/getDatasets';
import { PaginationProps } from '@fastgpt/web/common/fetch/type';

export const getDatasets = (data: PaginationProps) =>
  POST<GetDatasetsResponseData>('/admin/routes/datasets/getDatasets', data);
