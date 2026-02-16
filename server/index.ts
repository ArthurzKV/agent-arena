import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fightRouter from './routes/fight.js';
import historyRouter from './routes/history.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.PORT || '4242');

app.use(cors());
app.use(express.json());

// API routes
app.use(fightRouter);
app.use(historyRouter);

// Serve built frontend in production
const clientDir = join(__dirname, '..', 'dist', 'client');
app.use(express.static(clientDir));
app.get('*', (_req, res) => {
  res.sendFile(join(clientDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  🥊 Agent Arena running at http://localhost:${PORT}\n`);
});
