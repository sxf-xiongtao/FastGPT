# FastGPT SSO 服务

这个服务是专门给私有化用户对接 SSO 的，如果不需要对接 SSO，则不需要使用这个服务。

## 开发方案

1. 安装 bun
2. 安装依赖 `bun install`
3. 启动 `npm run dev`
4. 打包：`docker buildx build --platform=linux/amd64  -f ./projects/sso/Dockerfile -t registry.cn-hangzhou.aliyuncs.com/fastgpt/fastgpt-sso:v4.8.14 .`

## 部署方式

端口：3000

填写关键环境变量：

```
SSO_PROVIDER=提供商
SSO_TARGET_URL=第三方系统跳转地址
```

其他环境变量根据不同提供商要求填写