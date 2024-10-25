import express from 'express';
import { query, start, stop } from './controller/dynamicWebsiteCrawler';
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3030;

app.post('/api/dynamicWebsiteCrawler/start', start);
app.get('/api/dynamicWebsiteCrawler/query', query);
app.get('/api/dynamicWebsiteCrawler/stop', stop);

app.listen(PORT, () => {
  console.log('Max Concurrency: ', process.env.CRAWL_MAX_CONCURRENCY);
  console.log('Exclude Domains: ', process.env.CRAWL_EXCLUDE_LIST);
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('Start a dynamic website crawler: /api/dynamicWebsiteCrawler/start');
  console.log('Query a dynamic website crawler: /api/dynamicWebsiteCrawler/query');
  console.log('Stop a dynamic website crawler: /api/dynamicWebsiteCrawler/stop');
});
