import { addHours } from 'date-fns';

export const getDashboardDataStartTime = (day: number) => addHours(new Date(), -day * 24 + 8);
