import type { AdminGetAPPResponse } from '@/pages/api/admin/routes/apps/getApps';
import { POST } from '@/service/common/request';

export const getApps = (data: any) => POST<AdminGetAPPResponse>('/admin/routes/apps/getApps', data);
