#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
@Time: 2023/11/7 23:33
@Author: zhidong
@File: rerank.py
@Desc: 
"""
from fastapi import APIRouter
from backend.core.response import success
from backend.reranker.reranker import Chat
from backend.schemas.model import QADocs
from backend.utils.util import log_filter

rerank_router = APIRouter(prefix='')


@rerank_router.post("", summary="获取query-docs的rerank score")
@log_filter
async def get_rerank(docs: QADocs):
    """
    获取query-docs的rerank score
    :param docs:
    :return:
    """
    chat = Chat()
    qa_docs_with_rerank = chat.fit_query_answer_rerank(docs)
    return success(msg="重排成功", data=qa_docs_with_rerank)
