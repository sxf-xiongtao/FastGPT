#!/usr/bin/env python
# -*- encoding: utf-8 -*-
'''
@File    :   router.py    
@Contact :   1181348296@qq.com

@Modify Time      @Author    @Version    @Desciption
------------      -------    --------    -----------
2023/10/24 1:01   HZD      1.0         None
'''
from fastapi import APIRouter
from backend.api.v1.api import api_router

router = APIRouter()
# API路由
router.include_router(api_router)