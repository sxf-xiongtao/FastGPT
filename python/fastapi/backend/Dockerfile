FROM continuumio/miniconda3

# 创建python3.8环境
RUN conda create --name eval_data python=3.8

# 设置工作目录
WORKDIR /eval_data

# 下载git lfs
RUN curl -s https://packagecloud.io/install/repositories/github/git-lfs/script.deb.sh | sudo bash \
    && sudo apt-get install git-lfs \
    && git lfs install

# 下载huggingface模型到eval_data
RUN git clone https://huggingface.co/BAAI/bge-reranker-base

# 将本机目录的/usr/local/eval-data映射到工作目录中
VOLUME /usr/local/eval-data:/eval_data

# 安装依赖
COPY requirements.txt .
RUN pip install -r requirements.txt

# 运行fastapi
CMD ["python", "/eval_data/backend/app.py"]


#docker build -t eval_data .
#docker run -p 8000:8000 -v /root/eval-data:/eval_data myapp