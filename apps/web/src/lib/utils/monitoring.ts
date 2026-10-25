import * as Sentry from '@sentry/nextjs';
import { createCapture } from '@nexa-oper/observability';

/** For caught failures: callers must not report errors they rethrow. */
export const captureUnexpected = createCapture(Sentry);
