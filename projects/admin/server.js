import express from 'express';
import cors from 'cors';
import { authLicense } from './service/auth.js';
import { useUserRoute } from './service/route/user.js';
import { useAppRoute } from './service/route/app.js';
import { useDatasetRoute } from './service/route/dataset.js';
import { useSystemRoute } from './service/route/system.js';

authLicense();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('dist'));

useUserRoute(app);
useAppRoute(app);
useDatasetRoute(app);
useSystemRoute(app);

app.get('/*', (req, res) => {
  try {
    res.sendFile(new URL('dist/index.html', import.meta.url).pathname);
  } catch (error) {
    res.end();
  }
});

app.use((err, req, res, next) => {
  try {
    res.sendFile(new URL('dist/index.html', import.meta.url).pathname);
  } catch (error) {
    res.end();
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
