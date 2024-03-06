import { POST } from '@/service/common/request';

export const getDatasets = (data: any) => POST('/admin/routes/datasets/getDatasets', data);
