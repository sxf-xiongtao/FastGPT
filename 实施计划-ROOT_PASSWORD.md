# root 密码强制修改与初始化调整 —— 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 root 账号密码从「环境变量托管、改密需重启」改为「固定初始口令 `123456` + 首次登录强制修改 + 页面自助修改 + 容器脚本兜底重置」。

**Architecture:** 新增 `mustChangePassword` 字段作为唯一判定依据；初始化改为「已存在则完全不碰 password，仅在仍是弱口令时回填标记」；**强制改密走独立端点** `password/forceUpdate`（服务端自行校验旧密码 + 标记，不依赖 pro），`password/update` 保持单路径不变；前端接入既有的 `PostLoginActionOrchestrator` 强制动作编排；移除 `DEFAULT_ROOT_PSW` 环境变量并同步部署脚本与文档。

---

## ⚠️ 实施定稿偏离（执行前必读）

本计划是**初稿**。执行过程中需求发生变更，以下三处**以 [设计文档-ROOT_PASSWORD.md](设计文档-ROOT_PASSWORD.md) 的 §3.1 / §3.4 / §3.5 为最终准**，本文件对应章节已过期：

| 章节 | 初稿写法 | 定稿做法 |
| --- | --- | --- |
| Task 4 | 在 `update.ts` 内加 `if/else` 双路径，`passwordChangeSession` 改可选 | **拆出独立端点** `password/forceUpdate`；`update.ts` 保持单路径、`passwordChangeSession` **仍必填**（仅去掉 `isRoot` 拦截） |
| Task 6 | 强制改密弹窗只要「新密码 + 确认密码」两个输入 | 改为**「旧密码 + 新密码 + 确认密码」**三个输入，调用 `forceUpdatePassword()` |
| Task 1 Step 4 | `mustChangePassword: z.boolean().optional()` | 不变（initial 定稿即为此），但设计文档曾误写为必填，已修正 |

另：Task 8 的「抽出共用 `PasswordForm`」**未落地**，新弹窗自带独立表单（原因见设计文档 §3.4）。

**Tech Stack:** TypeScript、Next.js（pages router）、React 18、Chakra UI、mongoose 8、zod、vitest、pnpm workspace + turbo。

**设计依据：** [设计文档-ROOT_PASSWORD.md](设计文档-ROOT_PASSWORD.md)（需求 FR-1..FR-8、非功能约束 NFR-1..NFR-5、风险 R1..R12、越权分析 §3.9）

---

## Conventions（从代码库学到的约定）

- **语言**：注释与文档一律中文；标识符英文。
- **命名**：函数/变量 camelCase；类型/组件/zod schema PascalCase 且带 `Schema` 后缀；常量 UPPER_SNAKE_CASE；枚举 `XxxEnum` + 字符串字面量值。
- **导入**：跨包用 `@fastgpt/service/...`、`@fastgpt/global/...`；应用内用 `@/...`；测试工具用 `@test/...`。
- **注释**：导出函数上方写 `/** ... */` 中文块注释，重点解释**为什么**而不是做了什么。
- **错误**：`throw new UserError(UserErrEnum.xxx)`；错误码集中在 `packages/global/common/error/code/*.ts`。
- **日志**：`getLogger(LogCategories.X)`，结构化字段，不用字符串拼接。
- **测试**：vitest，`describe/it/expect`；跨模块 mock 用 `vi.mock` + `vi.hoisted`；需要真实 Mongo 的用 `MongoUser.create` 直接造数（见 `projects/app/test/api/support/user/account/password/update.test.ts`）。
- **API**：`NextAPI(handler)` 包裹；入参一律过 `parseApiInput({ req, bodySchema })`（内部走 `schema.parse()`，`.strict()` 生效）。
- **React**：函数式组件 + `'use client'`；跨请求数据用 `useRequest`/zustand；文案一律走 `useTranslation`/`useSafeTranslation`。

## 命令

| 目的 | 命令 |
| --- | --- |
| 跑 service 包单测 | `pnpm test:service` |
| 跑 app 包单测 | `pnpm test:app` |
| 跑单个文件 | `pnpm --dir packages/service exec vitest run -c vitest.config.ts test/support/user/systemUser.test.ts` |
| 类型检查 | `pnpm --filter @fastgpt/app exec tsc --noEmit` |
| lint | `pnpm lint` |

## 文件结构

**新建**

| 文件 | 职责 |
| --- | --- |
| `projects/app/src/components/support/user/safe/ForceChangePasswordModal.tsx` | 不可关闭的「新密码 + 确认密码」强制改密弹窗 |
| `projects/app/scripts/reset-root-password.mjs` | 容器内直连 Mongo 的密码重置脚本（纯 ESM） |
| `packages/service/test/support/user/controller.test.ts` | `getUserDetail` 下发 `mustChangePassword` 的集成测试 |
| `packages/service/test/support/user/account/password/forceUpdate.test.ts` | `forceUpdatePassword` 服务函数测试 |

**修改**

| 文件 | 改动 |
| --- | --- |
| `packages/service/support/user/schema.ts` | 新增 `mustChangePassword` 字段 |
| `packages/global/support/user/type.ts` | `UserModelSchema` + `UserSchema` 各加一字段 |
| `packages/service/support/user/controller.ts` | `getUserDetail` 返回新字段 |
| `packages/service/support/user/systemUser.ts` | 删除密码覆盖；新增弱口令回填 |
| `projects/app/src/instrumentation-node.ts` | `initSystemUser()` 去参 |
| `packages/service/support/user/account/password/service.ts` | 新增 `forceUpdatePassword` |
| `projects/app/src/pages/api/support/user/account/password/update.ts` | 去掉 `isRoot` 拦截；新增强制改密分支 |
| `packages/global/openapi/support/user/account/password/api.ts` | `passwordChangeSession` 改可选 |
| `projects/app/src/web/support/user/account/password/api.ts` | `updatePassword` 签名放宽 |
| `projects/app/src/components/Layout/postLoginAction.ts` | 新增 `forcePasswordChange` 动作与门控 |
| `projects/app/src/components/Layout/PostLoginActionOrchestrator.tsx` | 接入新动作与 `mustChangePassword` |
| `projects/app/src/pages/account/info/index.tsx` | 去掉 root 短路 |
| `projects/app/src/env.ts`、`projects/app/.env.template` | 删除 `DEFAULT_ROOT_PSW` |
| `deploy/version/main/docker-compose.template.yml`、`document/public/deploy/docker/main/{cn,global}/docker-compose.*.yml`（12 个） | 删除 root psw 锚点 |
| `document/public/deploy/install.sh`、`document/public/deploy/SKILL.md` | 固定初始密码 + 提示强制改密 |
| `document/content/self-host/**`（`config/env.mdx`、`troubleshooting/faq.mdx`、`deploy/docker.mdx` 及各 `.en`） | 文档同步 |
| `packages/web/i18n/{zh-CN,zh-Hant,en,ko-KR}/{common,login}.json` | 新增强制改密文案；更新 root 登录占位符 |
| `projects/app/Dockerfile` | COPY 脚本 + 构建期依赖断言 |

---

## Phase 1 —— 服务端契约与数据模型

> 本阶段结束后 `mustChangePassword` 已可端到端存取，但还没有任何地方写入它，属安全中间态。

### Task 1: 打通 `mustChangePassword` 字段

**Files:**
- Modify: `packages/service/support/user/schema.ts`
- Modify: `packages/global/support/user/type.ts`
- Modify: `packages/service/support/user/controller.ts`
- Test: `packages/service/test/support/user/controller.test.ts`（新建）

- [ ] **Step 1: 写失败测试**

新建 `packages/service/test/support/user/controller.test.ts`：

```ts
import { describe, expect, it, vi } from 'vitest';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { getUserDetail } from '@fastgpt/service/support/user/controller';
import { createDefaultTeam } from '@fastgpt/service/support/user/team/controller';

// 本测试需要真实的 mongoSessionRun 来跑事务，其余测试文件对它的全局 mock 在这里要被撤销。
vi.unmock(import('@fastgpt/service/common/mongo/sessionRun'));

describe('getUserDetail mustChangePassword', () => {
  const setupUser = async ({
    username,
    mustChangePassword
  }: {
    username: string;
    mustChangePassword?: boolean;
  }) => {
    const user = await MongoUser.create({
      username,
      password: 'password',
      ...(mustChangePassword === undefined ? {} : { mustChangePassword })
    });
    await mongoSessionRun((session) =>
      createDefaultTeam({ userId: String(user._id), session })
    );
    return user;
  };

  it('returns true when the flag is set', async () => {
    const user = await setupUser({ username: 'detail-flag-on', mustChangePassword: true });

    const detail = await getUserDetail({ userId: String(user._id) });

    expect(detail.mustChangePassword).toBe(true);
  });

  it('returns false when the flag is absent or false', async () => {
    const userWithoutFlag = await setupUser({ username: 'detail-flag-absent' });
    const userWithFalse = await setupUser({
      username: 'detail-flag-off',
      mustChangePassword: false
    });

    expect((await getUserDetail({ userId: String(userWithoutFlag._id) })).mustChangePassword).toBe(
      false
    );
    expect((await getUserDetail({ userId: String(userWithFalse._id) })).mustChangePassword).toBe(
      false
    );
  });
});
```

> 注意：文件顶部需要 `import { vi } from 'vitest'`。上面 `vi.unmock` 的写法与 `packages/service/test/support/user/team/controller.test.ts` 一致——该测试需要真实的 `mongoSessionRun`。
- [ ] **Step 2: 运行测试，确认失败**

```bash
pnpm --dir packages/service exec vitest run -c vitest.config.ts test/support/user/controller.test.ts
```

预期：FAIL —— `detail.mustChangePassword` 为 `undefined`，不等于 `true`。

- [ ] **Step 3: 新增 schema 字段**

`packages/service/support/user/schema.ts`，在 `passwordUpdateTime` 之后插入：

