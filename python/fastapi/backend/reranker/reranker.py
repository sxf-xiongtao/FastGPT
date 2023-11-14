#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
@Time: 2023/11/7 22:45
@Author: zhidong
@File: reranker.py
@Desc: 
"""
from typing import List

import numpy as np
from FlagEmbedding import FlagReranker

from backend.schemas.model import QADocs

RERANK_MODEL_PATH = '/root/autodl-tmp/eval-data/bge-reranker-base'


class Singleton(type):
    def __call__(cls, *args, **kwargs):
        if not hasattr(cls, '_instance'):
            cls._instance = super().__call__(*args, **kwargs)
        return cls._instance


class Reranker(metaclass=Singleton):
    def __init__(self, model_path):
        self.reranker = FlagReranker(model_path,
                                     use_fp16=True)

    def compute_score(self, pairs: List[List[str]]):
        if len(pairs) > 0:
            result = self.reranker.compute_score(pairs)
            if isinstance(result, float):
                result = [result]
            return result
        else:
            return None


class Chat(object):
    def __init__(self, rerank_model_path: str = RERANK_MODEL_PATH):
        self.reranker = Reranker(rerank_model_path)

    def fit_query_answer_rerank(self, query_docs: QADocs) -> List:
        if query_docs is None or len(query_docs.inputs) == 0:
            return []
        new_docs = []
        pair = []
        for answer in query_docs.inputs:
            pair.append([query_docs.query, answer.text])
        scores = self.reranker.compute_score(pair)
        for index, score in enumerate(scores):
            new_docs.append({"id": query_docs.inputs[index].id, "score": 1 / (1 + np.exp(-score))})
        new_docs = list(sorted(new_docs, key=lambda x: x["score"], reverse=True))
        return new_docs
