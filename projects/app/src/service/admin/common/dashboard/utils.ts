import { addHours } from 'date-fns';

export const getDashboardDataStartTime = () => addHours(new Date(), -90 * 24 + 8);
