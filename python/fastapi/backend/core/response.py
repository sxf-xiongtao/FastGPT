#!/usr/bin/env python
# -*- encoding: utf-8 -*-
'''
@File    :   response.py    
@Contact :   1181348296@qq.com

@Modify Time      @Author    @Version    @Desciption
------------      -------    --------    -----------
2023/10/24 0:55   HZD      1.0         None
'''
import datetime
from typing import List


def res_antd(data: List = None, total: int = 0, code: bool = True):
    """
    支持ant-design-table 返回的格式
    :param code:
    :param data:
    :param total:
    :return:
    """
    time = str(datetime.datetime.now())
    if data is None:
        data = []
    result = {
        "success": code,
        "data": data,
        "total": total,
        "time": time
    }
    return result


def base_response(code, msg, data=None):
    """基础返回格式"""
    time = str(datetime.datetime.now())
    if data is None:
        data = []
    result = {
        "code": code,
        "message": msg,
        "data": data,
        "time": time
    }
    return result


def success(data=None, msg=''):
    """成功返回格式"""
    return base_response(200, msg, data)


def fail(code=-1, msg='', data=None):
    """失败返回格式"""
    return base_response(code, msg, data)