```ts
  passwordUpdateTime: Date,
  /**
   * 标记账号必须先修改密码才能正常使用。
   * 字段是通用能力，当前只有内置 root 会在初始化时被置位（见 systemUser.ts）。
   */
  mustChangePassword: {
    type: Boolean,
    default: false
  },
```

- [ ] **Step 4: 新增两处类型字段**

`packages/global/support/user/type.ts`，`UserModelSchema`（`type`，第 18 行附近）中 `passwordUpdateTime?: Date;` 之后插入：

```ts
  mustChangePassword?: boolean;
```

同一文件，zod 的 `UserSchema`（第 37 行附近）中 `passwordAvailable: z.boolean().optional()` 之后插入：

```ts
  mustChangePassword: z.boolean().optional()
```

> **为什么用 `.optional()`**：`getUserDetail` 是唯一的 `UserType` 构造点，但既有测试夹具（如 `packages/global/test/openapi/support/user/account/login/api.test.ts`）大量手写 `UserType` 字面量。设为必填会让它们全部编译失败，且与同类的 `passwordAvailable` 处理方式不一致。前端一律用 `=== true` 读取。

- [ ] **Step 5: `getUserDetail` 下发字段**

`packages/service/support/user/controller.ts`，返回对象末尾：

```ts
    hasPassword: hasStoredPassword(user.password),
    passwordAvailable: getUserPasswordAvailability(user.username),
    mustChangePassword: user.mustChangePassword === true
```

> `=== true` 而不是直接读：存量文档缺该字段时为 `undefined`，显式收敛成布尔值，避免前端拿到 `undefined` 后依赖 falsy 判断。

- [ ] **Step 6: 运行测试，确认通过**

```bash
pnpm --dir packages/service exec vitest run -c vitest.config.ts test/support/user/controller.test.ts
```

预期：PASS（2 个用例）。

- [ ] **Step 7: 跑全量 service 测试，确认没有回归**

```bash
pnpm test:service
```

预期：全部 PASS。若有既有用例因 `UserSchema` 新字段失败，按 Step 4 的说明补 `.optional()` 语义（不要改成必填）。

- [ ] **Step 8: 提交**

```bash
git add packages/service/support/user/schema.ts packages/global/support/user/type.ts packages/service/support/user/controller.ts packages/service/test/support/user/controller.test.ts
git commit -m "feat(user): add mustChangePassword field to user model"
```

---

### Task 2: 初始化不再覆盖 root 密码 + 弱口令回填

**Files:**
- Modify: `packages/service/support/user/systemUser.ts`
- Modify: `projects/app/src/instrumentation-node.ts:183`
- Test: `packages/service/test/support/user/systemUser.test.ts`

- [ ] **Step 1: 写失败测试**

`packages/service/test/support/user/systemUser.test.ts` 需要先扩 mock。把 `vi.hoisted` 块（第 5-23 行）改为：

```ts
const {
  mockUserFindOne,
  mockUserFind,
  mockUserCreate,
  mockUserExists,
  mockUserUpdateOne,
  mockTeamMemberFindOne,
  mockTeamMemberFind,
  mockTeamMemberCreate,
  mockCreateDefaultTeam,
  mockWithLease
} = vi.hoisted(() => ({
  mockUserFindOne: vi.fn(),
  mockUserFind: vi.fn(),
  mockUserCreate: vi.fn(),
  mockUserExists: vi.fn(),
  mockUserUpdateOne: vi.fn(),
  mockTeamMemberFindOne: vi.fn(),
  mockTeamMemberFind: vi.fn(),
  mockTeamMemberCreate: vi.fn(),
  mockCreateDefaultTeam: vi.fn(),
  mockWithLease: vi.fn()
}));
```

对应的 mock 声明（第 25-31 行）改为：

```ts
vi.mock('@fastgpt/service/support/user/schema', () => ({
  MongoUser: {
    findOne: mockUserFindOne,
    find: mockUserFind,
    create: mockUserCreate,
    exists: mockUserExists,
    updateOne: mockUserUpdateOne
  }
}));
```

在 `beforeEach`（第 75-87 行）中补充默认 mock：

```ts
    mockUserExists.mockReturnValue({ session: vi.fn().mockResolvedValue(false) });
    mockUserUpdateOne.mockReturnValue({ session: vi.fn().mockResolvedValue({ matchedCount: 1 }) });
```

> 说明：`MongoUser.exists(...)` 返回 Query，生产代码会调 `.session(session)` 再 await。mock 必须返回带 `session` 的对象，且 `session()` 本身可 await。

然后在 `describe` 内追加 4 个用例：

```ts
  it('does not write password when root already exists', async () => {
    mutableServiceEnv.AGENT_USERS = undefined;
    mockUserFindOne.mockResolvedValue({ _id: 'root-id' });

    await initSystemUser();

    expect(mockUserCreate).not.toHaveBeenCalled();
    expect(mockUserUpdateOne).not.toHaveBeenCalled();
  });

  it('backfills mustChangePassword when root still uses a legacy weak password', async () => {
    mutableServiceEnv.AGENT_USERS = undefined;
    mockUserFindOne.mockResolvedValue({ _id: 'root-id' });
    mockUserExists.mockReturnValue({ session: vi.fn().mockResolvedValue(true) });

    await initSystemUser();

    expect(mockUserExists).toHaveBeenCalledWith({
      _id: 'root-id',
      password: { $in: [hashStr('1234'), hashStr('123456')] }
    });
    expect(mockUserUpdateOne).toHaveBeenCalledWith(
      { _id: 'root-id' },
      { $set: { mustChangePassword: true } },
      expect.anything()
    );
  });

  it('keeps root untouched when the existing password is not a legacy weak password', async () => {
    mutableServiceEnv.AGENT_USERS = undefined;
    mockUserFindOne.mockResolvedValue({ _id: 'root-id' });
    mockUserExists.mockReturnValue({ session: vi.fn().mockResolvedValue(false) });

    await initSystemUser();

    expect(mockUserUpdateOne).not.toHaveBeenCalled();
  });

  it('creates root with the fixed default password and the change flag', async () => {
    mutableServiceEnv.AGENT_USERS = undefined;
    mockUserFindOne.mockResolvedValue(null);
    mockUserCreate.mockResolvedValue([{ _id: 'root-id' }]);

    await initSystemUser();

    expect(mockUserCreate).toHaveBeenCalledWith(
      [
        {
          username: 'root',
          password: hashStr('123456'),
          mustChangePassword: true
        }
      ],
      { session: expect.anything(), ordered: true }
    );
  });
```

同时给测试文件补上 `hashStr` 的导入：

```ts
import { hashStr } from '@fastgpt/global/common/string/tools';
```

> **重要**：既有第一个用例 `initializes root and sets empty agent cache when AGENT_USERS is empty` 依赖 `mockUserFindOne.mockResolvedValue(null)`，本轮保持不动。

- [ ] **Step 2: 运行测试，确认失败**

```bash
pnpm --dir packages/service exec vitest run -c vitest.config.ts test/support/user/systemUser.test.ts
```

预期：FAIL —— `does not write password when root already exists` 报 `mockUserUpdateOne` 被调用过（当前实现会覆盖密码）。

- [ ] **Step 3: 改常量与初始化逻辑**

`packages/service/support/user/systemUser.ts`，在 `SYSTEM_USER_INIT_LEASE_KEY` 附近（第 15-18 行常量区）新增：

```ts
/** root 初始密码固定值。不再通过环境变量配置。 */
const DEFAULT_ROOT_PASSWORD = '123456';

/**
 * 需要回填强制改密标记的历史弱口令。
 *
 * `'1234'` 不是笔误：compose 锚点 `x-default-root-psw` 的取值一直是 `'1234'`，
 * 而 env.ts 的默认值是 `'123456'`。直接使用 compose 模板部署的存量实例，
 * root 密码是 `'1234'` 而不是 `'123456'`，只比对新默认值会漏掉这批弱口令部署。
 *
 * 有意不含 install.sh 随机生成的密码：随机强口令不属于弱口令，强制改密是打扰。
 */
const LEGACY_WEAK_ROOT_PASSWORDS = ['1234', '123456'] as const;
```

把 `executeSystemUserCreation` 的签名与 root 分支替换为：

```ts
/** 实际执行用户创建的内部逻辑（在获取到 lease 后由胜出者执行）。 */
const executeSystemUserCreation = async (): Promise<void> => {
  const agentUsernames = getConfiguredAgentUsernames();
  const defaultAgentPassword = serviceEnv.DEFAULT_AGENT_PSW;
  if (agentUsernames.length > 0 && !defaultAgentPassword) {
    throw new Error('DEFAULT_AGENT_PSW is required when AGENT_USERS is configured');
  }

  const { agentUserTmbIds } = await mongoSessionRun(async (session) => {
    // 1. 初始化 root 用户与默认团队
    const rootUser = await MongoUser.findOne({ username: 'root' }, undefined, { session });
    const rootUId = await (async () => {
      if (rootUser) {
        // root 已存在时完全不写 password 字段：密码由运行期维护（页面改密或重置脚本）。
        // 仅当密码仍是历史弱口令时回填强制改密标记；该判定幂等，天然覆盖存量部署。
        const isStillWeakPassword = await MongoUser.exists({
          _id: rootUser._id,
          password: { $in: LEGACY_WEAK_ROOT_PASSWORDS.map((psw) => hashStr(psw)) }
        }).session(session);
        if (isStillWeakPassword) {
          await MongoUser.updateOne(
            { _id: rootUser._id },
            { $set: { mustChangePassword: true } },
            { session }
          );
        }
        return rootUser._id;
      } else {
        const [{ _id }] = await MongoUser.create(
          [
            {
              username: 'root',
              password: hashStr(DEFAULT_ROOT_PASSWORD),
              mustChangePassword: true
            }
          ],
          { session, ordered: true }
        );
        return _id;
      }
    })();
```

