import { describe, expect, it } from 'vitest';
import { getShareChatOutLinkUid } from '@/web/core/chat/utils/shareChat';

describe('getShareChatOutLinkUid', () => {
  it('uses the anonymous identity when anonymous access is enabled', () => {
    expect(
      getShareChatOutLinkUid({
        allowAnonymous: true,
        anonymousUid: 'shareChat-user',
        loginUid: 'member-id'
      })
    ).toBe('shareChat-user');
  });

  it('uses the member identity when anonymous access is disabled', () => {
    expect(
      getShareChatOutLinkUid({
        allowAnonymous: false,
        anonymousUid: 'shareChat-user',
        loginUid: 'member-id'
      })
    ).toBe('member-id');
  });

  it('keeps external authentication identities at the highest priority', () => {
    expect(
      getShareChatOutLinkUid({
        allowAnonymous: false,
        authToken: 'auth-token',
        customUid: 'custom-user',
        loginUid: 'member-id'
      })
    ).toBe('auth-token');
  });

  it('does not fall back to an anonymous identity before login succeeds', () => {
    expect(
      getShareChatOutLinkUid({
        allowAnonymous: false,
        anonymousUid: 'shareChat-user'
      })
    ).toBe('');
  });
});
