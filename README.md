# FastGPT 商业版插件

## submodules

**init**

```bash
git submodule add https://github.com/labring/FastGPT fastgpt
cd fastgpt
git submodule update --init --recursive
```

**update packages**

```bash
cd fastgpt
git pull origin main  # 或者你的默认分支名
cd ..
git commit -m "update submodules"
git push
```
