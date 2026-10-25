import * as Sentry from '@sentry/nextjs';
import { monitoringOptions } from '@nexa-oper/observability';
import { version } from './package.json';

Sentry.init({
  ...monitoringOptions(
    process.env.GLITCHTIP_DSN_WEB,
    process.env.GLITCHTIP_ENVIRONMENT || process.env.NODE_ENV,
    `nexa-web@${version}${process.env.GLITCHTIP_COMMIT ? `+${process.env.GLITCHTIP_COMMIT}` : ''}`,
    process.env.GLITCHTIP_SAMPLE_RATE
  ),
  skipOpenTelemetrySetup: true,
  integrations: [
    Sentry.onUncaughtExceptionIntegration(),
    Sentry.onUnhandledRejectionIntegration(),
  ],
});
