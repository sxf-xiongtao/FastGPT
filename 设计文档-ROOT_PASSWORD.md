# root 密码强制修改与初始化调整

本文以当前 `main` 分支（`ba58513c2`）的实现为准，覆盖需求梳理、已有逻辑背景、设计方案、影响面与风险。

---

## 一、需求

### 1.1 目标

把 root 账号的密码从"由环境变量托管、改密需重启"改为"默认口令 + 首次登录强制修改 + 页面可自助修改"。

### 1.2 功能需求

| 编号 | 需求 | 说明 |
| --- | --- | --- |
| FR-1 | root 默认密码固定为 `123456` | 不再通过环境变量配置；**移除 `DEFAULT_ROOT_PSW` 环境变量** |
| FR-2 | root 首次进入强制修改密码 | 未修改前，登录后弹出不可关闭的改密弹窗 |
| FR-3 | 强制改密页要求「旧密码 + 新密码 + 确认密码」 | 交互与常规改密一致，但**不依赖 pro**：旧密码校验由本服务端完成，不走验证码 / 微信 / OAuth 验证流程（见 §3.5、§3.9） |
| FR-4 | root 可随时在页面自助修改密码 | 走现有「个人信息 → 修改密码」入口，复用 pro 的旧密码验证流程 |
| FR-5 | 新增字段标记「必须修改密码」 | 字段是通用能力；**当前只有内置 root 账号在创建时被置位** |
| FR-6 | 初始化不再重置 root 密码 | root 已存在时完全不写 `password` 字段 |
| FR-7 | 存量 root 回填 | 初始化时若发现 root 密码仍等于默认密码，回填「必须修改密码」标记 |
| FR-8 | 容器内重置 root 密码的脚本 | 忘记密码时的兜底通道；镜像内置，直连 Mongo |

### 1.3 非功能约束

| 编号 | 约束 |
| --- | --- |
| NFR-1 | **强制改密仅由前端弹窗驱动，后端不加全局拦截**（已确认接受的取舍，见 §5 风险 R2） |
| NFR-2 | 容器重置脚本**不吊销会话**；除 `password` / `passwordUpdateTime` / `mustChangePassword` 三个字段外不写任何用户数据（见 §3.8） |
| NFR-3 | 不新增「启动时强制覆盖 root 密码」的开关 |
| NFR-4 | 强制改密**不判断 `isPlus`**——社区版也能完成一次性强制改密，避免被锁死在弹窗内（见 §3.6） |
| NFR-5 | 强制改密放开 `isPlus` 后，**不得产生越权**：任何人都不能借此修改他人（尤其 root）的密码（见 §3.9） |

### 1.4 明确不做

- 不对存量部署做一次性数据迁移（改用初始化时实时比对，FR-7）
- 不扩展 `DEFAULT_AGENT_PSW` 的强制改密（agent 用户是程序调用，不能强制）
- 不改动历史版本快照目录（`deploy/version/v4.14|v4.15`、`document/public/deploy/docker/v4.14|v4.15`）
- **社区版不提供页面自助改密入口**（`canManagePasswordFromAccountInfo` 仍要求 `isPlus`），由容器脚本兜底
- **不提供「管理员指定账号改密」的 HTTP 接口**（见 §3.9 末段）

---

## 二、已有逻辑背景

### 2.1 root 密码初始化现状

**入口链路**

`projects/app/src/instrumentation-node.ts` 在基础设施连接、配置加载、健康检查完成后执行：

```ts
await initSystemUser({ defaultRootPassword: appEnv.DEFAULT_ROOT_PSW });
```

- `DEFAULT_ROOT_PSW` 声明在 `projects/app/src/env.ts`，默认值 `'123456'`
- docker-compose 通过 `x-default-root-psw` 锚点注入（`deploy/version/main/docker-compose.template.yml:6`）

**多节点串行**：`packages/service/support/user/systemUser.ts` 通过 Redis `LeaseCache.withLease()` 保证跨节点互斥。

| 项目 | 值 |
| --- | --- |
| 租约逻辑 key | `system-user-init` |
| 租约 TTL | 60 秒 |
| 自动续期间隔 | 10 秒 |
| 未抢到租约的重试间隔 | 1 秒 |

**核心逻辑**（`executeSystemUserCreation`）：

```ts
const rootUser = await MongoUser.findOne({ username: 'root' }, undefined, { session });
const rootUId = await (async () => {
  if (rootUser) {
    await rootUser.updateOne({ password: hashStr(defaultRootPassword) }, { session });
    return rootUser._id;
  } else {
    const [{ _id }] = await MongoUser.create(
      [{ username: 'root', password: hashStr(defaultRootPassword) }],
      { session, ordered: true }
    );
    return _id;
  }
})();
```

> **极易误读的一行**：`Document.prototype.updateOne` 的签名是 `(update, options)`，**不是** `(conditions, update)`（mongoose 8.23.1 `lib/document.js:864`）。因此上面这行实际编译为：
>
> ```js
> MongoUser.updateOne({ _id: rootUser._id }, { $set: { password: hashStr(psw) } }, { session })
> ```
>
> mongoose 的 `castUpdate` 会把非原子文档自动包成 `$set`（实测 `{password:'x'}` → `{$set:{password:'x'}}`）。
>
> **结论：每次服务启动，只要 root 已存在，root 密码就被强制覆盖回 `DEFAULT_ROOT_PSW`。**
>
> 这段代码源自上游 FastGPT 的旧实现（已删除的 `projects/app/src/service/mongo.ts` 中的 `initRootUser()`），在重构为 `systemUser.ts` 时原样保留。`packages/service/test/support/user/systemUser.test.ts` 的 4 个用例中 `MongoUser.findOne` 全部返回 `null`，**这条分支从未被测试覆盖**——这正是它能长期存活的原因。

**密码存储协议**（`packages/service/support/user/schema.ts`）

```ts
const hashPasswordValue = (value: unknown) =>
  typeof value === 'string' && value.length > 0 ? hashStr(value) : value;

password: { type: String, required: false, set: hashPasswordValue, get: hashPasswordValue, select: false }
```

`set` / `get` 都是 `hashStr`（`sha256` hex），即**双层哈希**：

```
写入 hashStr(明文) → setter 再 hash 一次 → 库中 = sha256(sha256(明文))
登录 客户端传 sha256(明文) → 查询条件经 setter hash → 匹配库中双层值
```

`hashPasswordValue` 对空值 / `null` / 非字符串**原样返回**，用于区分"无密码"账号；`hasStoredPassword()` 依赖这一语义。

### 2.2 页面「个人信息 → 修改密码」现状

**入口可见性**：`projects/app/src/pages/account/info/index.tsx` 通过 `canManagePasswordFromAccountInfo({ isPlus, username, passwordAvailable })` 决定是否展示密码行，要求：

- `feConfigs.isPlus === true`（**改密能力当前是 pro 版专属**）
- `passwordAvailable !== false`（`getUserPasswordAvailability`，SSO 策略闸门）
- username 非 `wecom-` 前缀

**root 被前端短路**（同文件）：

```ts
const isRoot = userInfo?.username === 'root';

const handlePasswordAction = useCallback(() => {
  if (isRoot) {
    toast({ status: 'info', title: t('account_info:root_password_change_tip') });
    return;
  }
  onOpenUpdatePsw();
}, [isRoot, onOpenUpdatePsw, t, toast]);
```

文案：`root_password_change_tip` =「请修改环境变量中的 DEFAULT_ROOT_PSW 并重启服务即可修改 root 密码。」

**弹窗状态机**（`projects/app/src/components/support/user/safe/PasswordChangeModal.tsx`）

```
prompt（仅密码过期场景）
  └─ authorizing
      └─ POST /proApi/support/user/account/password/authorization {source:'verificationMethod'}
          ├─ verificationRequired(method)
          │    └─ POST /proApi/.../password/verification/create
          │       method ∈ { code | oldPassword | wechat | oauth/* }
          │    └─ 完成验证 → 再次 authorize {source:'accountVerification', verification}
          ├─ verificationUnavailable
          └─ authorized → 一次性 sessionId（TTL 5 分钟）
  └─ POST /support/user/account/password/update
        { newPsw: <64 位 sha256>, passwordChangeSession }
```

**服务端落点与仓库边界**