> 后续的 `createDefaultTeam` 及其余代码**保持原样不动**。

- [ ] **Step 4: 同步日志字段**

把 `executeSystemUserCreation` 末尾的日志（原第 159-163 行）替换为：

```ts
  global.agentUserTmbIds = agentUserTmbIds;

  logger.info('Root and agent users initialized', {
    username: 'root',
    agentUserCount: agentUsernames.length
  });
```

> 必须删掉 `fromEnvPassword` 字段——它引用的 `defaultRootPassword` 参数在 Step 3 已不存在，保留会直接编译失败。弱口令的预警位改由「创建时的 `mustChangePassword: true`」承担，不再需要该日志字段。

- [ ] **Step 5: 删除 `initSystemUser` 的参数**

`packages/service/support/user/systemUser.ts` 底部：

```ts
/**
 * 初始化系统用户（包含 root 超级管理员与内置 agent 开发用户）。
 *
 * 跨节点串行保证：
 * 1. 多个节点并发启动时竞争 Redis 分布式租约（LeaseCache）；
 * 2. 租约持有者在执行初始化期间每 10 秒自动续期，TTL 为 60 秒；
 * 3. 未获得租约的节点（抛出 RedisLeaseUnavailableError）进入轮询等待；
 * 4. 租约释放后，等待节点直接从数据库同步最新数据至全局缓存，保证全节点状态一致。
 */
export const initSystemUser = async (): Promise<void> => {
  while (true) {
    try {
      await systemUserLease.withLease({
        key: SYSTEM_USER_INIT_LEASE_KEY,
        label: 'system user initialization',
        ttlMs: LEASE_TTL_MS,
        renewIntervalMs: LEASE_RENEW_INTERVAL_MS,
        fn: async () => {
          await executeSystemUserCreation();
        }
      });
      return;
    } catch (error) {
      // 被其他节点抢占了 lease，需要等待。
      if (error instanceof RedisLeaseUnavailableError) {
        logger.info('Waiting for system user initialization lease held by another node...');
        await delay(WAIT_POLL_INTERVAL_MS);
        continue;
      }

      logger.error('Root or agent users initialization failed', { error });
      throw new Error('Root or agent users initialization failed', { cause: error });
    }
  }
};
```

- [ ] **Step 6: 更新调用点**

`projects/app/src/instrumentation-node.ts`（原第 183 行）：

```ts
      action: () => initSystemUser(),
```

- [ ] **Step 7: 运行测试，确认通过**

```bash
pnpm --dir packages/service exec vitest run -c vitest.config.ts test/support/user/systemUser.test.ts
```

预期：PASS（原 4 个 + 新增 4 个 = 8 个用例）。

- [ ] **Step 8: 类型检查**

```bash
pnpm --filter @fastgpt/app exec tsc --noEmit
```

预期：无错误。若报 `initSystemUser` 参数不匹配，说明 Step 6 未生效。

- [ ] **Step 9: 提交**

```bash
git add packages/service/support/user/systemUser.ts projects/app/src/instrumentation-node.ts packages/service/test/support/user/systemUser.test.ts
git commit -m "fix(user): stop resetting root password on startup and backfill weak-password flag"
```

---

### Task 3: 新增 `forceUpdatePassword` 服务函数

**Files:**
- Modify: `packages/service/support/user/account/password/service.ts`
- Test: `packages/service/test/support/user/account/password/forceUpdate.test.ts`（新建）

- [ ] **Step 1: 写失败测试**

新建 `packages/service/test/support/user/account/password/forceUpdate.test.ts`：

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { hashStr } from '@fastgpt/global/common/string/tools';
import { UserErrEnum } from '@fastgpt/global/common/error/code/user';
import { forceUpdatePassword } from '@fastgpt/service/support/user/account/password/service';
import { MongoUser } from '@fastgpt/service/support/user/schema';

describe('forceUpdatePassword', () => {
  let forcedUser: any;
  let normalUser: any;

  beforeEach(async () => {
    forcedUser = await MongoUser.create({
      username: 'force-update-pending',
      password: hashStr('old-password'),
      mustChangePassword: true
    });
    normalUser = await MongoUser.create({
      username: 'force-update-normal',
      password: hashStr('old-password')
    });
  });

  it('updates the password and clears the flag when a forced change is pending', async () => {
    await forceUpdatePassword({
      userId: String(forcedUser._id),
      newPassword: hashStr('brand-new-password')
    });

    expect(
      await MongoUser.exists({
        _id: forcedUser._id,
        password: hashStr('brand-new-password'),
        mustChangePassword: false
      })
    ).toBeTruthy();
  });

  it('records passwordUpdateTime', async () => {
    await forceUpdatePassword({
      userId: String(forcedUser._id),
      newPassword: hashStr('brand-new-password')
    });

    const updated = await MongoUser.findById(forcedUser._id).lean();
    expect(updated?.passwordUpdateTime).toBeInstanceOf(Date);
  });

  it('rejects fail-closed when the account is not in a forced change state', async () => {
    await expect(
      forceUpdatePassword({
        userId: String(normalUser._id),
        newPassword: hashStr('brand-new-password')
      })
    ).rejects.toThrow(UserErrEnum.passwordChangeAuthorizationInvalid);

    expect(
      await MongoUser.exists({ _id: normalUser._id, password: hashStr('old-password') })
    ).toBeTruthy();
  });

  it('rejects a password identical to the current one', async () => {
    await expect(
      forceUpdatePassword({
        userId: String(forcedUser._id),
        newPassword: hashStr('old-password')
      })
    ).rejects.toThrow(UserErrEnum.newPasswordSameAsOld);

    expect(
      await MongoUser.exists({ _id: forcedUser._id, mustChangePassword: true })
    ).toBeTruthy();
  });

  it('rejects a non-existent user', async () => {
    await expect(
      forceUpdatePassword({
        userId: '68a1b2c3d4e5f60718293a4b',
        newPassword: hashStr('brand-new-password')
      })
    ).rejects.toThrow(UserErrEnum.passwordChangeAuthorizationInvalid);
  });
});
```

> **断言方式**：`UserError` 只继承 `Error` 并携带 `message`（`packages/global/common/error/utils.ts:59-67`），**没有** `statusText` 属性——`statusText` 是错误映射表（`packages/global/common/error/code/user.ts`）里给 HTTP 响应层用的字段。因此必须用 `.rejects.toThrow(UserErrEnum.xxx)`，与 `packages/service/test/support/user/account/password/service.test.ts:53` 的既有写法一致。

- [ ] **Step 2: 运行测试，确认失败**

```bash
pnpm --dir packages/service exec vitest run -c vitest.config.ts test/support/user/account/password/forceUpdate.test.ts
```

预期：FAIL —— `forceUpdatePassword is not a function`。

- [ ] **Step 3: 实现服务函数**

`packages/service/support/user/account/password/service.ts`，在 `updatePasswordWithChangeSession` 之后、`assertNewPasswordDiffersFromCurrent` 之前插入：

```ts
/**
 * 强制改密路径：在没有一次性改密凭证时，仅当账号确实处于「必须改密」状态才允许写入。
 *
 * 判定与写入共用同一个 `mustChangePassword: true` 过滤条件并同处一个 Mongo 事务，
 * 保证判定期与写期条件一致，杜绝并发下的重复利用（fail-closed）。
 * 不满足条件时返回与凭证失效同一错误语义，避免泄露账号当前状态。
 */
export const forceUpdatePassword = async ({
  userId,
  newPassword
}: {
  userId: string;
  newPassword: string;
}) =>
  mongoSessionRun(async (session) => {
    const isForcedChangePending = await MongoUser.exists({
      _id: userId,
      mustChangePassword: true
    }).session(session);
    if (!isForcedChangePending) {
      throw new UserError(UserErrEnum.passwordChangeAuthorizationInvalid);
    }

    await assertNewPasswordDiffersFromCurrent({ userId, newPassword, session });

    const updateResult = await MongoUser.updateOne(
      { _id: userId, mustChangePassword: true },
      {
        $set: {
          password: newPassword,
          passwordUpdateTime: new Date(),
          mustChangePassword: false
        }
      },
      { session }
    );
    if (updateResult.matchedCount !== 1) throw new Error('Failed to update password');
  });
```

> `MongoUser`、`mongoSessionRun`、`UserError`、`UserErrEnum` 该文件均已导入，无需新增 import。

- [ ] **Step 4: 运行测试，确认通过**

```bash
pnpm --dir packages/service exec vitest run -c vitest.config.ts test/support/user/account/password/forceUpdate.test.ts
```

预期：PASS（5 个用例）。

- [ ] **Step 5: 提交**

```bash
git add packages/service/support/user/account/password/service.ts packages/service/test/support/user/account/password/forceUpdate.test.ts
git commit -m "feat(user): add fail-closed forceUpdatePassword service"
```

---

### Task 4: 改密接口双路径改造

**Files:**
- Modify: `packages/global/openapi/support/user/account/password/api.ts:210-225`
- Modify: `projects/app/src/pages/api/support/user/account/password/update.ts`
- Modify: `projects/app/src/web/support/user/account/password/api.ts`
- Test: `projects/app/test/api/support/user/account/password/update.test.ts`

- [ ] **Step 1: 写失败测试**

**1a. 改写既有用例。** 把 `projects/app/test/api/support/user/account/password/update.test.ts:275` 的用例整体替换为：

```ts
  it('allows root to change password with a valid password change session', async () => {
    const body = await getBody();
    const response = await Call<UpdatePasswordBody, Record<string, never>, undefined>(
      updatePasswordApi,
      {
        body,
        auth: getAuth(String(testUser._id), true)
      }
    );

    expect(response.code).toBe(200);
    expect(
      await MongoUser.exists({ _id: testUser._id, password: hashStr('new-password') })
    ).toBeTruthy();
  });
