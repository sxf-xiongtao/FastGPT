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

export type CallbackFn = (data: { req: Request }) => Promise<{ redirectUrl }>;

export type AssertFn = (data: {
  SAMLResponse: string;
  RelayState: string;
}) => Promise<{ redirectUrl: string }>;
export type GetMetaDataFn = () => Promise<string>;