| 接口 | 归属 |
| --- | --- |
| `password/authorization`、`password/verification/create`、`password/updateByCode` | **pro 子模块**（`.gitmodules` → `fastgpt-pro.git`，本仓库未 checkout），经 `projects/app/src/pages/api/proApi/[...path].ts` 反代 |
| `password/update` | 本仓库 `projects/app/src/pages/api/support/user/account/password/update.ts` |
| `password/checkPswExpired` | 本仓库 `projects/app/src/pages/api/support/user/account/password/checkPswExpired.ts` |

**一次性改密 Session**（`packages/service/support/user/account/password/service.ts`）

| 项目 | 值 |
| --- | --- |
| 存储 | `tmp_datas`，`dataId = ${TmpDataEnum.PasswordChangeSession}--${hashStr(sessionId)}` |
| TTL | `PASSWORD_CHANGE_SESSION_TTL_SECONDS = 5 * 60` |
| 消费方式 | `mongoSessionRun` 事务内「查记录 → 改密码 → 删记录」，三步同事务，避免凭证提前消费或重放 |
| 绑定维度 | `data.userId` + `data.loginSessionId`，跨用户 / 跨会话不可用 |

**`update.ts` 现有执行顺序**

1. `authCert({ authToken: true })` → `userId / sessionId / tmbId / teamId / isRoot`
2. **`if (!sessionId || isRoot) return reject(unAuthorization)`** ← root 被硬拦
3. `assertPasswordUpdateRateLimit`（按 `PASSWORD_LOGIN_MINUTE_LIMIT_COUNT` 限流）
4. `withUserLock(userId)` 用户级互斥
5. `assertUserPasswordAvailable(user.username)` 二次校验 SSO 策略
6. `updatePasswordWithChangeSession(...)`
7. `delUserAllSession(userId, [sessionId])` — 保留当前会话，注销其余
8. `addAuditLog({ event: AuditEventEnum.CHANGE_PASSWORD })`

### 2.3 root 与普通用户的差异

| 维度 | 普通用户 | root |
| --- | --- | --- |
| 前端入口 | 打开 `PasswordChangeModal` | **只 toast 提示，不弹窗** |
| `/password/update` | 放行 | **`isRoot` 直接 401** |
| 密码真实来源 | 用户自己设置 | **每次启动被 `DEFAULT_ROOT_PSW` 覆盖** |
| `passwordUpdateTime` | 改密时更新 | **从不更新** |
| `checkPswExpired` | 按 `PASSWORD_EXPIRED_MONTH` 判断 | **直接返回 `false`** |
| 其他 session | 改密后注销 | 无此逻辑 |
| `session.isRoot` | `false` | `username === 'root'` → `true` |

**对设计有利的发现**：root 在 `resolveAccountKindByUsername` 中会落到 `local` 类型（无 `-` 前缀、非邮箱 / 手机号），其 `candidateMethods` 为空；只要调用方传 `allowPasswordFallback: true && oldPasswordAvailable: true`，`resolveAccountVerificationByUsername` 就会降级为 **`oldPassword` 验证**。**也就是说 root 的「旧密码验证」通道在纯函数层面本来就通**，堵点只在 `update.ts` 的 `isRoot` 判断和前端短路。

### 2.4 现有「强制改密」机制

系统**已有**一套登录后强制动作编排框架，本次需求本质是接入它。

`projects/app/src/components/Layout/postLoginAction.ts` — 纯函数状态机：

| 概念 | 实现 |
| --- | --- |
| 动作全集 | `PostLoginAction`：`invitation` / `memberName` / `resetExpiredPassword` / `contact` / `systemMessage` / `importantInform` / `activityAd` / `enterpriseAuthNotice` |
| 强制动作集合 | `MANDATORY_POST_LOGIN_ACTIONS = { invitation, memberName }` |
| 路由准入 | 可选动作排除表 `POST_LOGIN_ACTION_EXCLUDED_ROUTES`；强制动作排除表 `MANDATORY_ACTION_EXCLUDED_ROUTES`（更窄，保证 `/chat`、`/appStore` 上也能完成强制补齐） |
| 顺序选择 | `getNextPostLoginAction` 按 `candidates` 数组顺序取第一个准入且未完成者 |
| 抢占 | 准入的强制动作可临时抢占准入失败的可选动作，`pausedOptionalAction` 记录待恢复者 |
| 完成 | `finishPostLoginAction` 写入 `completed` 集合并释放锁 |

`projects/app/src/components/Layout/PostLoginActionOrchestrator.tsx` — 编排器：

- `baseReady = isPlus && !!userId && !!teamId`
- `canStartMandatory = baseReady && canRunMandatoryActions`
- `POST_LOGIN_ACTION_VIEWS` 是「动作 → 弹窗」映射表，注释明确要求**每个分支必须渲染出最终会回调 `finish` 的弹窗**，否则编排锁无法释放

`projects/app/src/components/support/user/safe/ResetExpiredPswModal.tsx` — 现成的强制改密范例：

```tsx
return enabled && passwordExpired ? (
  <PasswordChangeModal required showExpiredPrompt onSuccess={...} />
) : null;
```

`required` 语义 = 弹窗不可关闭（`closeOnOverlayClick={!required && ...}`、`onClose={required ? undefined : ...}`）。

**重要事实**：该机制**只有前端弹窗，后端没有任何拦截**。即密码过期用户可以照常直接调用业务 API。

### 2.5 一键安装脚本的既有行为

`document/public/deploy/install.sh` 会**在安装时随机化 root 密码并打印给用户**：

```bash
ROOT_LOGIN_PASSWORD="1234"
...
root_password="$(random_hex 8)"
if LC_ALL=C grep -Eq "x-default-root-psw: &x-default-root-psw ['\"]1234['\"]" docker-compose.yml; then
    ROOT_LOGIN_PASSWORD="$root_password"
    replace_text "x-default-root-psw: &x-default-root-psw '1234'" "x-default-root-psw: &x-default-root-psw '$root_password'"
    ...
fi
```

最终输出：「默认账号为 'root', 密码为: `$ROOT_LOGIN_PASSWORD`」

**这与 FR-1「默认密码固定 123456」直接冲突**，必须一并调整。

### 2.6 `DEFAULT_ROOT_PSW` 引用的完整分布

| 类别 | 文件 | 处理 |
| --- | --- | --- |
| 代码 | `projects/app/src/env.ts`、`projects/app/src/instrumentation-node.ts`、`packages/service/support/user/systemUser.ts` | 改 |
| 配置模板 | `projects/app/.env.template` | 改 |
| Compose 模板（活跃） | `deploy/version/main/docker-compose.template.yml` | 改 |
| Compose（活跃文档） | `document/public/deploy/docker/main/cn|global/docker-compose.*.yml`（12 个：cn 6 + global 6） | 改 |
| 安装脚本 | `document/public/deploy/install.sh`、`document/public/deploy/SKILL.md` | 改 |
| 文档 | `document/content/self-host/config/env.mdx`(+en)、`troubleshooting/faq.mdx`(+en)、`deploy/docker.mdx`(+en) | 改 |
| i18n | `packages/web/i18n/{zh-CN,zh-Hant,en,ko-KR}/login.json`（`root_password_placeholder`）、`.../account_info.json`（`root_password_change_tip`） | 改 |
| 历史快照 | `deploy/version/v4.14|v4.15/**`、`document/public/deploy/docker/v4.14|v4.15/**` | **不改** |

`login.json` 的 `root_password_placeholder`（登录页 root 密码输入框占位符）当前文案是「root 用户密码为环境变量 DEFAULT_ROOT_PSW 的值」，由 `LoginForm.tsx` 在用户名为 root 时渲染。

### 2.7 改密通道盘点：「有没有定时/到时间更新密码的接口」

**结论：没有。** 全仓库写入 `password` 字段的位置只有以下 4 处：

| # | 位置 | 性质 |
| --- | --- | --- |
| 1 | `packages/service/support/user/systemUser.ts:73` | 启动初始化覆盖 root 密码（本次删除，见 §3.2） |
| 2 | `packages/service/support/user/systemUser.ts:83` | 启动初始化创建 root |
| 3 | `packages/service/support/user/systemUser.ts:117` | 启动初始化创建 agent 用户 |
| 4 | `packages/service/support/user/account/password/service.ts:104` | `updatePasswordWithChangeSession` —— **页面改密走的唯一写入点** |