```

**1b. 新增 4 个用例**，追加到同一 `describe` 内：

```ts
  it('allows a forced password change without a change session', async () => {
    const forcedUser = await MongoUser.create({
      username: 'forced-password-user',
      password: hashStr('old-password'),
      mustChangePassword: true
    });
    const forcedTmb = await MongoTeamMember.create({
      teamId: testTeam._id,
      userId: forcedUser._id,
      status: 'active',
      role: 'owner'
    });

    const response = await Call<UpdatePasswordBody, Record<string, never>, undefined>(
      updatePasswordApi,
      {
        body: { newPsw: hashStr('brand-new-password') },
        auth: {
          userId: String(forcedUser._id),
          teamId: String(testTeam._id),
          tmbId: String(forcedTmb._id),
          isRoot: false,
          sessionId: 'current-session'
        } as any
      }
    );

    expect(response.code).toBe(200);
    expect(
      await MongoUser.exists({
        _id: forcedUser._id,
        password: hashStr('brand-new-password'),
        mustChangePassword: false
      })
    ).toBeTruthy();
  });

  it('rejects a password change without a session when no forced change is pending', async () => {
    const response = await Call<UpdatePasswordBody, Record<string, never>, undefined>(
      updatePasswordApi,
      {
        body: { newPsw: hashStr('brand-new-password') },
        auth: getAuth()
      }
    );

    expect(response.code).toBe(500);
    expect(
      await MongoUser.exists({ _id: testUser._id, password: hashStr('old-password') })
    ).toBeTruthy();
  });

  it('rejects unknown body fields instead of applying them to another account', async () => {
    const response = await Call<UpdatePasswordBody, Record<string, never>, undefined>(
      updatePasswordApi,
      {
        body: {
          newPsw: hashStr('brand-new-password'),
          passwordChangeSession: 'any-session',
          userId: String(testUser._id)
        } as any,
        auth: getAuth()
      }
    );

    expect(response.code).toBe(500);
    expect(
      await MongoUser.exists({ _id: testUser._id, password: hashStr('old-password') })
    ).toBeTruthy();
  });

  it('rejects a forced password change that reuses the current password', async () => {
    const forcedUser = await MongoUser.create({
      username: 'forced-password-same',
      password: hashStr('old-password'),
      mustChangePassword: true
    });
    const forcedTmb = await MongoTeamMember.create({
      teamId: testTeam._id,
      userId: forcedUser._id,
      status: 'active',
      role: 'owner'
    });

    const response = await Call<UpdatePasswordBody, Record<string, never>, undefined>(
      updatePasswordApi,
      {
        body: { newPsw: hashStr('old-password') },
        auth: {
          userId: String(forcedUser._id),
          teamId: String(testTeam._id),
          tmbId: String(forcedTmb._id),
          isRoot: false,
          sessionId: 'current-session'
        } as any
      }
    );

    expect(response.code).toBe(500);
    expect(
      await MongoUser.exists({ _id: forcedUser._id, mustChangePassword: true })
    ).toBeTruthy();
  });
```

- [ ] **Step 2: 运行测试，确认失败**

```bash
pnpm --dir projects/app exec vitest run -c vitest.config.ts test/api/support/user/account/password/update.test.ts
```

预期：
- `allows root to change password...` FAIL（仍返回 500）
- `allows a forced password change without a change session` FAIL（`passwordChangeSession` 必填导致解析失败 → 500）

- [ ] **Step 3: 放宽请求契约**

`packages/global/openapi/support/user/account/password/api.ts`，把 `UpdatePasswordBodySchema` 改为：

```ts
export const UpdatePasswordBodySchema = z
  .object({
    newPsw: z
      .string()
      .length(64)
      .meta({
        description: '客户端 SHA-256 处理后的新密码摘要',
        example: 'a'.repeat(64)
      }),
    passwordChangeSession: z
      .string()
      .min(1)
      .max(128)
      .optional()
      .meta({
        description:
          '身份验证成功后签发的一次性改密 Session；账号处于强制改密态时可不传',
        example: 'password-change-session'
      })
  })
  .strict();
```

同时更新同文件顶部注释块里的接口描述（第 11-18 行），把 `POST /support/user/account/password/update` 一行改为：

```ts
 *         POST /support/user/account/password/update
 * Description: 创建身份验证材料、一次性改密 Session 并更新当前用户密码；
 *              或凭 mustChangePassword 标记完成强制改密
```

并把 `packages/global/openapi/support/user/account/password/index.ts` 中该路径的 `description` 改为：

```ts
      description:
        '使用当前 Session 和一次性改密 Session 设置或修改密码，并注销其他 Session；账号处于强制改密态时可省略改密 Session',
```

- [ ] **Step 4: 改 handler**

`projects/app/src/pages/api/support/user/account/password/update.ts` 整体替换为：

```ts
import { ERROR_ENUM } from '@fastgpt/global/common/error/errorCode';
import type { ApiRequestProps } from '@fastgpt/next/type';
import {
  UpdatePasswordBodySchema,
  type UpdatePasswordBody
} from '@fastgpt/global/openapi/support/user/account/password/api';
import { AuditEventEnum } from '@fastgpt/global/support/user/audit/constants';
import { parseApiInput } from '@fastgpt/service/common/zod/requestParseError';
import { serviceEnv } from '@fastgpt/service/env';
import { assertPasswordUpdateRateLimit } from '@fastgpt/service/common/rateLimit/interface/accountVerification';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import {
  assertUserPasswordAvailable,
  forceUpdatePassword,
  updatePasswordWithChangeSession
} from '@fastgpt/service/support/user/account/password/service';
import { addAuditLog } from '@fastgpt/service/support/user/audit/util';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { delUserAllSession } from '@fastgpt/service/support/user/session';
import { withUserLock } from '@fastgpt/service/support/user/lock';
import { NextAPI } from '@/service/middleware/entry';

/**
 * 更新当前登录用户的密码，并仅保留发起请求的 Session。
 *
 * 两条互斥的授权路径：
 * - 携带 passwordChangeSession：消费身份验证流程签发的一次性凭证；
 * - 未携带：仅当账号处于 mustChangePassword 状态时放行（强制改密）。
 * 目标账号恒为 authCert 解析出的 userId，不接受请求体指定。
 */
async function handler(req: ApiRequestProps<UpdatePasswordBody>): Promise<void> {
  const { body } = parseApiInput({ req, bodySchema: UpdatePasswordBodySchema });
  const { userId, sessionId, tmbId, teamId } = await authCert({
    req,
    authToken: true
  });
  if (!sessionId) return Promise.reject(ERROR_ENUM.unAuthorization);

  await assertPasswordUpdateRateLimit({
    account: userId,
    limit: serviceEnv.PASSWORD_LOGIN_MINUTE_LIMIT_COUNT
  });

  await withUserLock(userId, async () => {
    // 开启 SSO 禁用密码策略后，受限 SSO 用户不允许继续维护平台密码。
    const user = await MongoUser.findById(userId);
    if (!user) throw new Error('Failed to update password');
    assertUserPasswordAvailable(user.username);

    if (body.passwordChangeSession) {
      await updatePasswordWithChangeSession({
        sessionId: body.passwordChangeSession,
        userId,
        loginSessionId: sessionId,
        newPassword: body.newPsw
      });
    } else {
      // 无凭证时改由 mustChangePassword 标记授权，函数内部 fail-closed 校验。
      await forceUpdatePassword({ userId, newPassword: body.newPsw });
    }

    await delUserAllSession(userId, [sessionId]);
  });
  void addAuditLog({
    tmbId,
    teamId,
    event: AuditEventEnum.CHANGE_PASSWORD,
    params: {}
  });
}

export default NextAPI(handler);
```

> **相对原实现的差异**：`isRoot` 不再被解构，也不再拦在入口；新增 `forceUpdatePassword` 分支。其余顺序（限流 → 用户锁 → SSO 闸门 → 写入 → 会话注销 → 审计）保持不变。

- [ ] **Step 5: 放宽客户端签名**

`projects/app/src/web/support/user/account/password/api.ts`，把 `updatePassword` 改为：

```ts
/** 沿用现有登录协议，只向服务端提交新密码的 SHA-256 摘要。 */
export const updatePassword = ({
  newPassword,
  passwordChangeSession
}: {
  newPassword: string;
  passwordChangeSession?: string;
}) =>
  POST<void>('/support/user/account/password/update', {
    newPsw: hashStr(newPassword),
    ...(passwordChangeSession ? { passwordChangeSession } : {})
  });
```

- [ ] **Step 6: 运行测试，确认通过**

```bash
pnpm --dir projects/app exec vitest run -c vitest.config.ts test/api/support/user/account/password/update.test.ts
```

预期：PASS（改写 1 个 + 新增 4 个）。

- [ ] **Step 7: 跑相关前端测试与类型检查**

```bash
pnpm --dir projects/app exec vitest run -c vitest.config.ts test/web/support/user/account/password/api.test.ts test/pages/loginRedirect.test.ts
pnpm --filter @fastgpt/app exec tsc --noEmit
```

预期：PASS，无类型错误。若 `test/web/support/user/account/password/api.test.ts` 断言了 `updatePassword` 的请求体形状，需同步更新为「不带 `passwordChangeSession` 时不出现该字段」。

- [ ] **Step 8: 提交**

```bash
git add packages/global/openapi/support/user/account/password/api.ts packages/global/openapi/support/user/account/password/index.ts projects/app/src/pages/api/support/user/account/password/update.ts projects/app/src/web/support/user/account/password/api.ts projects/app/test/api/support/user/account/password/update.test.ts
git commit -m "feat(user): support forced password change path in update API"
```

---

## Phase 2 —— 前端强制改密

### Task 5: 接入 `postLoginAction.ts` 新增动作与门控

**Files:**
- Modify: `projects/app/src/components/Layout/postLoginAction.ts`
- Test: `projects/app/test/components/Layout/postLoginAction.test.ts`

- [ ] **Step 1: 写失败测试**

在 `projects/app/test/components/Layout/postLoginAction.test.ts` 的 `describe` 内追加：

```ts
  it('prioritises the forced password change over every other action', () => {
    expect(getAction([], true, undefined, true)).toBe('forcePasswordChange');
    expect(getAction(['forcePasswordChange'], true, undefined, true)).toBe('invitation');
  });

  it('does not introduce the forced password change when the flag is absent', () => {
    expect(getAction()).toBe('invitation');
    expect(getAction(['invitation'])).toBe('memberName');
  });

  it('keeps non-plus member-name behaviour unchanged when no forced change is pending', () => {
    expect(
      getNextPostLoginAction({
        canStartMandatory: true,
        canStartOptional: true,
        completed: new Set(),
        inviteLinkId: '',
        hasPendingMemberName: true,
        shouldShowContact: false,
        contactHandled: false,
        isPlus: false,
        hasImportantInform: false
      })
    ).toBe('memberName');
  });
