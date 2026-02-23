/**
 * Contexto por request via AsyncLocalStorage.
 * O middleware preenche run({ requestId, logger }, ...); AppLogger usa getLogger().
 */
import { AsyncLocalStorage } from 'async_hooks';
import type { Logger } from 'pino';

type Store = {
  requestId: string;
  logger: Logger;
};

const als = new AsyncLocalStorage<Store>();

export const RequestContext = {
  run(store: Store, fn: () => void) {
    return als.run(store, fn);
  },

  getRequestId(): string | undefined {
    return als.getStore()?.requestId;
  },

  getLogger(): Logger | undefined {
    return als.getStore()?.logger;
  },
};
