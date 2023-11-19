#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
@Time: 2023/11/3 16:20
@Author: zhidong
@File: mysql_session.py
@Desc: 
"""
from sqlmodel import Session, SQLModel, create_engine

SQLALCHEMY_DATABASE_URL = ""
engine = create_engine(SQLALCHEMY_DATABASE_URL)


def get_session():
    with Session(engine) as session:
        yield session
