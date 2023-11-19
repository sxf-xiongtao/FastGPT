#!/usr/bin/env python
# -*- encoding: utf-8 -*-
'''
@File    :   api.py.py    
@Contact :   1181348296@qq.com

@Modify Time      @Author    @Version    @Desciption
------------      -------    --------    -----------
2023/10/24 1:02   HZD      1.0         None
'''
from fastapi import APIRouter
from backend.api.v1.endpoints.rerank import *

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(rerank_router, prefix='/rerank', tags=["重排序接口"])