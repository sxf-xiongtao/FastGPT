# FastGPT 商业版插件

## submodules 使用

**拉取 Submodules**

```bash
# git submodule add https://github.com/labring/FastGPT
# cd FastGPT
git submodule update --init --recursive
```

首次拉取和更新都用上面的命令。

**提交**

```bash
cd FastGPT
git push
```

## 开发

```bash
# 根目录
pnpm i
cd projects/app
pnpm dev
```

## 镜像打包

```bash
docker build -t registry.cn-hangzhou.aliyuncs.com/fastgpt/fastgptpro:test . --network host  --build-arg name=app --build-arg HTTP_PROXY=http://127.0.0.1:7890 --build-arg HTTPS_PROXY=http://127.0.0.1:7890
```
