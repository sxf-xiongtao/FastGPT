import type { Request, Response } from 'express';
import type { CrawlDataItemType } from '../lib/crawler';
import { crawlDynamicWebsite } from '../lib/crawler';

const queue: dynamicWebsiteCrawlerTask[] = [];

export type dynamicWebsiteCrawlerTask = {
  uid: string;
  status: 'running' | 'completed' | 'failed';
  items: CrawlDataItemType[];
};

export type startDynamicWebsiteCrawlerRequest = {
  uid: string;
  url: string;
  maxPage?: number;
  selector?: string;
};

function crawlOnePageCallback(uid: string) {
  const task: dynamicWebsiteCrawlerTask = {
    uid,
    status: 'running',
    items: []
  };
  queue.push(task);
  return (item: CrawlDataItemType, stopCrawler: () => void) => {
    const task = queue.find((e) => e.uid === uid);
    if (task?.status === 'running') {
      task?.items.push(item);
    } else {
      stopCrawler();
    }
  };
}

function onSuccess(uid: string) {
  return () => {
    const task = queue.find((e) => e.uid === uid);
    if (task) {
      task.status = 'completed';
    }
  };
}

function onFail(uid: string) {
  return (error: Error) => {
    console.log(error);
    const task = queue.find((e) => e.uid === uid);
    if (task) {
      task.status = 'failed';
      task.items = [];
    }
  };
}

export async function start(
  req: Request<{}, {}, startDynamicWebsiteCrawlerRequest>,
  res: Response
) {
  if (!req.body) {
    res.status(400).json({ message: 'request body is empty' });
    return;
  }
  const { uid, url, maxPage, selector } = req.body;
  if (!uid || !url) {
    res.status(400).json({ message: 'request body is invalid' });
    return;
  }
  crawlDynamicWebsite({
    uid,
    url,
    maxPage,
    selector,
    crawlOnePageCallback: crawlOnePageCallback(uid),
    onSuccess: onSuccess(uid),
    onFail: onFail(uid)
  });
  res.status(200).json({ message: 'ok' });
}

export function query(req: Request, res: Response) {
  const { uid } = req.query;
  if (!uid) {
    res.status(400).json({ message: 'uid is empty' });
    return;
  }
  const task = queue.find((e) => e.uid === uid);
  if (!task) {
    res.status(404).json({ message: 'task not found' });
    return;
  }
  const { status, items } = task;

  res.status(200).json({ items, status });
  task.items.length = 0;
}

export function stop(req: Request, res: Response) {
  const { uid } = req.query;
  if (!uid) {
    res.status(400).json({ message: 'uid is empty' });
    return;
  }
  const task = queue.find((e) => e.uid === uid);
  if (!task) {
    res.status(404).json({ message: 'task not found' });
    return;
  }
  task.status = 'failed';
  task.items = [];
  res.status(200).json({ message: 'ok' });
}
