import axios from 'axios';
const pluginURL = process.env.PLUGIN_URL;

export type CrawlDataItemType = { url: string; title: string; content: string };
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

export const crawlDynamicWebsite = async ({
  uid,
  url,
  maxPage = 200,
  selector = 'body',
  crawlOnePageCallback
}: {
  uid: string;
  url: string;
  maxPage?: number;
  selector?: string;
  crawlOnePageCallback?: (e: CrawlDataItemType, stopCrawler: () => void) => any;
  onSuccess?: (e: CrawlDataItemType[]) => any;
}) => {
  if (!pluginURL) {
    return Promise.reject(new Error('pluginURL is not set'));
  }

  const start = await axios.post(pluginURL + '/api/dynamicWebSiteCrawler/start', {
    uid,
    url,
    maxPage,
    selector
  });

  if (start.status !== 200) {
    return;
  }

  const interval = setInterval(async () => {
    try {
      const query = await axios.get<dynamicWebsiteCrawlerTask>(
        `${pluginURL}/api/dynamicWebSiteCrawler/query?uid=${uid}`
      );
      if (query.data.status === 'completed') {
        clearInterval(interval);
      }

      if (query.data.status === 'failed') {
        clearInterval(interval);
      }

      if (query.data.items.length > 0) {
        crawlOnePageCallback?.(query.data.items[0], stopCrawler);
      }
    } catch (e) {
      clearInterval(interval);
      return;
    }
  }, 1000);

  function stopCrawler() {
    axios.post(pluginURL + '/api/dynamicWebSiteCrawler/stop', {
      uid
    });
    clearInterval(interval);
  }
};
