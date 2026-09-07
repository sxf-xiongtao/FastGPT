import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { authOutLinkValid } from '@fastgpt/service/support/permission/publish/authLink';
import { authOutLinkInit, authOutLinkLimit } from '@fastgpt/service/support/outLink/runtime/auth';
import { authOutLink, authOutLinkChatStart } from '@/service/support/permission/auth/outLink';
import { authApp } from '@fastgpt/service/support/permission/app/auth';
import { ReadPermissionVal } from '@fastgpt/global/support/permission/constant';
import {
  OutLinkCreateBodySchema,
  ShareOutLinkEditSchema
} from '@fastgpt/global/openapi/support/outLink/api';
import { PublishChannelEnum } from '@fastgpt/global/support/outLink/constant';

vi.mock('@fastgpt/service/support/permission/publish/authLink', () => ({
  authOutLinkValid: vi.fn()
}));

vi.mock('@fastgpt/service/support/outLink/runtime/auth', () => ({
  authOutLinkInit: vi.fn(),
  authOutLinkLimit: vi.fn()
}));

vi.mock('@fastgpt/service/support/permission/app/auth', () => ({
  authApp: vi.fn()
}));

const outLinkConfig = {
  _id: 'out-link-id',
  appId: 'app-id',
  name: 'Public link',
  teamId: 'team-id',
  tmbId: 'member-id',
  showCite: true,
  showRunningStatus: true,
  showSkillReferences: false,
  showFullText: false,
  canDownloadSource: false,
  allowAnonymous: true,
  limit: {
    QPM: 10,
    maxUsagePoints: -1
  }
};

const originalFeConfigs = global.feConfigs;

describe('authOutLink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authOutLinkValid).mockResolvedValue({
      outLinkConfig,
      appId: 'app-id'
    } as any);
    vi.mocked(authOutLinkInit).mockResolvedValue({ uid: 'verified-uid' });
  });

  it('keeps anonymous links accessible without a login', async () => {
    const result = await authOutLink({
      shareId: 'share-id',
      outLinkUid: 'raw-uid',
      req: {} as any
    });

    expect(authApp).not.toHaveBeenCalled();
    expect(authOutLinkInit).toHaveBeenCalledWith({
      outLinkUid: 'raw-uid',
      tokenUrl: undefined
    });
    expect(result.uid).toBe('verified-uid');
  });

  it('requires app read permission for protected links', async () => {
    vi.mocked(authOutLinkValid).mockResolvedValue({
      outLinkConfig: { ...outLinkConfig, allowAnonymous: false },
      appId: 'app-id'
    } as any);

    await authOutLink({
      shareId: 'share-id',
      outLinkUid: 'raw-uid',
      req: {} as any
    });

    expect(authApp).toHaveBeenCalledWith({
      req: {},
      authToken: true,
      appId: 'app-id',
      per: ReadPermissionVal
    });
  });

  it('stops before outlink initialization when app permission is denied', async () => {
    vi.mocked(authOutLinkValid).mockResolvedValue({
      outLinkConfig: { ...outLinkConfig, allowAnonymous: false },
      appId: 'app-id'
    } as any);
    vi.mocked(authApp).mockRejectedValueOnce(new Error('unauthorized'));

    await expect(
      authOutLink({
        shareId: 'share-id',
        outLinkUid: 'raw-uid',
        req: {} as any
      })
    ).rejects.toThrow('unauthorized');

    expect(authOutLinkInit).not.toHaveBeenCalled();
  });
});

describe('authOutLinkChatStart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authOutLinkValid).mockResolvedValue({
      outLinkConfig,
      appId: 'app-id'
    } as any);
    vi.mocked(authOutLinkLimit).mockResolvedValue({ uid: 'verified-uid' });
  });

  afterAll(() => {
    global.feConfigs = originalFeConfigs;
  });

  it('商业版在 FastGPT 进程内执行外链校验', async () => {
    global.feConfigs = { ...global.feConfigs, isPlus: true } as any;

    const result = await authOutLinkChatStart({
      shareId: 'share-id',
      outLinkUid: 'raw-uid',
      question: 'hello',
      req: {} as any
    });

    expect(authOutLinkLimit).toHaveBeenCalledWith({
      outLink: outLinkConfig,
      outLinkUid: 'raw-uid',
      question: 'hello'
    });
    expect(result.uid).toBe('verified-uid');
  });

  it('社区版保持历史行为，不执行商业版外链校验', async () => {
    global.feConfigs = { ...global.feConfigs, isPlus: false } as any;

    const result = await authOutLinkChatStart({
      shareId: 'share-id',
      outLinkUid: 'raw-uid',
      question: 'hello',
      req: {} as any
    });

    expect(authOutLinkLimit).not.toHaveBeenCalled();
    expect(authApp).not.toHaveBeenCalled();
    expect(result.uid).toBe('raw-uid');
  });

  it('requires app read permission when anonymous access is disabled', async () => {
    global.feConfigs = { ...global.feConfigs, isPlus: false } as any;
    vi.mocked(authOutLinkValid).mockResolvedValue({
      outLinkConfig: { ...outLinkConfig, allowAnonymous: false },
      appId: 'app-id'
    } as any);

    await authOutLinkChatStart({
      shareId: 'share-id',
      outLinkUid: 'raw-uid',
      question: 'hello',
      req: {} as any
    });

    expect(authApp).toHaveBeenCalledWith({
      req: {},
      authToken: true,
      appId: 'app-id',
      per: ReadPermissionVal
    });
  });
});

describe('share outlink input schemas', () => {
  const input = {
    appId: '68ad85a7463006c963799a05',
    name: 'link'
  };

  it('requires share links to pass allowAnonymous explicitly', () => {
    expect(ShareOutLinkEditSchema.safeParse({ name: 'link' }).success).toBe(false);
    expect(
      OutLinkCreateBodySchema.safeParse({ ...input, type: PublishChannelEnum.share }).success
    ).toBe(false);
    expect(
      OutLinkCreateBodySchema.safeParse({
        ...input,
        type: PublishChannelEnum.share,
        allowAnonymous: false
      }).success
    ).toBe(true);
  });

  it('does not expose allowAnonymous to non-share channels', () => {
    const result = OutLinkCreateBodySchema.parse({
      ...input,
      type: PublishChannelEnum.feishu,
      allowAnonymous: false
    });

    expect(result).not.toHaveProperty('allowAnonymous');
  });
});
