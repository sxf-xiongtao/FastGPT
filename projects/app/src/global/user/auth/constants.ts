import { TestSSOHandler } from '@/service/support/user/sso/test';
import { ApiRequestProps } from '@fastgpt/service/type/next';

export enum SSOEnum {
  Test = 'test' // just for testing which should be never used in prod
} // Add new SSO source here

export type SSOHandlerReturnType = {
  username: string;
  avatarURL?: string;
  email?: string; // optional
};
export type SSOHandler = (req: ApiRequestProps) => Promise<SSOHandlerReturnType>; // it could be imported from other files

export const SSOConfig: {
  [key in SSOEnum]: {
    handler: SSOHandler;
  };
} = {
  [SSOEnum.Test]: {
    handler: TestSSOHandler
  }
};
