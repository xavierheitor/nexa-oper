import type {
  Event,
  ErrorEvent,
  EventHint,
  CaptureContext,
} from '@sentry/core';
export function sanitizeEvent<T extends Event>(event: T): T;
export function monitoringOptions(
  dsn: string | undefined,
  environment: string | undefined,
  release: string,
  sampleRate?: string
): {
  dsn: string | undefined;
  enabled: boolean;
  environment: string;
  release: string;
  sampleRate: number;
  sendDefaultPii: false;
  maxBreadcrumbs: number;
  beforeBreadcrumb: () => null;
  beforeSend: (event: ErrorEvent, hint?: EventHint) => ErrorEvent | null;
  defaultIntegrations: false;
  autoSessionTracking: false;
  sendClientReports: false;
  tracesSampleRate: number;
  transportOptions: { bufferSize: number };
};
export function createCapture(sdk: {
  isEnabled(): boolean;
  captureException(error: unknown, context?: CaptureContext): string;
}): (error: unknown, tags?: Record<string, string>) => void;
