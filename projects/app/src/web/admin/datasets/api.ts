import { POST } from '@/service/common/request';
import { RequestPaging } from '@/types';
import type { GetDatasetsResponseData } from '@/pages/api/admin/routes/datasets/getDatasets';

export const getDatasets = (data: RequestPaging) =>
  POST<GetDatasetsResponseData>('/admin/routes/datasets/getDatasets', data);