**定时任务不碰密码**：`projects/app/src/service/common/system/cron.ts` 的 `startCron()` 注册了多个定时任务（训练队列、临时文件清理、`checkInvalidDatasetData`、`checkInvalidVector`、`scheduleTriggerApp`、`cleanStaleGeneratingChat`、`modelStatusProbe` 等），逐一核查后**均与密码无关**；`cronTask.ts` 中亦无任何密码逻辑。

**用户文档的写入点同样极少**：非测试代码中 `MongoUser.updateOne` 的调用点仅 `password/service.ts:100` 与 `projects/app/src/pages/api/support/user/account/update.ts:36`（后者只写 `timezone` / `language`，见 §3.9 越权分析）。

**但存在一个「到时间就要改密码」的机制，只是它是检查、不是更新**：

```
appEnv.PASSWORD_EXPIRED_MONTH                                    projects/app/src/env.ts
  └─ checkPswExpired({ updateTime })                             projects/app/src/service/support/user/account/password.ts
       └─ GET /support/user/account/password/checkPswExpired      （root 直接 return false）
            └─ ResetExpiredPswModal 命中 → <PasswordChangeModal required />（不可关闭）
```

这是唯一与「按时间触发改密」语义相近的既有能力。它可否被强制改密复用，见 §3.3 的方案取舍。

---

## 三、设计方案

### 3.1 数据模型：新增字段

`packages/service/support/user/schema.ts` 的 `UserSchema` 新增：

```ts
mustChangePassword: {
  type: Boolean,
  default: false
}
```

- 字段默认 `false`；存量文档缺该字段时为 `undefined`，等价于 `false`
- 不加 `select: false`，因为 `getUserDetail` 需要读取
- 语义：**该账号必须先修改密码才能正常使用**。字段是通用能力，当前只有 root 会被置位（FR-5）

`packages/global/support/user/type.ts` **同文件里有两个不同的类型，都要改**：

| 类型 | 用途 | 改动 |
| --- | --- | --- |
| `UserModelSchema`（`type`，第 22 行附近） | `MongoUser` 的模型类型，§3.2 / §3.5 的 `findOne({ mustChangePassword: true })`、`$set: { mustChangePassword }` 依赖它 | 新增 `mustChangePassword?: boolean` |
| `UserSchema`（zod，第 37 行附近） | 接口 DTO，前端 `userInfo` 的契约 | 新增 `mustChangePassword: z.boolean().optional()` |

> 两者命名相近但互不相干，**只改其中一个会导致 TS 编译失败**。
>
> **zod 侧为什么用 `.optional()` 而不是必填**：`getUserDetail` 虽是唯一的 `UserType` 构造点，但既有测试夹具（如 `packages/global/test/openapi/support/user/account/login/api.test.ts`）大量手写 `UserType` 字面量，设为必填会让它们全部编译失败；且同类字段 `passwordAvailable` 本身就是 `.optional()`。存量文档缺该字段时为 `undefined`，故 `getUserDetail` 用 `user.mustChangePassword === true` 显式收敛成布尔值，前端一律按 `=== true` 判定——**字段缺省的语义是「不强制改密」**，这与"目前只有 root 会被置位"的策略一致。

`getUserDetail` 在 `packages/service/support/user/controller.ts` 中返回该字段（当前返回值已有 `hasPassword` / `passwordAvailable` 两个同类字段，紧随其后添加）。前端从 `userInfo.mustChangePassword` 读取，**不新增接口请求**。

### 3.2 初始化改造

`packages/service/support/user/systemUser.ts`：

```ts
/** root 初始密码固定值。不再通过环境变量配置。 */
const DEFAULT_ROOT_PASSWORD = '123456';

/**
 * 需要回填强制改密标记的历史弱口令。
 *
 * `'1234'` 不是笔误：compose 锚点 `x-default-root-psw` 的取值一直是 `'1234'`
 * （deploy/version/main/docker-compose.template.yml:6），而 env.ts 的默认值是 `'123456'`。
 * 直接使用 compose 模板部署的存量实例，root 密码是 `'1234'` 而不是 `'123456'`，
 * 只比对新默认值会漏掉这批真实存在的弱口令部署。
 */
const LEGACY_WEAK_ROOT_PASSWORDS = ['1234', '123456'] as const;
```

`executeSystemUserCreation` 改为：

```ts
if (rootUser) {
  // FR-6：root 已存在时不再写 password 字段。
  // FR-7：若密码仍等于任一历史弱口令，回填强制改密标记（幂等，覆盖存量部署）。
  const isStillWeakPassword = await MongoUser.exists({
    _id: rootUser._id,
    password: { $in: LEGACY_WEAK_ROOT_PASSWORDS.map(hashStr) }  // setter 会再 hash 一次，与库中双层值一致
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
    [{ username: 'root', password: hashStr(DEFAULT_ROOT_PASSWORD), mustChangePassword: true }],
    { session, ordered: true }
  );
  return _id;
}
```

要点：

- **删除了原有的密码覆盖写入**。`defaultRootPassword` 参数、`initSystemUser({ defaultRootPassword })` 的调用点一并从 `instrumentation-node.ts` 移除
- 默认密码比对复用 `assertNewPasswordDiffersFromCurrent` 已验证过的模式：查询条件里的 `password` 会经 schema setter 再哈希一次，因此传入 `hashStr(明文)` 才能匹配库中的双层值（已实测确认 setter 对查询条件生效）。`password` 的 `select: false` 不影响 `exists()` 的过滤条件。`$in` 的每个元素都会被 setter 逐个哈希
- **`'1234'` 是比较值之一，不是笔误**：见上方常量注释。漏掉它会导致「用 compose 模板部署、root 密码仍是 `1234`」的存量弱口令实例升级后不被强制改密
- **未覆盖的存量**：`install.sh` 随机生成的 8 字节 hex 密码不属于弱口令，**有意不纳入**比对（强制改密对随机强口令是打扰）。这是 FR-7 的预期边界，不是缺陷
- 回填是**幂等**的，每次启动都会重新判定，因此天然覆盖：
  - 全新部署（创建时置位）
  - 存量弱口令部署（首次升级后启动时回填）
  - 管理员用脚本把密码重置回弱口令的场景
- 日志调整：区分「新建 root」与「复用 root」两条路径；**新建 root 时输出 `warn`**，作为弱口令的唯一预警位

### 3.3 强制改密：接入现有编排器

复用 §2.4 的框架，最小改动：

| 落点 | 改动 |
| --- | --- |
| `postLoginAction.ts` | `PostLoginAction` 联合类型新增 `'forcePasswordChange'`；加入 `MANDATORY_POST_LOGIN_ACTIONS` |
| `postLoginAction.ts` | `getNextPostLoginAction` 的 `candidates` **首位**插入 `mustChangePassword ? 'forcePasswordChange' : undefined`，优先于 `resetExpiredPassword` |
| `PostLoginActionOrchestrator.tsx` | `POST_LOGIN_ACTION_VIEWS` 新增 `forcePasswordChange` 分支，渲染新的 `ForceChangePasswordModal` |
| `PostLoginActionOrchestrator.tsx` | 传入新的入参 `mustChangePassword: userInfo?.mustChangePassword === true` |

**触发条件用字段，不用 `isRoot`**：弹窗由 `userInfo.mustChangePassword === true` 驱动（FR-5 的字段是唯一判定依据）；「当前只有 root 会被置位」是 §3.2 的初始化策略，不是前端的判断依据。这样未来扩展其他内置账号时无需改前端。

#### 为什么新增动作，而不是复用「密码过期」通道

§2.7 查到的 `checkPswExpired` + `resetExpiredPassword` 是最接近的既有能力，但**不复用**，理由如下：

