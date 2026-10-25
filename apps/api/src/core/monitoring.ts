import { createRequire } from 'node:module';
import './config/load-env';
import * as Sentry from '@sentry/node';
import { monitoringOptions, createCapture } from '@nexa-oper/observability';

const { version } = createRequire(__filename)('../../package.json') as {
  version: string;
};
Sentry.init({
  ...monitoringOptions(
    process.env.GLITCHTIP_DSN_API,
    process.env.GLITCHTIP_ENVIRONMENT ?? process.env.NODE_ENV,
    `nexa-api@${version}${process.env.GLITCHTIP_COMMIT ? `+${process.env.GLITCHTIP_COMMIT}` : ''}`,
    process.env.GLITCHTIP_SAMPLE_RATE,
  ),
  skipOpenTelemetrySetup: true,
  integrations: [
    Sentry.onUncaughtExceptionIntegration(),
    Sentry.onUnhandledRejectionIntegration(),
  ],
});
export const captureUnexpected = createCapture(Sentry);
