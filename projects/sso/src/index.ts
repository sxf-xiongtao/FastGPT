import express from 'express';
import { getErrText } from './utils';

import { test_getUserInfo, test_redirectFn } from './provider/test';
import { leapmotor_getUserInfo, leapmotor_redirectFn } from './provider/leapmotor';
import { aecc_callbackFn, aecc_getUserInfo, aecc_redirectFn } from './provider/aecc';
import { initGlobalStore } from 'global';
import { CallbackFn, GetUserInfoFn, RedirectFn } from 'type';

const providerMap: {
  [key: string]: {
    getUserInfo: GetUserInfoFn;
    redirectFn: RedirectFn;
    callbackFn?: CallbackFn;
  };
} = {
  test: {
    redirectFn: test_redirectFn,
    getUserInfo: test_getUserInfo
  },
  leapmotor: {
    redirectFn: leapmotor_redirectFn,
    getUserInfo: leapmotor_getUserInfo
  },
  aecc: {
    redirectFn: aecc_redirectFn,
    callbackFn: aecc_callbackFn,
    getUserInfo: aecc_getUserInfo
  }
};

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3030;

function getProvider() {
  const provider = process.env.SSO_PROVIDER as keyof typeof providerMap;
  if (!providerMap[provider]) {
    return false;
  }
  return providerMap[provider];
}

// 接收重定向请求
app.get('/login/oauth/authorize', async (req, res) => {
  const provider = getProvider();
  if (!provider) {
    return res.status(400).json({ error: 'provider is required' });
  }
  const { redirectFn } = provider;

  const { redirect_uri, state } = req.query as {
    redirect_uri: string;
    state: string;
  };

  if (!redirect_uri) {
    return res.status(400).json({ error: 'redirect_uri is required' });
  }

  try {
    const { redirectUrl } = await redirectFn({ req, redirect_uri, state });

    res.redirect(redirectUrl);
  } catch (error) {
    res.status(500).json({
      message: getErrText(error)
    });
  }
});

app.get('/login/oauth/callback', async (req, res) => {
  const privider = getProvider();
  if (!privider) {
    return res.status(400).json({ error: 'provider is required' });
  }
  const { callbackFn } = privider;
  if (!callbackFn) {
    return res.status(400).json({ error: 'callbackFn is required' });
  }

  const { redirect_uri } = req.query as { redirect_uri: string };
  if (!redirect_uri) {
    return res.status(400).json({ error: 'redirect_uri is required' });
  }

  try {
    const { redirectUrl } = await callbackFn({ req, redirect_uri });
    res.redirect(redirectUrl);
  } catch (error) {
    res.status(500).json({
      message: getErrText(error)
    });
  }
});

// 获取用户身份信息
app.get('/login/oauth/access_token', async (req, res) => {
  const provider = getProvider();
  if (!provider) {
    return res.status(400).json({ error: 'provider is required' });
  }
  const { getUserInfo } = provider;

  try {
    const { code } = req.query as { code: string };

    if (!code) {
      throw new Error('code is required');
    }

    const userInfo = await getUserInfo(code);

    // 返回用户信息
    res.json({
      success: true,
      message: '',
      ...userInfo
    });
  } catch (error: any) {
    res.json({
      success: false,
      message: getErrText(error)
    });
  }
});

app.listen(PORT, () => {
  console.log('Provider', process.env.SSO_PROVIDER);

  console.log(`SSO server is running on http://localhost:${PORT}`);

  initGlobalStore();
});
