import { Router, type Request, type Response } from 'express';
import { getFights, getStats } from '../services/store.js';

const router = Router();

router.get('/api/history', (_req: Request, res: Response) => {
  const fights = getFights();
  res.json(fights.reverse());
});

router.get('/api/stats', (_req: Request, res: Response) => {
  res.json(getStats());
});

export default router;