| 维度 | 复用过期通道 | 新增 `forcePasswordChange` 动作（采用） |
| --- | --- | --- |
| 语义 | 把「必须改密」塞进「密码已过期」，函数名与行为不符 | 两个动作语义独立，互不干扰 |
| 强制级别 | `resetExpiredPassword` 在 `candidates` 中属**可选**动作，被 `canStartOptional`（含 `isPlus`、且需等未读通知查询 settle）门控 | `forcePasswordChange` 进 `MANDATORY_POST_LOGIN_ACTIONS`，走 `canStartMandatory`，不被未读通知阻塞 |
| 触发改动面 | 需改 `baseReady` / `canStartOptional`，会波及全部可选动作 | 只改 `canStartMandatory` 一行，见 §3.6 |
| 表单 | `ResetExpiredPswModal` 固定渲染 `<PasswordChangeModal required>`（走 pro 验证流程），与 FR-3「只要新密码+确认」冲突，仍需换组件 | 直接用新组件，无历史包袱 |
| 过期策略耦合 | `checkPswExpired` 对 root 已 `return false`，需要拆掉该短路，影响既有行为 | 不触碰 |

代价是新增一个动作与一个组件；收益是**过期策略与强制改密彻底解耦**，且改动面更小。`ResetExpiredPswModal` 作为「不可关闭弹窗」的现成范例被参考，但不复用其代码。

### 3.4 强制改密弹窗

新增 `projects/app/src/components/support/user/safe/ForceChangePasswordModal.tsx`。

**不改造 `PasswordChangeModal`**：它的状态机已有 `prompt / authorizing / verification / unavailable / password` 五态，再塞入 forced 模式会让职责进一步混乱。

> **实施定稿（与初稿的偏离）**：初稿计划把「新密码 + 确认密码」表单抽成可复用组件 `PasswordForm` 供两个弹窗共用；**实际未抽取**，新弹窗自带独立表单。原因是 `PasswordChangeModal` **没有任何单测覆盖**（`projects/app/test` 下无对应用例），而它是五态状态机，为抽表单而动它的回归风险高于此处约 45 行 JSX 的重复。`ForceChangePasswordModal` 的注释里记录了这一取舍。

行为：

- 渲染**旧密码 / 新密码 / 确认密码**三个输入，校验规则复用 `checkPasswordRule` 与「两次输入一致」
- **不可关闭**（对齐 `ResetExpiredPswModal` 的 `required` 语义）——这是它相对常规改密弹窗的**唯一**交互差异
- 提交调用 §3.5 的 `forceUpdate` 端点（**不是** `update`），成功后 `await initUserInfo()` 刷新 `userInfo.mustChangePassword`，再回调 `onFinishOneTimeAction('forcePasswordChange')` 释放编排锁
- 失败处理：`oldPasswordError` → 「旧密码错误」、`newPasswordSameAsOld` → 「密码未变化」、`passwordChangeAuthorizationInvalid` → 释放编排锁（见 §3.5）、其他 → 「密码更新失败」

> **必须调用 `initUserInfo()`**：`mustChangePassword` 存在 `userInfo` 上，不刷新会导致弹窗在锁释放后立刻重新弹出。

### 3.5 强制改密提交接口：独立端点

**调研结论**：常规改密走的 `POST /support/user/account/password/update` 依赖 pro 签发的**限时一次性凭证**（`passwordChangeSession`，TTL 5 分钟）。

初版据此**复用**了该端点，用「是否携带凭证」区分两条路径；**实施定稿改为拆出独立端点**，原因：

- 用「字段缺省」表达「我要走强制改密」是**隐式分支**——调用方忘带凭证与有意走强制改密，服务端分不出来
- `passwordChangeSession` 一旦改为可选，该端点「必须先经过身份验证」的契约保证就没了
- 两条路径信任模型不同（「验证过身份」 vs 「账号被标记 + 旧密码正确」），将来要分别限流、分别审计、或按 NFR-1 单独加后端拦截，都得先拆开

**两个端点的分工**

| 端点 | 授权依据 | 请求体 | 依赖 pro |
| --- | --- | --- | --- |
| `POST /support/user/account/password/update`（既有） | pro 签发的一次性 `passwordChangeSession` | `{ newPsw, passwordChangeSession }` | 是 |
| `POST /support/user/account/password/forceUpdate`（新增） | `mustChangePassword === true` **且** 旧密码正确 | `{ oldPsw, newPsw }` | **否** |

`update.ts` 的 `passwordChangeSession` **保持必填**、单路径不变，唯一改动是去掉 `isRoot` 拦截（支持 FR-4）。

**新增请求契约**（`packages/global/openapi/support/user/account/password/api.ts`）：

```ts
export const ForceUpdatePasswordBodySchema = z
  .object({
    oldPsw: z.string().length(64),   // 客户端 SHA-256 摘要，交由服务端比对
    newPsw: z.string().length(64)
  })
  .strict();
```

**新增端点**（`projects/app/src/pages/api/support/user/account/password/forceUpdate.ts`）：

```ts
const { userId, sessionId, tmbId, teamId } = await authCert({ req, authToken: true });
if (!sessionId) return Promise.reject(ERROR_ENUM.unAuthorization);

await assertPasswordUpdateRateLimit({ account: userId, limit: serviceEnv.PASSWORD_LOGIN_MINUTE_LIMIT_COUNT });

await withUserLock(userId, async () => {
  const user = await MongoUser.findById(userId);
  if (!user) throw new Error('Failed to update password');
  assertUserPasswordAvailable(user.username);

  await forceUpdatePassword({ userId, oldPassword: body.oldPsw, newPassword: body.newPsw });

  await delUserAllSession(userId, [sessionId]);
});
void addAuditLog({ tmbId, teamId, event: AuditEventEnum.CHANGE_PASSWORD, params: {} });
```

**新增服务函数**（`packages/service/support/user/account/password/service.ts`）：

```ts
export const forceUpdatePassword = async ({ userId, oldPassword, newPassword }) =>
  mongoSessionRun(async (session) => {
    // 授权第 1 层：账号确实处于「必须改密」状态（判定期与写期同条件，fail-closed）
    const isForcedChangePending = await MongoUser.exists({
      _id: userId,
      mustChangePassword: true
    }).session(session);
    if (!isForcedChangePending) {
      throw new UserError(UserErrEnum.passwordChangeAuthorizationInvalid);
    }

    // 授权第 2 层：旧密码比对（不依赖 pro）。入参是 64 位 SHA-256 摘要，
    // schema setter 会再哈希一次，因此与库中的双层值直接匹配。
    const isOldPasswordMatched = await MongoUser.exists({
      _id: userId,
      password: oldPassword
    }).session(session);
    if (!isOldPasswordMatched) throw new UserError(UserErrEnum.oldPasswordError);

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

**关键设计点**：

- **两层授权，缺一不可**：`mustChangePassword === true` **且**旧密码正确。前者 fail-closed（标记缺失即拒绝，与凭证失效返回同一错误语义、不泄露账号状态）；后者是评审后新增的一层，直接来自「强制改密也要填旧密码」的需求。
- **判定期与写期同一条件**：`exists` 与 `updateOne` 都带 `mustChangePassword: true`，同处一个 Mongo 事务，杜绝并发下重复利用。
- **不依赖 pro**：旧密码校验放在本服务端（而不是交给 pro 的 authorization 流程），这是拆出独立端点之外的关键收益——社区版同样可用（对齐 NFR-4）。
- **新增错误码 `UserErrEnum.oldPasswordError`**：映射到既有文案 `common:user.Old password is error`。不复用登录用的 `account_psw_error`，避免把「账号或密码错误」这种登录语境文案暴露在改密表单里。
- **两条改密路径都必须复位标记**（评审补充）：`forceUpdatePassword`（forceUpdate 端点）与 `updatePasswordWithChangeSession`（update 端点）的 `$set` **都要写 `mustChangePassword: false`**。只在强制路径复位会导致——处于强制改密态的账号若从「个人信息」走常规路径完成改密，标记滞留 `true`，前端那个**不可关闭**的强制弹窗会再次弹出。
- **前端必须处理 `passwordChangeAuthorizationInvalid`**（评审补充）：该错误表示标记已被别处清除（例如另一标签页已完成改密）。此时弹窗不可关闭，若只弹通用错误会把用户卡死（只能刷新页面）。`ForceChangePasswordModal` 收到该错误时应 `initUserInfo()` 刷新并释放编排锁。
- 复用现有 `withUserLock`、限流、SSO 闸门、会话注销、审计日志，不重复实现。
- 审计目前沿用 `ChangePassword` 事件；设计初稿建议的独立事件 `FORCE_CHANGE_PASSWORD` **未落地**（需同步 `packages/web/support/user/audit/constants.ts` 的 `auditLogMap` + 4 语种文案，初稿标为可选）。若需要按端点区分审计，这是一处待补项。

### 3.6 解除对 pro 的依赖（NFR-4）

强制改密路径**不经过 pro**（§3.5 路径 B 只需登录会话），但编排器入口当前被 `baseReady = isPlus && !!userId && !!teamId` 门控。若保持原样，社区版（无 pro）的 root 会被弹窗逻辑跳过——**FR-2「首次进入强制改密」在社区版直接失效**（虽仍有 §3.8 脚本可用，但被动强制这道防线没了）。

**采用最小改写：只放宽强制门槛，`candidates` 只新增一项、不改动既有项。**

```ts
// 既有 isPlus 门保持不变；「必须改密」额外放开，
// 使社区版 root 也能完成一次性强制改密（FR-2 + NFR-4）。
const canStartMandatory =
  (isPlus || mustChangePassword) && !!userId && !!teamId && canRunMandatoryActions;
