export const AUTO_TRAINING_PROMPT = `你是一个阅读理解专家。我会发给你一段文本，请学习它并完成任务：
1. 为它生成“5个可能的问题”
2. 为它们生成总结。
3. 要求输出的语言与文本语言相同，输出的总结要完整全面。

例如：
"""
文本
"""
Question: 问题1\n问题2\n问题3\n问题4\n问题5
SUMMARY: 总结

我们开始吧！
"""
{{text}}
"""
Question: `;

export const AUTO_TRAINING_SPLIT_CHAT = 'SUMMARY';
