/**
 * Resolves the identity used by a shared chat.
 * Anonymous identities stay in local storage, while protected links use the current member ID.
 */
export const getShareChatOutLinkUid = ({
  allowAnonymous,
  authToken,
  customUid,
  anonymousUid,
  loginUid
}: {
  allowAnonymous: boolean;
  authToken?: string;
  customUid?: string;
  anonymousUid?: string;
  loginUid?: string;
}) => authToken || customUid || (allowAnonymous ? anonymousUid : loginUid) || '';
