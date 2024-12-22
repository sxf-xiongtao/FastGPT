import { POST } from '@/service/common/request';
import type { GetPaysBody, GetPaysResponse } from '@/pages/api/admin/routes/pays/getPays';

export const getPays = (data: GetPaysBody) =>
  POST<GetPaysResponse>('/admin/routes/pays/getPays', data);
