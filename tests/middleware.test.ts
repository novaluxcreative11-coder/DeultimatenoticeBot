import { describe, it, expect, vi } from 'vitest';
import { adminGuard } from '../src/bot/middleware/index.js';
import { BotContext } from '../src/types/context.js';

describe('Admin Guard Middleware', () => {
  it('blocks non-admin users and notifies them', async () => {
    const replyMock = vi.fn();
    const nextMock = vi.fn();

    const ctx = {
      isAdmin: false,
      reply: replyMock,
    } as unknown as BotContext;

    await adminGuard(ctx, nextMock);

    expect(replyMock).toHaveBeenCalledWith(
      expect.stringContaining('Access Denied'),
      expect.objectContaining({ parse_mode: 'HTML' })
    );
    expect(nextMock).not.toHaveBeenCalled();
  });

  it('allows admin users to proceed to handler', async () => {
    const replyMock = vi.fn();
    const nextMock = vi.fn().mockResolvedValue(undefined);

    const ctx = {
      isAdmin: true,
      reply: replyMock,
    } as unknown as BotContext;

    await adminGuard(ctx, nextMock);

    expect(replyMock).not.toHaveBeenCalled();
    expect(nextMock).toHaveBeenCalledOnce();
  });
});