```

`getNextPostLoginAction` 的 `candidates` **仅在首位插入一项**，其余原样保留：

```ts
const candidates = [
  mustChangePassword ? 'forcePasswordChange' : undefined,
  inviteLinkId ? 'invitation' : undefined,          // 原样，不加 isPlus 门
  hasPendingMemberName ? 'memberName' : undefined,  // 原样，不加 isPlus 门
  isPlus ? 'resetExpiredPassword' : undefined,
  ...
];
```

**为什么不能给 `invitation` / `memberName` 补 `isPlus` 门**：`memberName` 在本代码库中被**刻意设计为不依赖 isPlus**，`projects/app/test/components/Layout/postLoginAction.test.ts:124-138` 有专门断言：

```ts
it('supports non-plus member-name actions without adding plus-only actions', () => {
  expect(getNextPostLoginAction({
    canStartMandatory: true, canStartOptional: true, completed: new Set(),
    inviteLinkId: '', hasPendingMemberName: true, shouldShowContact: false,
    contactHandled: false, isPlus: false, hasImportantInform: true
  })).toBe('memberName');
});
```

补门会直接打挂该用例，且与 `postLoginAction.ts` 中"强制动作属于必须完成的数据补齐"的注释意图相悖。`invitation` 同理（`candidates` 首位，无 isPlus 条件）。

**行为影响分析**（`forcePasswordChange` 恒为 `candidates` 首位，插入是无条件的——否则 NFR-4 无法解锁社区版。因此需要分**门控**与**候选顺序**两个维度看）：

| `isPlus` | `mustChangePassword` | 门控 `canStartMandatory` | 候选顺序 | 场景 |
| --- | --- | --- | --- | --- |
| `true` | `false` | 不变（`isPlus \|\| false` = `true`，原本也是 `true`） | 不变（`forcePasswordChange` 不参与） | pro 版普通用户 |
| `true` | `true` | 不变（恒 `true`） | **改变**：`forcePasswordChange` 抢在 `invitation` / `memberName` 之前 | **pro 版 root 本人——这正是本次需求目标** |
| `false` | `false` | 不变（`false \|\| false` = `false`） | 不变 | 社区版普通用户 |
| `false` | `true` | **改变**：由 `false` 变 `true` | **改变**：`forcePasswordChange` 抢在 `invitation` / `memberName` 之前 | 社区版 root——NFR-4 要解锁的场景 |

> **`isPlus=true` 并不等于「完全一致」**：上一版文档这样写过，是错的。`mustChangePassword=true` 时（root 本人）候选顺序确实改变，`forcePasswordChange` 会先于 `invitation` 弹出——这是 FR-2 的既定行为，不是回归。变化被严格限定在 `mustChangePassword=true` 的账号上。

`isPlus=false` 且 `mustChangePassword=true` 时，`invitation` / `memberName` 会同时变为准入，但 `forcePasswordChange` 位于 `candidates` 首位，会先被选中；改密成功后 `initUserInfo()` 刷回 `mustChangePassword=false`，门槛恢复原状。存在一个极窄的时序窗口（改密完成但 `userInfo` 尚未刷新），此时若 `forcePasswordChange` 已在 `completed` 中，`memberName` 可能弹出——这是社区版本就应发生的正常数据补齐，不构成缺陷。

> **入参必须设为可选**：`getNextPostLoginAction` 新增 `mustChangePassword` 时，若声明为必填会打挂 `postLoginAction.test.ts:13-29` 的 `getAction` 辅助函数（固定对象字面量，缺该字段）。应声明为 `mustChangePassword?: boolean`，缺省按 `false` 处理。

> **FR-4 在社区版不可达（已确认接受）**：`canManagePasswordFromAccountInfo` 要求 `isPlus === true`，本节只解决「强制改密不被锁死」。**社区版不提供页面自助改密入口，由 §3.8 容器脚本兜底**——这是已确认的产品边界，不改该入口。

> **越权约束**：本节放开了强制改密的 `isPlus` 门，因此必须同时满足「任何人不能借此随便改 root 密码」。完整的授权来源、目标账号来源、字段写入面与护栏清单见 §3.9。核心结论：强制分支的目标账号恒为 `authCert` 解析出的本人 `userId`，且授权条件 `mustChangePassword === true` 只能由受信路径写入。

### 3.7 移除 `DEFAULT_ROOT_PSW`

按 §2.6 的清单执行，分三类：

**（a）代码与配置**

- `projects/app/src/env.ts` 删除 `DEFAULT_ROOT_PSW` 声明
- `projects/app/.env.template` 删除该行
- `projects/app/src/instrumentation-node.ts` 改为 `initSystemUser()`（无参）
- `packages/service/support/user/systemUser.ts`：删除 `defaultRootPassword` 参数与 `fromEnvPassword` 日志字段，改用 `DEFAULT_ROOT_PASSWORD` 常量

**（b）部署与安装脚本**

- `deploy/version/main/docker-compose.template.yml` 删除 `x-default-root-psw` 锚点与引用
- `document/public/deploy/docker/main/{cn,global}/docker-compose.*.yml` 同步（12 个文件）
- `document/public/deploy/install.sh`（关键，见下方展开）
- `document/public/deploy/SKILL.md` 的第 5 条登录提示同步

**`install.sh` 的具体改动**

现状（§2.5）是安装时随机化 root 密码并打印：

```bash
ROOT_LOGIN_PASSWORD="1234"
root_password="$(random_hex 8)"
if LC_ALL=C grep -Eq "x-default-root-psw: &x-default-root-psw ['\"]1234['\"]" docker-compose.yml; then
    ROOT_LOGIN_PASSWORD="$root_password"
    replace_text "x-default-root-psw: &x-default-root-psw '1234'" "x-default-root-psw: &x-default-root-psw '$root_password'"
    ...
else
    ROOT_LOGIN_PASSWORD="请查看 docker-compose.yml 中 DEFAULT_ROOT_PSW"
