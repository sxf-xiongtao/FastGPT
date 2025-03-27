import axios from 'axios';
import type { GetUserInfoFn, RedirectFn } from 'type';

const OAuth2AuthorizeURL = process.env.OAUTH2_AUTHORIZE_URL || '';
const OAuth2TokenURL = process.env.OAUTH2_TOKEN_URL || '';
const OAuth2UserInfoURL = process.env.OAUTH2_USER_INFO_URL || '';
const OAuth2UsernameMap = process.env.OAUTH2_USERNAME_MAP || '';
const OAuth2AvatarMap = process.env.OAUTH2_AVATAR_MAP || '';
const OAuth2MemberNameMap = process.env.OAUTH2_MEMBER_NAME_MAP || '';
const OAuth2ContactMap = process.env.OAUTH2_CONTACT_MAP || '';

export const oauth2_redirectFn: RedirectFn = async ({ redirect_uri }) => {
  // parse the redirect_uri
  const url = new URL(OAuth2AuthorizeURL);
  url.searchParams.set('redirect_uri', redirect_uri);
  return {
    redirectUrl: url.toString()
  };
};

export const oauth2_getUserInfo: GetUserInfoFn = async (code: string) => {
  const {
    data: { access_token }
  } = await axios.get(OAuth2TokenURL, {
    params: {
      code
    }
  });
  const { data } = await axios.get(OAuth2UserInfoURL, {
    params: {
      access_token
    }
  });
  const username = data[OAuth2UsernameMap];
  const avatar = data[OAuth2AvatarMap];
  const memberName = data[OAuth2MemberNameMap];
  const contact = data[OAuth2ContactMap];

  return {
    username,
    avatar,
    memberName,
    contact
  };
};
