#!/usr/bin/env python
# -*- encoding: utf-8 -*-
'''
@File    :   sqlite_session.py
@Contact :   1181348296@qq.com

@Modify Time      @Author    @Version    @Desciption
------------      -------    --------    -----------
2023/10/24 0:27   HZD      1.0         None
'''
from fastapi import Depends
from sqlmodel import Session, SQLModel, create_engine
from .sqlite_config import settings


# DB_URL = 'sqlite:///local.db'
#
# uri = "@jinja sqlite:///{{ this.current_env | lower }}.db"
# connect_args = {check_same_thread=false}
# echo = false
#
# engine = create_engine(
#     settings.db.uri,
#     echo=settings.db.echo,
#     connect_args=settings.db.connect_args,
# )

connect_args = {"check_same_thread": False}
engine = create_engine(settings.DATABASE_URI, echo=True, connect_args=connect_args)

def create_db_and_tables(engine):
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
