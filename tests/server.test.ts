import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createExpressApp } from '../src/server.js';
import { Bot } from 'grammy';
import { BotContext } from '../src/types/context.js';

// Mock Prisma
vi.mock('../src/database/index.js', () => {
  return {
    prisma: {
      $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
    },
  };
});

describe('Express Server & Health Checks', () => {
  const dummyBot = new Bot<BotContext>('123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11');
  const app = createExpressApp(dummyBot);

  it('serves /health endpoint with 200 OK and database health status', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toContain('DEULTIMATEADSOLUTION');
    expect(res.body.database).toBe('ok');
    expect(res.body.uptime).toBeGreaterThanOrEqual(0);
  });

  it('serves root HTML page', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.text).toContain('DEULTIMATEADSOLUTION');
    expect(res.text).toContain('Telegram Support Bot');
  });
});
