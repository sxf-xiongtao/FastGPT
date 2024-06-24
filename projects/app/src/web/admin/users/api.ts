import { POST } from '@/service/common/request';

export const getUsers = (data: any) => POST('/admin/routes/users/getUsers', data);

export const getTeams = (data: any) => POST('/admin/routes/teams/getTeams', data);

export const getPlans = (data: any) => POST('/admin/routes/plans/getPlans', data);