```

并把该文件顶部的 `getAction` 辅助函数（第 13-29 行）扩展为可选入参：

```ts
const getAction = (
  completed: OneTimePostLoginAction[] = [],
  hasImportantInform = true,
  currentAction?: PostLoginAction,
  mustChangePassword = false
) =>
  getNextPostLoginAction({
    canStartMandatory: true,
    canStartOptional: true,
    currentAction,
    completed: new Set(completed),
    inviteLinkId: 'invite-1',
    hasPendingMemberName: true,
    shouldShowContact: true,
    contactHandled: false,
    isPlus: true,
    hasImportantInform,
    mustChangePassword
  });
```

> **关键**：`mustChangePassword` 必须是**可选**入参。设为必填会让本文件全部既有用例编译失败。

- [ ] **Step 2: 运行测试，确认失败**

```bash
pnpm --dir projects/app exec vitest run -c vitest.config.ts test/components/Layout/postLoginAction.test.ts
```

预期：FAIL —— `expected 'invitation' to be 'forcePasswordChange'`，且 TS 报 `mustChangePassword` 不是 `getNextPostLoginAction` 的已知属性。

- [ ] **Step 3: 扩展动作集合**

`projects/app/src/components/Layout/postLoginAction.ts`：

第 1-9 行的联合类型加一项（放在 `memberName` 之后）：

```ts
export type PostLoginAction =
  | 'invitation'
  | 'memberName'
  | 'forcePasswordChange'
  | 'resetExpiredPassword'
  | 'contact'
  | 'systemMessage'
  | 'importantInform'
  | 'activityAd'
  | 'enterpriseAuthNotice';
