import type { AdminGetAPPResponse } from '@/pages/api/admin/routes/apps/getApps';
import { POST } from '@/service/common/request';
import { PaginationProps } from '@fastgpt/web/common/fetch/type';

export const getApps = (data: PaginationProps) =>
  POST<AdminGetAPPResponse>('/admin/routes/apps/getApps', data);
