export type AuthCodeSchema = {
  username: string;
  code: string;
  type: 'register' | 'findPassword';
  expiredTime: number;
};
