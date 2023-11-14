#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
@Time: 2023/11/7 23:38
@Author: zhidong
@File: model.py
@Desc: 
"""
from pydantic import Field, BaseModel, validator
from typing import Optional, List


class Inputs(BaseModel):
    id: str
    text: Optional[str]


class QADocs(BaseModel):
    query: Optional[str]
    inputs: Optional[List[Inputs]]