fi
```

改为：

- 删除 `root_password` 变量声明与 `root_password="$(random_hex 8)"` 赋值
- **删除两处 `grep ... x-default-root-psw ... 1234` 守卫及其整个 `if/else`**：
  - 第 721 行（`randomize_compose_credentials` 内）
  - **第 1278-1283 行（`AUTO_GENERATE_CREDENTIALS=false` 的 else 分支）**——这里容易漏：若只把第 1279 行的字面量改成 `123456` 而保留第 1278 行的守卫，锚点已在 (a)/(b) 从 compose 模板移除 → `grep` 永不匹配 → 走 else 分支 → 最终打印出「请查看 docker-compose.yml 中 DEFAULT_ROOT_PSW」这句**已经失效的提示**
- **`ROOT_LOGIN_PASSWORD` 采用单一赋值**：第 692 行的全局默认直接设为 `123456`，第 1278-1283 行整个 `if/else` 删除（不再需要运行时判定）
- 第 1419 / 1430 行的最终输出改为显式提示强制改密，例如：

  ```
  5. 登录服务:   默认账号 'root'，初始密码 '123456'
                 （首次登录会强制要求修改密码，请提前准备新密码）
  ```

> **注意随机化的移除以「默认密码固定」为前提**：`123456` 是弱口令，安全性完全由 §3.2（默认即置 `mustChangePassword`）+ §3.3（登录后强制改密）承担。这也正是本需求必须把强制改密做完整的原因——否则安装脚本从「随机强密码」退化成「公开弱口令」是一次净安全下降。

**（c）文档与 i18n**

- `document/content/self-host/config/env.mdx` + `.en.mdx` 删除 `DEFAULT_ROOT_PSW` 行
- `document/content/self-host/troubleshooting/faq.mdx` + `.en.mdx`：「如何修改 root 密码」改为「页面修改 / 容器脚本重置」两条路径
- `document/content/self-host/deploy/docker.mdx` + `.en.mdx` 同步
- `packages/web/i18n/{zh-CN,zh-Hant,en,ko-KR}/login.json` 的 `root_password_placeholder` 改为「root 初始密码为 123456，首次登录需修改」

`account_info:root_password_change_tip` **不做文案改写**：§3.3 删掉 `handlePasswordAction` 的 `isRoot` 分支后，该 key 在 pro / 社区版都没有渲染点了（社区版整行被 `canManagePasswordFromAccountInfo` 隐藏），改 4 个语种属无用功。保留旧值即可，后续清理死词条时一并处理。

### 3.8 容器内重置 root 密码脚本（FR-8）

**形态**：源码 `projects/app/scripts/reset-root-password.mjs`，经 esbuild 打包为 `projects/app/scripts/dist/reset-root-password.cjs`，镜像里跑的是**打包产物**。

**为什么必须打包**（这是实测结论，初稿判断错了）：

Next.js standalone 在 pnpm 工作区下，`/app/node_modules` 顶层**只有 `.pnpm` 和手工 COPY 的 `@zilliz`**，没有包入口。因此放在 `/app/scripts/` 的脚本**无法解析 `import 'mongodb'`**，运行时报 `Cannot find package 'mongodb'`；`require.resolve` 断言也会在构建期直接失败。同仓库 Dockerfile 里既有的 `COPY --from=maindeps .../@zilliz/milvus2-sdk-node` 就是这个问题的产物。

补软链可以绕开，但依赖 `.pnpm` 的目录布局。**与 `build-workers.ts` 一致的打包才是正解**：依赖直接 inline，产物自包含，镜像只需 COPY 一个文件。

| 约束 | 说明 |
| --- | --- |
| **必须 `format: 'cjs'`** | 把 `mongodb` 这类 CJS 依赖打进 ESM 产物，运行时会抛 `Dynamic require of "timers" is not supported`（esbuild 已知限制）。实测 CJS 输出可正常构造 `MongoClient` |
| **不做入口守卫** | CJS 产物里 `import.meta.url` 为 `undefined`，入口判断会**静默失效**（`main()` 永不执行），且 esbuild 会为此刷 warning。本文件就是 CLI 入口，无条件执行 `main()` |
| 不 minify、不 drop console | 产物是运维工具，需可读；且脚本的 stdout/stderr 就是输出通道 |
| 产物不进 git | `.gitignore` 中已有的 `dist/` 规则不带中间斜杠、在任意层级生效，`projects/app/scripts/dist/` 天然被忽略，**无需新增规则**（与 `projects/app/worker/` 同理） |

构建接线：新增 `scripts/build-cli-scripts.ts` 与 `build:cli-scripts` 脚本，串进 `dev` / `build` / `build:webpack`；`reset:root-psw` 则先构建再跑产物，保证本地跑的就是镜像里跑的那份。

```bash
# 密码走环境变量，不进 shell history / ps
docker exec -e ROOT_PSW='Xxx@12345' fastgpt node /app/scripts/reset-root-password.cjs

# 从 stdin（不留任何落盘痕迹）
docker exec -i fastgpt node /app/scripts/reset-root-password.cjs --stdin < ./new-psw.txt

