#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
@Time: 2023/11/3 16:27
@Author: zhidong
@File: active_session.py
@Desc: 
"""
from fastapi import Depends

from backend.db.mysql_session import get_session

# from backend.db.sqlite_session import get_session

ActiveSession = Depends(get_session)
