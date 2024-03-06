import { POST } from '@/service/common/request';

export const getApps = (data: any) => POST('/admin/routes/apps/getApps', data);
