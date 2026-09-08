import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from '@/components/ui/toast';

const { createApiClient } = vi.hoisted(() => ({
  createApiClient: vi.fn(() => ({ api: { v1: {} } })),
}));

vi.mock('@sidui/api-client', () => ({
  createApiClient,
}));

describe('api-client', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.mocked(toast.add).mockClear();
  });

  it('uses VITE_API_URL when set', async () => {
    vi.stubEnv('VITE_API_URL', 'http://api.example');
    vi.resetModules();
    const { apiBaseUrl } = await import('@/lib/api-client');
    expect(apiBaseUrl).toBe('http://api.example');
  });

  it('falls back to localhost and reports errors via toast', async () => {
    vi.resetModules();
    const { apiBaseUrl, handleApiError, MAX_ROUNDS } = await import(
      '@/lib/api-client'
    );

    expect(apiBaseUrl).toBe('http://localhost:3001');
    expect(MAX_ROUNDS).toBe(15);

    handleApiError(new Error('boom'), '默认失败');
    expect(toast.add).toHaveBeenCalledWith({
      type: 'error',
      description: 'boom',
    });

    handleApiError('not-an-error', '默认失败');
    expect(toast.add).toHaveBeenCalledWith({
      type: 'error',
      description: '默认失败',
    });
  });
});
