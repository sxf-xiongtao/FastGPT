#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
@Time: 2023/11/12 1:01
@Author: zhidong
@File: util.py
@Desc: 
"""
import logging
import time
import uuid
import inspect
import json
from starlette.responses import StreamingResponse
from functools import wraps

def log_filter(func):
    """
    TODO: 增加维护requestId，多线程打印
    """
    @wraps(func)
    async def wrapper(*args, **kwargs):
        server_logger = logging.getLogger("server")
        request_id = uuid.uuid4().hex[:8]
        start = 1000 * time.time()
        server_logger.info(f"Request_id: {request_id}, \001 Enter Func： {func.__name__}，\001 Func Args：{args}，\001 Func Kwargs：{kwargs}")
        try:
            rsp = func(*args, **kwargs)
            end = 1000 * time.time()
            rsp = await rsp if inspect.iscoroutine(rsp) else rsp
            # result = rsp
            async def yeild_result(rsp):
                res = []
                async for data in rsp.body_iterator:
                    data = json.loads(data)
                    res.append(data)
                server_logger.info(
                    f"Request_id: {request_id}, \001 Func finished： {func.__name__}，\001 Return：{res}，\001 Headers：{rsp.raw_headers}，\001 Time consuming: {end - start}ms")
                yield json.dumps(res[0], ensure_ascii=False)
            if isinstance(rsp, StreamingResponse):
                headers = {}
                for key, value in rsp.raw_headers:
                    key = key.decode()
                    value = value.decode()
                    headers[key] = value
                return StreamingResponse(yeild_result(rsp), headers=headers)
            server_logger.info(f"Request_id: {request_id}, \001 Func finished： {func.__name__}，\001 Return：{str(rsp)}，\001 Time consuming: {end - start}ms")
            return rsp
        except Exception as e:
            server_logger.error(repr(e))
            raise e
    return wrapper