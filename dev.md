## dev

1. 先安装一些 canvas 依赖:参考 https://www.npmjs.com/package/canvas Compiling章节
2. 安装 ioslate-vm 依赖：https://www.npmjs.com/package/isolated-vm?ref=pixeljets.com 也是装 node-gyp
3. 安装 make 命令

```bash
# 第一次运行，拉去 submodule，拉取后会多一个 FastGPT 目录，指向开源的 FastGPT。需要进去，手动修改下 git 的 remote，把 upstream 设置成 labring/FastGPT，origin 设置成自己 fork 的仓库。
git submodule update --init --recursive
# 在 FastGPT 目录下安装一次（初始化 Git 之类的自动化）
cd FastGPT
pnpm i
# 添加上游仓库，并把 origin 指向自己的仓库。
# git remote add upstream https://github.com/labring/FastGPT.git

# 切换回 fastgpt-pro 目录
# cd fastgpt-pro
# 安装依赖
pnpm i

# 启动商业版
make dev name=app
# 启动开源版
cd FastGPT
make dev name=app
make dev name=sandbox
```

## build

```bash
make build name=app image=registry.cn-hangzhou.aliyuncs.com/fastgpt/fastgpt-pro:v4.8.1 proxy=clash
make build name=app image=registry.cn-hangzhou.aliyuncs.com/fastgpt/fastgpt-pro:v4.8.1 proxy=taobao
```
