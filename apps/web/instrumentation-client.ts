import * as Sentry from '@sentry/nextjs';
import { monitoringOptions } from '@nexa-oper/observability';
import { version } from './package.json';

Sentry.init({
  ...monitoringOptions(
    process.env.NEXT_PUBLIC_GLITCHTIP_DSN_WEB,
    process.env.NEXT_PUBLIC_GLITCHTIP_ENVIRONMENT || process.env.NODE_ENV,
    `nexa-web@${version}${process.env.NEXT_PUBLIC_GLITCHTIP_COMMIT ? `+${process.env.NEXT_PUBLIC_GLITCHTIP_COMMIT}` : ''}`,
    process.env.NEXT_PUBLIC_GLITCHTIP_SAMPLE_RATE
  ),
  integrations: [
    Sentry.globalHandlersIntegration(),
    Sentry.browserApiErrorsIntegration(),
    Sentry.dedupeIntegration(),
  ],
});