```

第 71-75 行的强制动作集合加一项：

```ts
/** 强制动作集合：新增动作默认属于可选通知类，只有必须完成的补齐才放进这里。 */
export const MANDATORY_POST_LOGIN_ACTIONS: ReadonlySet<PostLoginAction> = new Set([
  'invitation',
  'memberName',
  'forcePasswordChange'
]);
```

- [ ] **Step 4: 扩展选择逻辑**

同文件，`getNextPostLoginAction` 的入参类型加字段（第 110-120 行区域）：

```ts
  isPlus: boolean;
  hasImportantInform: boolean;
  /** 账号是否处于必须修改密码的状态；缺省按 false 处理。 */
  mustChangePassword?: boolean;
}) => {
```

同函数的解构参数加一项：

```ts
export const getNextPostLoginAction = ({
  canStartMandatory,
  canStartOptional,
  currentAction,
  completed,
  inviteLinkId,
  hasPendingMemberName,
  shouldShowContact,
  contactHandled,
  isPlus,
  hasImportantInform,
  mustChangePassword = false
}: {
```

`candidates` 数组（第 132-141 行）改为 —— **只在首位插入一项，其余原样保留**：

```ts
  const candidates: Array<PostLoginAction | undefined> = [
    mustChangePassword ? 'forcePasswordChange' : undefined,
    inviteLinkId ? 'invitation' : undefined,
    hasPendingMemberName ? 'memberName' : undefined,
    isPlus ? 'resetExpiredPassword' : undefined,
    shouldShowContact && !contactHandled ? 'contact' : undefined,
    isPlus ? 'systemMessage' : undefined,
    isPlus && hasImportantInform ? 'importantInform' : undefined,
    isPlus ? 'activityAd' : undefined,
    isPlus ? 'enterpriseAuthNotice' : undefined
  ];
```

> **不要**给 `invitation` / `memberName` 加 `isPlus` 门。这两项在本代码库中被刻意设计为不依赖 `isPlus`（见本文件第 52-56 行注释与 `postLoginAction.test.ts` 的 `supports non-plus member-name actions without adding plus-only actions`）。

- [ ] **Step 5: 运行测试，确认通过**

```bash
pnpm --dir projects/app exec vitest run -c vitest.config.ts test/components/Layout/postLoginAction.test.ts
```

预期：PASS（既有全部 + 新增 3 个）。

- [ ] **Step 6: 提交**

```bash
git add projects/app/src/components/Layout/postLoginAction.ts projects/app/test/components/Layout/postLoginAction.test.ts
git commit -m "feat(layout): add mandatory forcePasswordChange post-login action"
```

---

### Task 6: 新增 `ForceChangePasswordModal`

**Files:**
- Create: `projects/app/src/components/support/user/safe/ForceChangePasswordModal.tsx`
- Modify: `packages/web/i18n/zh-CN/common.json`（及其余 3 个语种）

- [ ] **Step 1: 补齐 i18n 文案**

在 `packages/web/i18n/{zh-CN,zh-Hant,en,ko-KR}/common.json` 中，紧随既有的 `"password_set_title"` 一行之后插入两个 key：

zh-CN：

```json
  "password_force_change_title": "请修改初始密码",
  "password_force_change_tip": "为保障账号安全，请先修改初始密码后再继续使用。",
```

zh-Hant：

```json
  "password_force_change_title": "請修改初始密碼",
  "password_force_change_tip": "為保障帳號安全，請先修改初始密碼後再繼續使用。",
```

en：

```json
  "password_force_change_title": "Change your initial password",
  "password_force_change_tip": "For account security, please change the initial password before continuing.",
```

ko-KR：

```json
  "password_force_change_title": "초기 비밀번호를 변경해 주세요",
  "password_force_change_tip": "계정 보안을 위해 초기 비밀번호를 변경한 후 계속 사용해 주세요.",
```

- [ ] **Step 2: 新建弹窗组件**

新建 `projects/app/src/components/support/user/safe/ForceChangePasswordModal.tsx`：

```tsx
'use client';
import { useCallback, useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  Input,
  Text,
  VStack
} from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
import { useForm } from 'react-hook-form';
import { UserErrEnum } from '@fastgpt/global/common/error/code/user';
import { getErrResponse } from '@fastgpt/global/common/error/utils';
import { checkPasswordRule } from '@fastgpt/global/common/string/password';
import MyModal from '@fastgpt/web/components/common/MyModal';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { useUserStore } from '@/web/support/user/useUserStore';
import { updatePassword } from '@/web/support/user/account/password/api';

type FormType = {
  newPassword: string;
  confirmPassword: string;
};

const invalidInputStyles = {
  borderColor: 'red.500',
  _focus: {
    borderColor: 'red.500',
    boxShadow: '0 0 0 1px var(--chakra-colors-red-500)'
  },
  _focusVisible: {
    borderColor: 'red.500',
    boxShadow: '0 0 0 1px var(--chakra-colors-red-500)'
  }
};

/**
 * 不可关闭的强制改密弹窗：账号处于 mustChangePassword 状态时，登录后必须先改密。
 *
 * 与 PasswordChangeModal 的差异只在于「不要求任何身份验证材料」——身份已由
 * 使用初始密码登录这一动作证明，因此这里只有新密码与确认密码两个输入。
 * 刻意不复用 PasswordChangeModal：后者是五态状态机且无单测覆盖，为其新增分支
 * 的回归风险高于此处独立实现的少量重复。
 */
const ForceChangePasswordModal = ({ onFinish }: { onFinish: () => void }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { initUserInfo } = useUserStore();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors }
  } = useForm<FormType>({
    defaultValues: { newPassword: '', confirmPassword: '' }
  });

  const submitNewPassword = useCallback(
    async ({ newPassword }: FormType) => {
      setSubmitting(true);
      try {
        await updatePassword({ newPassword });
        reset();
        // 必须刷新 userInfo：mustChangePassword 挂在 userInfo 上，
        // 不刷新会让编排锁释放后弹窗立即重新弹出。
        await initUserInfo();
        toast({ status: 'success', title: t('common:password_set_success') });
        onFinish();
      } catch (error) {
        const errorResponse = getErrResponse(error);
        const errorTitle =
          errorResponse?.statusText === UserErrEnum.newPasswordSameAsOld
            ? t('common:user.Password has no change')
            : t('common:password_update_error');
        toast({ status: 'error', title: errorTitle });
      } finally {
        setSubmitting(false);
      }
    },
    [initUserInfo, onFinish, reset, t, toast]
  );

  return (
    <MyModal
      isOpen
      isCentered
      w="400px"
      maxW={['calc(100vw - 32px)', '400px']}
      borderRadius="semilg"
      boxShadow="3.5"
      overflow="hidden"
      closeOnOverlayClick={false}
    >
      <Box p={8}>
        <Text fontSize="lg" fontWeight="medium" lineHeight="26px">
          {t('common:password_force_change_title')}
        </Text>
        <Text mt={2} fontSize="sm" lineHeight="20px">
          {t('common:password_force_change_tip')}
        </Text>
        <VStack align="stretch" spacing={6} mt={6}>
          <FormControl isInvalid={!!errors.newPassword}>
            <Input
              size="lg"
              type="password"
              bg="myGray.50"
              _invalid={invalidInputStyles}
              placeholder={t('common:password_new_placeholder')}
              aria-label={t('common:password_new_placeholder')}
              {...register('newPassword', {
                required: t('common:password_new_placeholder'),
                validate: (value) => checkPasswordRule(value) || t('common:password_tip')
              })}
            />
            <Text
              mt={2}
              color={errors.newPassword ? 'red.500' : 'myGray.400'}
              fontSize="mini"
              fontWeight="medium"
              lineHeight={4}
            >
              {t('common:password_tip')}
            </Text>
          </FormControl>
          <FormControl isInvalid={!!errors.confirmPassword}>
            <Input
              size="lg"
              type="password"
              bg="myGray.50"
              _invalid={invalidInputStyles}
              placeholder={t('common:password_confirm_placeholder')}
              aria-label={t('common:password_confirm_placeholder')}
              {...register('confirmPassword', {
                required: t('common:password_confirm_placeholder'),
                validate: (value) =>
                  value === getValues('newPassword') || t('common:password_not_match')
              })}
            />
            {errors.confirmPassword?.message && (
              <FormErrorMessage mt={2} fontSize="mini" lineHeight={4}>
                {errors.confirmPassword.message}
              </FormErrorMessage>
            )}
          </FormControl>
          <Button
            size="lg"
            w="100%"
            fontSize="sm"
            isLoading={submitting}
            onClick={handleSubmit(submitNewPassword)}
          >
            {t('common:password_confirm_action')}
          </Button>
        </VStack>
      </Box>
    </MyModal>
  );
};

export default ForceChangePasswordModal;
```

> **不可关闭的三重保障**（已核对 `MyModal` 源码）：
> 1. **不传 `onClose`** → `MyModalProps.onClose` 是可选的，缺失时内部 `!title && onClose && showCloseButton` 的关闭按钮不渲染，底部按钮区也不渲染（`MyModal/index.tsx:73,102`）。
> 2. **`closeOnOverlayClick={false}`** → 该 prop 的默认值是 `true`（`MyModal/index.tsx:39`），**必须显式关掉**，否则点遮罩层就能关闭。
> 3. **ESC 键**：Chakra 的 `onClose` 落到 `() => onClose && onClose()`（空操作），受控的 `isOpen` 保持 `true`，弹窗不会关闭。

- [ ] **Step 3: 类型检查**

```bash
pnpm --filter @fastgpt/app exec tsc --noEmit
```

预期：无错误。样式对象直接以 `_invalid={invalidInputStyles}` 传入（与 `PasswordChangeModal.tsx:405` 的写法一致），**不需要**类型断言。

- [ ] **Step 4: 提交**

```bash
git add projects/app/src/components/support/user/safe/ForceChangePasswordModal.tsx packages/web/i18n/zh-CN/common.json packages/web/i18n/zh-Hant/common.json packages/web/i18n/en/common.json packages/web/i18n/ko-KR/common.json
git commit -m "feat(user): add non-dismissable force change password modal"
```

---

### Task 7: 编排器接入强制改密

**Files:**
- Modify: `projects/app/src/components/Layout/PostLoginActionOrchestrator.tsx`

- [ ] **Step 1: 加动态导入**

在 `PostLoginActionOrchestrator.tsx` 顶部，紧随 `ResetExpiredPswModal` 的 `dynamic(...)`（第 34-37 行）之后插入：

```tsx
const ForceChangePasswordModal = dynamic(
  () => import('@/components/support/user/safe/ForceChangePasswordModal'),
  { ssr: false }
);
```

- [ ] **Step 2: 注册动作视图**

`POST_LOGIN_ACTION_VIEWS`（第 114-157 行），在 `memberName` 分支之后插入：

```tsx
  forcePasswordChange: ({ onFinishOneTimeAction }) => (
    <ForceChangePasswordModal onFinish={() => onFinishOneTimeAction('forcePasswordChange')} />
  ),
```

> 该映射表的类型是 `Record<PostLoginAction, ...>`，新增动作后 TypeScript 会强制要求补齐此分支，漏写会直接编译失败。

- [ ] **Step 3: 调整门控**

`PostLoginActionOrchestrator` 组件体内，把第 202-206 行替换为：

```tsx
  const mustChangePassword = userInfo?.mustChangePassword === true;
  const baseReady = !!userId && !!teamId;
  // 强制改密不受 isPlus 限制：社区版没有 pro 的改密流程，但仍必须能完成一次性强制改密。
  // 其余强制动作沿用 isPlus 门，可选动作维持原样，保证既有行为不变。
  const canStartMandatory =
    (isPlus || mustChangePassword) && baseReady && canRunMandatoryActions;
  const canStartOptional = isPlus && baseReady && canRunOptionalActions && unreadQueryFetched;
```

> `isPlus` 的声明（第 176 行 `const isPlus = !!feConfigs?.isPlus;`）保持不动。

- [ ] **Step 4: 传入新的判定参数**

把第 227-238 行的 `getNextPostLoginAction({...})` 调用末尾补一项：

```tsx
  const nextAction = getNextPostLoginAction({
    canStartMandatory,
    canStartOptional,
    currentAction,
    completed,
    inviteLinkId,
    hasPendingMemberName: userInfo?.team?.isSetMemberName === false,
    shouldShowContact,
    contactHandled,
    isPlus,
    hasImportantInform: importantInforms.length > 0,
    mustChangePassword
  });
```

- [ ] **Step 5: 类型检查**

```bash
pnpm --filter @fastgpt/app exec tsc --noEmit
```

预期：无错误。

- [ ] **Step 6: 跑编排器相关测试**

```bash
pnpm --dir projects/app exec vitest run -c vitest.config.ts test/components/Layout/postLoginAction.test.ts test/pages/loginRedirect.test.ts
```

预期：PASS。若 `loginRedirect.test.ts` 因 `useUserStore` 返回值缺 `mustChangePassword` 而失败，在其 userInfo mock 中补 `mustChangePassword: false`。

- [ ] **Step 7: 提交**

```bash
git add projects/app/src/components/Layout/PostLoginActionOrchestrator.tsx projects/app/test/pages/loginRedirect.test.ts
git commit -m "feat(layout): mount force password change in post-login orchestrator"
```

---

### Task 8: 用户信息页去掉 root 短路

**Files:**
- Modify: `projects/app/src/pages/account/info/index.tsx:150,257-266`

- [ ] **Step 1: 删除 `isRoot` 变量**

`projects/app/src/pages/account/info/index.tsx`，删除第 150 行：

```tsx
  const isRoot = userInfo?.username === 'root';
```

- [ ] **Step 2: 简化按钮处理函数**

把 `handlePasswordAction`（第 257-266 行）整体替换为：

```tsx
  const handlePasswordAction = useCallback(() => {
    onOpenUpdatePsw();
  }, [onOpenUpdatePsw]);
```

> 也可以直接把按钮的 `onClick={handlePasswordAction}` 改为 `onClick={onOpenUpdatePsw}` 并删除该回调；两种改法等价，保留回调可减少 diff。

- [ ] **Step 3: 确认 `toast` 仍被使用**

`toast` 在同组件的 `onClickSave` 中仍在使用，**不要**删除 `const { toast } = useToast();`。运行：

```bash
pnpm --filter @fastgpt/app exec tsc --noEmit
```

预期：无错误（若报 `toast` 未使用，说明找到了错误的删除位置，请回退）。

- [ ] **Step 4: 确认 `root_password_change_tip` 成为死词条**

```bash
grep -rn "root_password_change_tip" projects/app/src packages/web
```

预期：只剩 `packages/web/i18n/*/account_info.json` 中的定义，无引用。**本轮不删除该词条**（清理死词条属独立工作，避免扩大 diff）。

- [ ] **Step 5: 跑账户页相关测试**

```bash
pnpm --dir projects/app exec vitest run -c vitest.config.ts test/pageComponents/account/info/password.test.ts
```

预期：PASS。该测试只覆盖 `canManagePasswordFromAccountInfo`，本次未改动该函数。

- [ ] **Step 6: 提交**

```bash
git add projects/app/src/pages/account/info/index.tsx
git commit -m "feat(user): let root change password from account info page"
```

---

## Phase 3 —— 部署、脚本与文档

> **注意**：Task 9 之后 `DEFAULT_ROOT_PSW` 被移除，但 Task 10 的脚本尚未就位。若需要灰度发布，请把 Task 9 与 Task 10 合并为同一次发布。

### Task 9: 移除 `DEFAULT_ROOT_PSW`

**Files:**
- Modify: `projects/app/src/env.ts:7`
- Modify: `projects/app/.env.template:4`
- Modify: `deploy/version/main/docker-compose.template.yml:6,214`
- Modify: `document/public/deploy/docker/main/{cn,global}/docker-compose.*.yml`（12 个：各 6 个）

- [ ] **Step 1: 删除应用侧声明**

`projects/app/src/env.ts`，删除第 7 行：

```ts
    DEFAULT_ROOT_PSW: z.string().default('123456'),
```

`projects/app/.env.template`，删除第 4 行：

```
DEFAULT_ROOT_PSW=123456
```

- [ ] **Step 2: 删除 compose 锚点与引用**

对 `deploy/version/main/docker-compose.template.yml`：

- 删除第 6 行 `x-default-root-psw: &x-default-root-psw '1234'`
- 删除第 214 行 `      DEFAULT_ROOT_PSW: *x-default-root-psw`

对 `document/public/deploy/docker/main/cn/` 与 `.../global/` 下 6×2 个文件，逐个执行同样的两步：

```bash
cd c:/code/agent-builder/FastGPT
for f in document/public/deploy/docker/main/cn/docker-compose.*.yml \
         document/public/deploy/docker/main/global/docker-compose.*.yml; do
  echo "$f: $(grep -c 'x-default-root-psw' "$f")"
done
```

预期：每个文件 2 处（锚点定义 + 环境变量引用）。逐一删除。

- [ ] **Step 3: 校验没有残留**

```bash
grep -rn "x-default-root-psw" --include=*.yml --include=*.yaml deploy/version/main document/public/deploy/docker/main
```

预期：无输出。

- [ ] **Step 4: 校验 compose 仍是合法 YAML**

```bash
docker compose -f deploy/version/main/docker-compose.template.yml config --quiet
```

预期：无报错。若本机无 docker，改用：

```bash
node -e "const fs=require('fs');const s=fs.readFileSync('deploy/version/main/docker-compose.template.yml','utf8');if(!/^x-default-root-psw/m.test(s))console.log('anchor removed');if(s.split('x-default-root-psw').length===1)console.log('no dangling refs');"
```

- [ ] **Step 5: 类型检查**

```bash
pnpm --filter @fastgpt/app exec tsc --noEmit
```

预期：无错误。若有 `appEnv.DEFAULT_ROOT_PSW` 残留引用会在此暴露。

- [ ] **Step 6: 提交**

```bash
git add projects/app/src/env.ts projects/app/.env.template deploy/version/main/docker-compose.template.yml document/public/deploy/docker/main
git commit -m "refactor(deploy): remove DEFAULT_ROOT_PSW environment variable"
```

---

### Task 10: 容器内重置 root 密码脚本

**Files:**
- Create: `projects/app/scripts/reset-root-password.mjs`
- Modify: `projects/app/Dockerfile`
- Modify: `projects/app/package.json`

- [ ] **Step 1: 新建脚本**

新建 `projects/app/scripts/reset-root-password.mjs`：

```js
#!/usr/bin/env node
/**
 * 在容器内重置指定用户的密码。
 *
 * 设计约束见 设计文档-ROOT_PASSWORD.md §3.8：
 * - 绕过 mongoose schema 直写 users 集合，因此必须自己完成两层哈希；
 * - 不吊销会话（session 只存 userId/teamId/tmbId/isRoot，不校验密码）；
 * - 只写 password / passwordUpdateTime / mustChangePassword 三个字段；
 * - 目标账号不存在时报错退出，不静默创建。
 *
 * 用法：
 *   docker exec -e ROOT_PSW='Xxx@12345' fastgpt node /app/scripts/reset-root-password.mjs
 *   docker exec -i fastgpt node /app/scripts/reset-root-password.mjs --stdin < ./new-psw.txt
 *   docker exec -e ROOT_PSW='...' fastgpt node /app/scripts/reset-root-password.mjs --dry-run
 */
import { createHash } from 'node:crypto';
import process from 'node:process';
import { MongoClient } from 'mongodb';

/** 与 packages/service/support/user/schema.ts 的 hashStr 保持一致。 */
const hashStr = (value) => createHash('sha256').update(value).digest('hex');

/**
 * 算出 users.password 字段应存的摘要。
 *
 * 业务层传入的是 hashStr(明文)，schema 的 set 钩子会再哈希一次，
 * 因此库中实际存储 hashStr(hashStr(明文))。脚本绕过 schema，必须自己补上第二层。
 */
export const computeStoredPasswordHash = (plaintext) => hashStr(hashStr(plaintext));

/** 与 systemUser.ts 的 LEGACY_WEAK_ROOT_PASSWORDS 保持一致（单测锁定）。 */
export const LEGACY_WEAK_ROOT_PASSWORDS = ['1234', '123456'];

/** 与 @fastgpt/global/common/string/password 的 checkPasswordRule 保持一致（单测锁定）。 */
export const checkPasswordRule = (password) => {
  const patterns = [
    /\d/,
    /[a-z]/,
    /[A-Z]/,
    /[!@#$%^&*()_+=.,:;?/\\|`~"'<>{}\[\]-]/
  ];
  const validChars = /^[\dA-Za-z!@#$%^&*()_+=.,:;?/\\|`~"'<>{}\[\]-]{8,100}$/;
  if (!validChars.test(password)) return false;
  return patterns.filter((pattern) => pattern.test(password)).length >= 2;
};

const HELP = `重置用户密码（容器内执行）

用法：
  node reset-root-password.mjs [选项]

密码来源（二选一，优先 stdin）：
  --stdin            从标准输入读取密码
  ROOT_PSW=<密码>    从环境变量读取

选项：
  --user <name>      目标用户名，默认 root
  --dry-run          只打印将要执行的变更，不写库
  --force            跳过密码强度校验
  --help, -h         显示本帮助

示例：
  docker exec -e ROOT_PSW='Xxx@12345' <容器> node /app/scripts/reset-root-password.mjs
  docker exec -i <容器> node /app/scripts/reset-root-password.mjs --stdin < ./new-psw.txt
`;

const parseArgs = (argv) => {
  const options = { user: 'root', stdin: false, dryRun: false, force: false };
  const args = argv[0] === '--' ? argv.slice(1) : argv;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--stdin') options.stdin = true;
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--force') options.force = true;
    else if (arg === '--user') {
      options.user = args[i + 1];
      if (!options.user) throw new Error('--user 需要一个用户名');
      i += 1;
    } else if (arg === '--help' || arg === '-h') options.help = true;
    else throw new Error(`未知参数：${arg}`);
  }

  return options;
};

const readStdin = async () => {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8').trim();
};

const resolvePassword = async ({ stdin }) => {
  const password = stdin ? await readStdin() : (process.env.ROOT_PSW ?? '').trim();
  if (!password) {
    throw new Error('未提供密码：请使用 --stdin 或设置 ROOT_PSW 环境变量');
  }
  return password;
};

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(HELP);
    return;
  }

  const password = await resolvePassword(options);
  if (!checkPasswordRule(password) && !options.force) {
    throw new Error(
      '密码不满足强度要求（8-100 位，且至少包含数字/小写/大写/特殊字符中的两类）。' +
        '如确认要使用弱口令，请追加 --force'
    );
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('缺少 MONGODB_URI 环境变量');

  const storedHash = computeStoredPasswordHash(password);
  const mustChangePassword = LEGACY_WEAK_ROOT_PASSWORDS.includes(password);
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const users = client.db().collection('users');
    const target = await users.findOne({ username: options.user }, { projection: { _id: 1 } });
    if (!target) {
      // 刻意不创建：异常环境里凭空造出超级管理员比失败更危险。
      throw new Error(`用户不存在：${options.user}`);
    }

    if (options.dryRun) {
      process.stdout.write(
        `[dry-run] 将重置用户 ${options.user} 的密码，并将 mustChangePassword 置为 ${mustChangePassword}\n`
      );
      return;
    }

    const result = await users.updateOne(
      { _id: target._id },
      {
        $set: {
          password: storedHash,
          passwordUpdateTime: new Date(),
          mustChangePassword
        }
      }
    );
    if (result.matchedCount !== 1) throw new Error('密码写入失败：未匹配到目标用户');

    process.stdout.write(
      JSON.stringify({
        event: 'reset-password',
        user: options.user,
        mustChangePassword,
        appliedAt: new Date().toISOString(),
        note: 'existing sessions are intentionally kept valid'
      }) + '\n'
    );
  } finally {
    await client.close();
  }
};