# 预演：只打印将要执行的变更
docker exec -e ROOT_PSW='...' fastgpt node /app/scripts/reset-root-password.cjs --dry-run
```

参数：`--user <name>`（默认 `root`）、`--stdin`、`--dry-run`、`--force`、`--help`。

**哈希协议（最容易做错的地方）**

脚本绕过了 mongoose schema 的 `set` 钩子，必须自己算出双层哈希：

```js
computeStoredPasswordHash(plaintext) === sha256(sha256(plaintext))
```

该函数独立导出并配单测锁死协议，将来有人改 schema setter 时测试会失败。

**强度校验：必须重写，无法复用**

`checkPasswordRule` 位于 `packages/global/common/string/password.ts`，是 TS 源码，`.mjs` 无法 import。脚本内需重写一份等价规则（8–100 位、需满足数字/小写/大写/特殊字符四类中的至少两类）。

> **已知漂移风险**：规则被复制成两份，源规则变更时脚本不会自动跟随。缓解手段是单测——用同一组样本同时喂给 `checkPasswordRule`（测试可 import TS）与脚本内实现，断言结果一致。若不接受这份重复，替代方案是把规则抽到一个 `.mjs`/`.cjs` 双端共享的模块，但会牵动 `packages/global` 的构建配置，收益不划算，暂不采用。

**字段维护**

脚本写入的字段与 §3.5 页面改密路径**完全对齐**，共三个：

| 字段 | 写入值 |
| --- | --- |
| `password` | `computeStoredPasswordHash(明文)` |
| `passwordUpdateTime` | 当前时间（与页面改密一致，保持字段语义连续） |
| `mustChangePassword` | 命中 `LEGACY_WEAK_ROOT_PASSWORDS`（§3.2，`['1234','123456']`）则 `true`，否则 `false` |

`mustChangePassword` 的规则——重置到已知弱口令应当再次强制修改，重置到强密码则不应无谓打扰。**该常量必须与 §3.2 保持一致**，单测覆盖这一致性。

> root 的 `checkPswExpired` 被 [checkPswExpired.ts:17](projects/app/src/pages/api/support/user/account/password/checkPswExpired.ts#L17) 短路为 `false`，因此 `passwordUpdateTime` 对 root 不参与过期判定；仍然写入是为了不留下「脚本改过密码但时间戳没动」的语义断层。

**不写任何其他字段**：脚本的 `updateOne` 只 `$set` 上表三项，不触碰 `username`、`status`、`tags` 等（对齐 NFR-2）。

**会话处理（NFR-2）**

**不吊销会话**。会话仅存 `userId / teamId / tmbId / isRoot`，不校验密码，因此重置后已有登录态仍然有效——这是已确认接受的取舍。

**接入镜像**（`projects/app/Dockerfile` runner 阶段）

```dockerfile
COPY --from=builder --chown=nextjs:nodejs /app/projects/app/scripts/dist/reset-root-password.cjs /app/scripts/reset-root-password.cjs
RUN node /app/scripts/reset-root-password.cjs --help
```

构建期**直接跑一次 `--help`**：产物自包含，失败即退出非零，比"断言依赖可解析"更贴近真实执行路径（沿用现有 `RUN node -e "require('/app/worker/node_modules/@fastgpt-sdk/anydoc')"` 的 fail-fast 风格）。

**边界行为**

- root 不存在 → **报错退出，不静默创建**（避免在异常环境里凭空造出超级管理员）
- 连不上 Mongo → 非零退出码 + 结构化错误输出
- 默认按 `checkPasswordRule` 校验强度，不达标拒绝，需 `--force` 显式覆盖
- 幂等：重复执行结果一致

**审计**：`addAuditLog` 需要 `tmbId / teamId` 上下文，脚本没有。改为向 stdout 输出结构化记录（操作时间、目标账号、是否处于强制改密态），由运维日志采集覆盖。若后续要求入库审计，再补充直接写入审计集合的实现。

### 3.9 越权分析：谁能改 root 密码

强制改密不判断 `isPlus`（NFR-4），因此必须逐条排除「随便修改 root 密码」的路径。

**改密的授权来源只有三种，且互不交叉**

| 路径 | 授权依据 | 能否指定目标账号 |
| --- | --- | --- |
| 页面日常改密（`password/update`） | pro 签发的一次性 `passwordChangeSession`，绑定 `data.userId` + `data.loginSessionId`，TTL 5 分钟、一次性消费 | **否** |
| 强制改密（`password/forceUpdate`） | **两层**：① `mustChangePassword === true`（该过滤条件在 `exists` 与 `updateOne` 两期一致、同处一个 Mongo 事务）；② 提交的旧密码与库中一致 | **否** |
| 容器脚本（§3.8） | 容器内进程 + 直连 Mongo 的凭证 | 是（`--user`，默认 root），但需要宿主机/容器执行权限 |

**关键性质：目标账号永远来自 `authCert` 解析出的 `userId`，不接受请求体传入。** 两个端点中 `userId` 都只从令牌解析（`const { userId, sessionId, tmbId, teamId } = await authCert({ req, authToken: true })`）；请求体 schema（`UpdatePasswordBodySchema` / `ForceUpdatePasswordBodySchema`）都是 `.strict()` 且**没有目标用户字段**。因此不存在"A 用自己的会话改 B 的密码"的构造。

**旧密码这一层的作用**：它是「强制改密也要填旧密码」这个需求落地的同时带来的收益——持有 root 会话的人**仍须知道当前密码**才能改密，而不是凭一个 `mustChangePassword` 标记就能直接覆盖。

**`mustChangePassword` 不能被请求体写入**（逐点核查）

- 非测试代码中 `MongoUser.updateOne` 的调用点只有两处：
  - `packages/service/support/user/account/password/service.ts:100` —— `$set` 为显式字面量
  - `projects/app/src/pages/api/support/user/account/update.ts:36` —— `$set` 由显式拣选构造 `{...(timezone && { timezone }), ...(language && { language })}`，且入参经 `parseApiInput` 的 `UpdateUserAccountBodySchema` 校验（字段为 `avatar` / `timezone` / `language`，另有一个已废弃的 `balance`），**无法透传任意字段**
- 本仓库 `projects/app/src/pages/api/admin/**` 下**没有任何写用户密码的接口**（管理员改密走 proApi，不在本仓库）
- 因此 `mustChangePassword` 只能由受信路径写入：初始化（§3.2）、容器脚本（§3.8）；pro 管理端的集成点见 R12

**其余护栏（全部复用现有实现，不新增）**

| 护栏 | 实现 | 对强制分支是否生效 |
| --- | --- | --- |
| 限流 | `assertPasswordUpdateRateLimit`（按账号） | 生效（在分支之前） |
| 用户级互斥 | `withUserLock(userId)` | 生效（包裹全部分支） |
| SSO 策略闸门 | `assertUserPasswordAvailable(user.username)` | 生效 |
| 会话注销 | `delUserAllSession(userId, [sessionId])` | 生效 |
| 审计 | `addAuditLog` | 生效 |
| 新密码 != 旧密码 | `assertNewPasswordDiffersFromCurrent` | 强制分支内同样调用 |

**已声明并接受的残余风险**：持有 root 会话者需要在 `mustChangePassword=true` 期间同时提供正确的旧密码才能改密（旧密码校验见 §3.5）；未改密的 root 仍可直接调用业务 API（NFR-1 / R2）。后者不构成**新增**越权——能拿到 root 会话者本已等同 root 权限。

**设计上刻意不做**：不提供任何「管理员指定账号改密」的 HTTP 接口。若未来确需，必须走独立的管理端鉴权路径并单独评审，不能挂在本文的强制改密分支上。

---

## 四、影响面汇总

| 层 | 文件 | 改动性质 |
| --- | --- | --- |
| 数据模型 | `packages/service/support/user/schema.ts` | 新增字段 |
| 数据类型 | `packages/global/support/user/type.ts` | 新增字段（`UserModelSchema` + `UserSchema` 两处） |
| 用户详情 | `packages/service/support/user/controller.ts` | 返回新字段 |
| 初始化 | `packages/service/support/user/systemUser.ts` | 删除密码覆盖、新增回填 |
| 初始化入口 | `projects/app/src/instrumentation-node.ts` | 去掉参数 |
| 环境变量 | `projects/app/src/env.ts`、`.env.template` | 删除 `DEFAULT_ROOT_PSW` |
| 改密服务 | `packages/service/support/user/account/password/service.ts` | 新增 `forceUpdatePassword` |
| 改密接口 | `projects/app/src/pages/api/support/user/account/password/update.ts` | 仅去掉 `isRoot` 拦截（单路径不变） |
| 改密接口（新增） | `projects/app/src/pages/api/support/user/account/password/forceUpdate.ts` | 新增，强制改密专用端点 |
| 接口契约 | `packages/global/openapi/support/user/account/password/api.ts`、`index.ts` | 新增 `ForceUpdatePasswordBodySchema` 与 `/forceUpdate` 路径；`UpdatePasswordBodySchema` **不变**（`passwordChangeSession` 仍必填） |
| 客户端封装 | `projects/app/src/web/support/user/account/password/api.ts` | 新增 `forceUpdatePassword()`；`updatePassword()` 签名**不变** |
| 错误码 | `packages/global/common/error/code/user.ts` | 新增 `UserErrEnum.oldPasswordError` + 映射 |
| 审计 | `packages/global/support/user/audit/constants.ts` | 可选新增 `FORCE_CHANGE_PASSWORD` |
| 编排器 | `projects/app/src/components/Layout/postLoginAction.ts`、`PostLoginActionOrchestrator.tsx` | 新增动作与门控调整 |
| 前端组件 | 新增 `ForceChangePasswordModal.tsx`（自带表单，不抽取 `PasswordForm`，见 §3.4） | 新增 |
| 个人信息页 | `projects/app/src/pages/account/info/index.tsx` | 去掉 root 短路 |
| 部署 | `deploy/version/main/*`、`document/public/deploy/**` | 删除 env、调整 install.sh |
| 文档 | `document/content/self-host/**` | 删除 env、更新改密说明 |
| i18n | `login.json`（4 语种） | 文案更新（`account_info:root_password_change_tip` 变成死词条，不改） |
| 脚本 | 新增 `projects/app/scripts/reset-root-password.mjs`（源）+ `scripts/dist/*.cjs`（打包产物，gitignore）；新增 `scripts/build-cli-scripts.ts`；`projects/app/Dockerfile`、`package.json`、`.gitignore` | 新增 |

---

## 五、风险与待确认

| 编号 | 风险 | 处置 |
| --- | --- | --- |
| R1 | **前端强度校验是唯一闸门**。协议只传客户端算好的 sha256 摘要（`newPsw` 为 64 位 hex），服务端拿不到明文，无法执行 `checkPasswordRule` | 既有属性，非本次引入。记录为已知限制 |
| R2 | **强制改密仅由前端弹窗驱动，可被绕过**（用户已确认接受）。未改密的 root 仍可直接调用业务 API | 已确认。若后续需要收紧，可在鉴权中间件增加白名单拦截，届时把状态判定收敛到一处即可复用 |
| R3 | **一键安装脚本行为变更**：从「随机密码」变为「固定 123456 + 首次强制修改」 | 需同步升级说明，避免运维按旧习惯找随机密码 |
| R4 | **存量弱口令部署升级后 root 首次登录会被强制改密** | 预期行为。覆盖范围见 §3.2：`'1234'`（compose 锚点默认值）与 `'123456'`（env 默认值）都在比对列表内，`install.sh` 生成的随机密码**有意不覆盖**。需写入升级说明 |
| R5 | **root 忘记密码时无法自助找回**（无邮箱 / 手机绑定，`updateByCode` 不可用） | 由 §3.8 容器脚本兜底，这是该脚本的主要存在理由 |
| R6 | **容器脚本绕过 schema 直写库** | 用共享纯函数 + 单测锁定哈希协议；`--dry-run` 提供预演 |
| R7 | **`candidates` 新增首位项影响既有动作顺序** | §3.6 采用「只新增、不改动既有项」的最小改写，改动仅限 `mustChangePassword=true` 的账号。需回归 `postLoginAction.test.ts` 全部用例 |
| R8 | pro 侧对 root 的 `oldPassword` 验证是否放行 | 已确认 pro 可修改。实现前用 root 会话调 `/proApi/.../password/authorization {source:'verificationMethod'}` 验证返回 `verificationRequired: oldPassword`；若否，需 pro 侧放开 `allowPasswordFallback` |
| R9 | **FR-4「随时在页面自助改密」在社区版不可达**：`canManagePasswordFromAccountInfo` 要求 `isPlus === true` | **已确认接受**：社区版不提供页面自助改密入口，由 §3.8 容器脚本兜底。不改该入口 |
| R10 | **`checkPasswordRule` 在脚本内被复制成第二份实现** | 单测用同一组样本同时喂给源实现与脚本实现，断言结果一致（见 §3.8） |
| R11 | **standalone 产物是否含 `mongodb` 驱动未经实测** | Dockerfile 构建期 `require.resolve` 断言兜底，构建失败即暴露（见 §3.8） |
| R12 | **pro 管理端重置用户密码时不会同步置位 `mustChangePassword`** | 本仓库 `pages/api/admin/**` 无写密码接口，管理员改密在 proApi。若 pro 管理端重置 root 密码，root 不会被强制改密（密码本身已足够强时可接受）。需在 pro 侧确认是否要同步该字段——这是一个**跨仓库集成点**，不阻塞本次改造 |

---

## 六、测试计划

| 层 | 用例 |
| --- | --- |
| `systemUser.test.ts` | **新增**：root 已存在时**不得**写 `password` 字段（现有 4 个用例 `findOne` 全返回 `null`，该分支从未被覆盖） |
| `systemUser.test.ts` | root 存在且密码为 `'1234'` → 回填 `mustChangePassword=true`（**回归守卫**：漏掉这个值会让 compose 默认值部署不被覆盖） |
| `systemUser.test.ts` | root 存在且密码为 `'123456'` → 回填 `mustChangePassword=true` |
| `systemUser.test.ts` | root 存在且密码为强口令（如 `install.sh` 的随机 hex）→ **不改动** `mustChangePassword` |
| `systemUser.test.ts` | 新建 root 时 `mustChangePassword` 为 `true` |
| `systemUser.test.ts` | 重复执行初始化幂等：已置位时二次调用不报错、不重复写 |
| `update.test.ts` | 无 `passwordChangeSession` + `mustChangePassword=true` → 改密成功且字段复位 |
| `update.test.ts` | 无 `passwordChangeSession` + `mustChangePassword=false` → 拒绝（fail-closed） |
| `update.test.ts` | 无 `passwordChangeSession` + 账号不存在 → 拒绝 |
| `update.test.ts` | 并发两条无凭证请求（同一 `mustChangePassword=true`）→ 只有一条成功（判定期=写期生效） |
| `update.test.ts` | **改写既有用例**：`update.test.ts:275` 的 `rejects root even with a valid password change session` 断言 root 带合法凭证仍返回 500（依赖 `update.ts:29` 的 `\|\| isRoot`）。§3.5 去掉该拦截后此用例必失败，需**反转断言为成功**（含「root 改密后仅保留当前会话」的断言），而非新增一条并列用例 |
| `update.test.ts` | 无 `sessionId` 仍拒绝 |
| `postLoginAction.test.ts` | `mustChangePassword=true` 时 `forcePasswordChange` 优先于 `resetExpiredPassword`、`invitation`、`memberName`；完成后不再触发 |
| `postLoginAction.test.ts` | `mustChangePassword=false` / 未传该参数时，动作顺序与现有用例完全一致（回归守卫，保护 `getAction` 辅助函数与第 124 行的非 plus `memberName` 断言） |
| **越权专项** | 用户 A 的会话调用 `/password/update`：请求体即使携带 `userId`/`_id` 等额外字段，因 `UpdatePasswordBodySchema` 为 `.strict()`，必须被拒绝而非作用到目标账号（§3.9） |
| **越权专项** | `mustChangePassword=true` 的账号 A 无法通过 `/support/user/account/update` 把它写到别人身上（该接口的 `$set` 为显式拣选，无透传路径） |
| **越权专项** | 账号 A（`mustChangePassword=false`）不携带 `passwordChangeSession` 调用改密 → 拒绝，且**不泄露** A 是否处于强制改密态（与凭证失效返回同一错误语义） |
| 脚本单测 | `computeStoredPasswordHash` 与 schema setter 输出一致；脚本内强度校验与 `checkPasswordRule` 同源断言一致；`LEGACY_WEAK_ROOT_PASSWORDS` 与 §3.2 常量一致；`--dry-run` 不写库；目标账号不存在时报错 |
| 手工端到端 | 全新部署 → root 用 `123456` 登录 → 强制改密弹窗不可关闭 → 改密成功 → 重启服务密码不变 → 个人信息页修改密码走旧密码验证 → 脚本重置 → 新密码可登录 |

---

## 七、验证依据

本文的现状描述均以当前分支源码为准，关键结论的验证方式：

| 结论 | 依据 |
| --- | --- |
| `Document.updateOne(update, options)` 的签名与自动 `$set` 包装 | `mongoose@8.23.1` `lib/document.js:864`、`lib/query.js:4283`、`lib/helpers/query/castUpdate.js`；实测 `castUpdate({password:'x'})` → `{$set:{password:'x'}}` |
| 启动覆盖 root 密码 | `systemUser.ts` `executeSystemUserCreation`；上游旧实现见 `git show 2ec9c71cb^:projects/app/src/service/mongo.ts` |
| Mongoose 对查询条件也应用 `set` 钩子 | 实测：`Model.exists({password: hashStr('123456')})` 经 `cast()` 后过滤条件为 `hashStr(hashStr('123456'))`，与写入路径一致。§3.2 / §3.5 的双层哈希比对依赖此行为 |
| 该分支无测试覆盖 | `packages/service/test/support/user/systemUser.test.ts`，`mockUserFindOne.mockResolvedValue(null)` |
| root 被前端与接口双重拦截 | `account/info/index.tsx` `handlePasswordAction`；`password/update.ts` `if (!sessionId \|\| isRoot)` |
| `checkPswExpired` 对 root 短路 | `password/checkPswExpired.ts`，`if (isRoot) return false` |
| root 可降级为旧密码验证 | `packages/global/support/user/account/verification/utils.ts` `resolveAccountVerificationByUsername` |
| 强制改密框架已存在 | `postLoginAction.ts`、`PostLoginActionOrchestrator.tsx`、`ResetExpiredPswModal.tsx` |
| 一次性改密凭证 TTL 与消费语义 | `packages/service/support/user/account/password/service.ts` |
| 安装脚本随机化 root 密码 | `document/public/deploy/install.sh:692-726,1279,1419` |
| **compose 锚点默认值是 `'1234'` 而非 `'123456'`** | `deploy/version/main/docker-compose.template.yml:6`、`document/public/deploy/docker/main/cn/docker-compose.pg.yml:6` 均为 `'1234'`；`projects/app/src/env.ts:7` 的 `z.string().default('123456')` 只在 compose 未注入该变量时生效。这是 §3.2 `LEGACY_WEAK_ROOT_PASSWORDS` 必须同时含两个值的原因 |
| **`memberName` 刻意不依赖 isPlus** | `projects/app/test/components/Layout/postLoginAction.test.ts:124-138` 断言 `isPlus:false + hasPendingMemberName → 'memberName'`；`postLoginAction.ts:52-56` 注释说明强制动作是「必须完成的数据补齐」。这是 §3.6 不能给 `memberName` 补 `isPlus` 门的原因 |
| **`getNextPostLoginAction` 入参需可选** | `postLoginAction.test.ts:13-29` 的 `getAction` 辅助函数使用固定对象字面量，新增必填参数会导致 TS 编译失败 |
| 活跃 compose 文件为 12 个 | `document/public/deploy/docker/main/{cn,global}/` 各 6 个 `docker-compose.*.yml` |
| Next standalone 产物不含 `tsx` 与 `projects/app/scripts` | `projects/app/Dockerfile` runner 阶段仅 COPY standalone / static / i18n / server chunks / worker |
| `UserModelSchema` 与 `UserSchema` 是两个不同的类型 | `packages/global/support/user/type.ts`：前者是 `type`（第 18 行），后者是 zod（第 37 行） |
| **既有测试已锁定「root 不能改密」** | `projects/app/test/api/support/user/account/password/update.test.ts:275` `it('rejects root even with a valid password change session')`，以及该文件 `:63-68` 的 `getAuth(userId, isRoot)` 辅助函数 |
| **install.sh 有两处 grep 守卫** | 第 721 行（随机化分支内）与第 1278 行（`AUTO_GENERATE_CREDENTIALS=false` 的 else 分支），两处都需删除，只改字面量会打出失效提示 |
