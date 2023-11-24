export type FastLoginAuthResponse = {
  success: boolean;
  message: string;
  data: {
    username: string;
    avatar?: string;
  };
};
