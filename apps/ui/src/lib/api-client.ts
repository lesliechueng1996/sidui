import { createApiClient } from '@sidui/api-client';
import { toast } from '@/components/ui/toast';

export const apiBaseUrl =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export const apiClient = createApiClient(apiBaseUrl);

export const MAX_ROUNDS = 15;

export const handleApiError = (error: unknown, defaultMessage: string) => {
  toast.add({
    type: 'error',
    description: error instanceof Error ? error.message : defaultMessage,
  });
};
