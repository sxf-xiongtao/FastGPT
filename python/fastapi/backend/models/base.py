#!/usr/bin/env python
# -*- encoding: utf-8 -*-
'''
@File    :   base.py    
@Contact :   1181348296@qq.com

@Modify Time      @Author    @Version    @Desciption
------------      -------    --------    -----------
2023/10/24 0:09   HZD      1.0         None
'''
from __future__ import annotations

from typing import Optional
from sqlmodel import SQLModel as _SQLModel, Field
from sqlalchemy.orm import declared_attr
from datetime import datetime

from backend.utils.uuid6 import UUID, uuid6


class SQLModel(_SQLModel):
    @declared_attr  # type: ignore
    def __tablename__(cls) -> str:
        return cls.__name__


class BaseUUIDModel(SQLModel):
    id: UUID = Field(
        default_factory=uuid6,
        primary_key=True,
        index=True,
        nullable=False,
    )
    updated_at: Optional[datetime] = Field(
        default_factory=datetime.now, sa_column_kwargs={"onupdate": datetime.now}
    )
    created_at: Optional[datetime] = Field(default_factory=datetime.now)
