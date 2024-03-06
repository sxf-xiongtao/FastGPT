import { POST } from '@/service/common/request';

export const getTeams = (data: any) => POST('/admin/routes/teams/getTeams', data);