main().catch((error) => {
  process.stderr.write(`重置密码失败：${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
```

- [ ] **Step 2: 加 workspace 脚本**

`projects/app/package.json` 的 `scripts` 中，紧随 `"migrate:auth-code"` 之后插入：

```json
    "reset:root-psw": "node ./scripts/reset-root-password.mjs",
```

- [ ] **Step 3: 手动验证脚本可用（本地）**

若本地有可连的 Mongo：

```bash
cd c:/code/agent-builder/FastGPT
MONGODB_URI='<本地 Mongo 连接串>' pnpm --filter @fastgpt/app run reset:root-psw -- --dry-run
```

预期：`[dry-run] 将重置用户 root 的密码，并将 mustChangePassword 置为 false`

再验证三个失败路径：

```bash
# 未提供密码
node projects/app/scripts/reset-root-password.mjs ; echo "exit=$?"
# 预期：stderr "重置密码失败：未提供密码..."  exit=1

# 弱密码未被 --force 放行
MONGODB_URI='<uri>' ROOT_PSW='1234' node projects/app/scripts/reset-root-password.mjs ; echo "exit=$?"
# 预期：stderr 提示追加 --force  exit=1

# 目标用户不存在
MONGODB_URI='<uri>' ROOT_PSW='Xxx@12345' node projects/app/scripts/reset-root-password.mjs --user no-such-user ; echo "exit=$?"
# 预期：stderr "重置密码失败：用户不存在：no-such-user"  exit=1
```

- [ ] **Step 4: 接入镜像**

`projects/app/Dockerfile` 的 runner 阶段，在 `COPY --from=maindeps /app/node_modules/@zilliz/milvus2-sdk-node ./node_modules/@zilliz/milvus2-sdk-node` 之后插入：

```dockerfile
# 容器内重置密码脚本。纯 ESM，无需构建；构建期断言其运行时依赖可解析。
COPY --from=builder --chown=nextjs:nodejs /app/projects/app/scripts/reset-root-password.mjs /app/scripts/reset-root-password.mjs
RUN node -e "require.resolve('mongodb', { paths: ['/app/scripts'] })"
```

- [ ] **Step 5: 构建验证**

```bash
docker build -f projects/app/Dockerfile -t fastgpt-root-psw-test .
```

预期：构建成功。若 `require.resolve('mongodb', ...)` 报错，说明 standalone 产物未包含该驱动，需改为 `COPY --from=maindeps /app/node_modules/.pnpm ...` 的显式拷贝，或在脚本内改用相对路径解析。

构建完成后验证脚本在镜像内可执行：

```bash
docker run --rm fastgpt-root-psw-test node /app/scripts/reset-root-password.mjs --help
```

预期：打印帮助文本，退出码 0。

- [ ] **Step 6: 提交**

```bash
git add projects/app/scripts/reset-root-password.mjs projects/app/package.json projects/app/Dockerfile
git commit -m "feat(deploy): add in-container root password reset script"
```

---

### Task 11: 安装脚本与部署文档

**Files:**
- Modify: `document/public/deploy/install.sh`
- Modify: `document/public/deploy/SKILL.md`

- [ ] **Step 1: 删除随机化**

`document/public/deploy/install.sh`：

**1a.** 第 692 行改为固定值：

```bash
ROOT_LOGIN_PASSWORD="123456"
```

**1b.** 在 `randomize_compose_credentials` 内删除 `root_password` 的局部声明与赋值：

- 第 697 行的局部变量列表里删掉 `root_password`
- 删除第 709 行 `root_password="$(random_hex 8)"`

**1c.** 删除第 721-727 行的整个 if/else：

```bash
    if LC_ALL=C grep -Eq "x-default-root-psw: &x-default-root-psw ['\"]1234['\"]" docker-compose.yml; then
        ROOT_LOGIN_PASSWORD="$root_password"
        replace_text "x-default-root-psw: &x-default-root-psw '1234'" "x-default-root-psw: &x-default-root-psw '$root_password'"
        replace_text 'x-default-root-psw: &x-default-root-psw "1234"' "x-default-root-psw: &x-default-root-psw \"$root_password\""
    else
        ROOT_LOGIN_PASSWORD="请查看 docker-compose.yml 中 DEFAULT_ROOT_PSW"
    fi
```

**1d.** 删除第 1277-1283 行的整个 if/else：

```bash
    if LC_ALL=C grep -Eq "x-default-root-psw: &x-default-root-psw ['\"]1234['\"]" docker-compose.yml; then
        ROOT_LOGIN_PASSWORD="1234"
    else
        ROOT_LOGIN_PASSWORD="请查看 docker-compose.yml 中 DEFAULT_ROOT_PSW"
    fi
```

> **不要只改字面量**：锚点已从 compose 模板移除，保留 `grep` 守卫会导致它永不匹配、永远走 else 分支，最终打印出已经失效的提示。

**1e.** 第 1419 / 1430 两行输出改为：

```bash
    echo "  5. 登录服务:   默认账号 'root'，初始密码 '123456'"
    echo "                 （首次登录会强制要求修改密码，请提前准备新密码）"
```

- [ ] **Step 2: 校验没有残留**

```bash
grep -n "root_password\|DEFAULT_ROOT_PSW\|x-default-root-psw" document/public/deploy/install.sh
```

预期：只剩 Step 1a 的 `ROOT_LOGIN_PASSWORD="123456"` 与 Step 1e 的输出（两处），**没有** `grep` 守卫、没有 `replace_text`、没有 `random_hex 8`。

- [ ] **Step 3: 语法检查**

```bash
bash -n document/public/deploy/install.sh
```

预期：无输出（语法正确）。

- [ ] **Step 4: 更新部署技能文档**

`document/public/deploy/SKILL.md` 的「最终回复」清单（第 125 行）改为：

```markdown
- 登录密码：`123456`。首次登录会强制要求修改密码，请提示用户提前准备新密码。
```

- [ ] **Step 5: 提交**

```bash
git add document/public/deploy/install.sh document/public/deploy/SKILL.md
git commit -m "chore(deploy): use fixed root initial password and force first-login change"
```

---

### Task 12: 文档与 i18n

**Files:**
- Modify: `packages/web/i18n/{zh-CN,zh-Hant,en,ko-KR}/login.json`
- Modify: `document/content/self-host/config/env.mdx` + `.en.mdx`
- Modify: `document/content/self-host/troubleshooting/faq.mdx` + `.en.mdx`
- Modify: `document/content/self-host/deploy/docker.mdx` + `.en.mdx`

- [ ] **Step 1: 更新 root 登录占位符**

四个语种的 `login.json` 中 `root_password_placeholder` 改为：

```json
  "root_password_placeholder": "root 初始密码为 123456，首次登录需修改",
```

zh-Hant：`"root 初始密碼為 123456，首次登入需修改"`
en：`"The root initial password is 123456 and must be changed on first login"`
ko-KR：`"root 초기 비밀번호는 123456이며, 첫 로그인 시 변경해야 합니다"`

- [ ] **Step 2: 删除环境变量文档条目**

`document/content/self-host/config/env.mdx`，删除表格中该行：

```markdown
| `DEFAULT_ROOT_PSW`              | `123456` | 初始化 root 用户默认密码。                                             |
```

`env.en.mdx` 中对应行一并删除。

- [ ] **Step 3: 改写 FAQ**

`document/content/self-host/troubleshooting/faq.mdx`，把第 103-105 行替换为：

```markdown
### 如何修改 root 密码

三种方式：

1. **首次登录时**：使用初始密码 `123456` 登录后，系统会强制要求修改密码。
2. **日常修改**：进入 `账号 - 个人信息`，点击密码行的「修改」按钮，按提示完成身份验证后设置新密码。
3. **忘记密码时**：在服务器上通过容器脚本重置，无需重启服务：

   ```bash
   docker exec -e ROOT_PSW='你的新密码' fastgpt node /app/scripts/reset-root-password.mjs
   ```

   容器名以 `docker ps` 输出为准。若新密码不满足强度要求，需追加 `--force`。
```

`faq.en.mdx` 做对应英文改写，命令保持一致。

- [ ] **Step 4: 同步部署文档**

`document/content/self-host/deploy/docker.mdx` 与 `docker.en.mdx`：删除或改写所有提到 `DEFAULT_ROOT_PSW` 的段落，统一指向「初始密码 `123456`，首次登录强制修改；忘记密码用容器脚本重置」。

用以下命令定位：

```bash
grep -n "DEFAULT_ROOT_PSW" document/content/self-host/deploy/docker.mdx document/content/self-host/deploy/docker.en.mdx document/content/self-host/config/env.mdx document/content/self-host/config/env.en.mdx
```

预期最终无输出。

- [ ] **Step 5: 校验活跃文档无残留**

```bash
grep -rn "DEFAULT_ROOT_PSW" document/content document/public/deploy projects/app packages
```

预期：只剩**历史版本快照**目录（`document/public/deploy/docker/v4.14`、`v4.15`、`deploy/version/v4.14`、`v4.15`）中的引用。这些按 §1.4「明确不做」保留。

- [ ] **Step 6: 提交**

```bash
git add packages/web/i18n document/content/self-host
git commit -m "docs: document fixed root initial password and reset paths"
```

---

## 收尾验证

- [ ] **Step 1: 全量单测**

```bash
pnpm test:service
pnpm test:app
```

预期：全部 PASS。

- [ ] **Step 2: 类型检查与 lint**

```bash
pnpm --filter @fastgpt/app exec tsc --noEmit
pnpm lint
```

预期：无错误。

- [ ] **Step 3: 端到端手工验证**

| # | 步骤 | 预期 |
| --- | --- | --- |
| 1 | 清空 users 集合后启动服务 | 日志出现 `Root and agent users initialized`，root 以 `123456` 创建 |
| 2 | 用 `root` / `123456` 登录 | 弹出不可关闭的强制改密弹窗，只有新密码 + 确认密码两个输入 |
| 3 | 输入弱密码（如 `123456`） | 前端提示强度不足 / 与旧密码相同，无法提交 |
| 4 | 输入合规新密码 | 改密成功，弹窗关闭，可正常使用系统 |
| 5 | 刷新页面 | 弹窗不再出现 |
| 6 | **重启服务** | 用新密码可登录，**旧密码 `123456` 不可登录**（验证不再被覆盖） |
| 7 | 进入 `账号 - 个人信息` | 密码行显示 `*****` 与「修改」按钮，点击可打开常规改密弹窗 |
| 8 | 走完旧密码验证流程改密 | 成功 |
| 9 | 手工把 root 密码改回 `123456`（或用脚本重置为 `123456`）后重启 | 再次弹出强制改密弹窗 |
| 10 | `docker exec -e ROOT_PSW='NewPsw@123' fastgpt node /app/scripts/reset-root-password.mjs` | 输出结构化 JSON；用 `NewPsw@123` 可登录 |
| 11 | 执行 Step 10 后不重新登录，直接刷新已登录页面 | **仍然可用**（验证会话未被吊销，符合 NFR-2） |
| 12 | `--dry-run` 预演 | 只打印，不改库 |

- [ ] **Step 4: 更新设计文档状态**

在 [设计文档-ROOT_PASSWORD.md](设计文档-ROOT_PASSWORD.md) 顶部加一行：

```markdown
> **实施状态**：已按 [实施计划-ROOT_PASSWORD.md](实施计划-ROOT_PASSWORD.md) 落地（YYYY-MM-DD）。
```

---

## 已知偏差与后续事项

| # | 事项 | 说明 |
| --- | --- | --- |
| 1 | R8：pro 侧 `authorization` 对 root 的验证方式 | 实施前用 root 会话调 `POST /proApi/support/user/account/password/authorization {"source":"verificationMethod"}` 验证返回 `verificationRequired: oldPassword`。若返回 `verificationUnavailable`，第 8 步（日常改密）不可用，需 pro 侧放开 `allowPasswordFallback` |
| 2 | R12：pro 管理端重置密码不同步 `mustChangePassword` | 跨仓库集成点，本次不处理 |
| 3 | `account_info:root_password_change_tip` 成为死词条 | 本次不清理，留待词条清理专项 |
| 4 | `checkPasswordRule` 在脚本内是第二份实现 | 单测用同一样本集同时喂给两处断言一致；若源规则变更，两处需同步 |
| 5 | 强制改密无后端拦截（NFR-1） | 已确认接受。未改密的 root 仍可直接调用业务 API |
| 6 | 历史版本快照目录保留 `DEFAULT_ROOT_PSW` | `deploy/version/{v4.14,v4.15}`、`document/public/deploy/docker/{v4.14,v4.15}` 按 §1.4 不改 |
