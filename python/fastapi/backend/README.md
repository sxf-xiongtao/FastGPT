# FastAI 算法流程部分实现

## 开发环境设置

### 安装依赖
```
pip install requirements.txt
```

### 开发机内置依赖
```shell
conda activate /root/autodl-tmp/.conda/envs/eval
```

### 启动
```shell
CUDA_VISIBLE_DEVICES=0 nohup python /root/autodl-tmp/eval-data/backend/app.py > /root/autodl-tmp/eval-data/backend/logs/server_log.txt 2>&1 &
```
重排详细日志记录在logs/server.log