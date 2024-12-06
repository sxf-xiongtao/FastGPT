import { Request } from 'express';
export type RedirectFn = (data: {
  req: Request;
  redirect_uri: string;
  state: string;
}) => Promise<{ redirectUrl: string }>;

export type GetUserInfoFn = (code: string) => Promise<{
  username: string;
  avatar: string;
  contact: string;
}>;

export type CallbackFn = ({ req: Request, redirect_uri }) => Promise<{ redirectUrl }>;
