'use strict';

// Reconstruct events from an allowlist: arbitrary messages and context can contain
// personal data even when their keys appear harmless.
function sourceFile(filename) {
  if (typeof filename !== 'string') return undefined;
  const basename = filename.split(/[?#]/)[0].split(/[\\/]/).pop();
  return /^[\w.[\]()-]+\.(?:[cm]?js|jsx|tsx?)$/.test(basename || '')
    ? basename
    : undefined;
}

function sanitizeEvent(event) {
  return {
    event_id: event.event_id,
    timestamp: event.timestamp,
    platform: event.platform,
    level: event.level,
    environment: event.environment,
    release: event.release,
    exception: event.exception && {
      values: event.exception.values?.map(exception => ({
        type: /^[\w.$-]{1,80}$/.test(exception.type || '')
          ? exception.type
          : 'Error',
        value: '[redacted]',
        mechanism: exception.mechanism && {
          type: exception.mechanism.type,
          handled: exception.mechanism.handled,
        },
        stacktrace: exception.stacktrace && {
          frames: exception.stacktrace.frames?.map(frame => ({
            // Retain source locations, never local variables or source lines.
            filename: sourceFile(frame.filename),
            function: /^[\w.$<> -]{1,120}$/.test(frame.function || '')
              ? frame.function
              : undefined,
            lineno: frame.lineno,
            colno: frame.colno,
            in_app: frame.in_app,
          })),
        },
      })),
    },
    tags: Object.fromEntries(
      Object.entries(event.tags || {}).filter(
        ([key, value]) =>
          ['http.method', 'http.route', 'request_id'].includes(key) &&
          typeof value === 'string' &&
          value.length <= 160 &&
          (key !== 'request_id' || /^[a-f0-9-]{16,64}$/i.test(value))
      )
    ),
  };
}

function monitoringOptions(dsn, environment, release, sampleRate) {
  let validDsn;
  try {
    const url = new URL(dsn);
    if (
      ['https:', 'http:'].includes(url.protocol) &&
      url.username &&
      /^\/\d+$/.test(url.pathname)
    )
      validDsn = dsn;
  } catch {
    /* Missing or invalid DSN disables monitoring. */
  }
  const rate = Number(sampleRate ?? 1);
  let windowStart = Date.now();
  let sent = 0;
  return {
    dsn: validDsn,
    enabled: Boolean(validDsn),
    environment: ['production', 'staging', 'development'].includes(environment)
      ? environment
      : 'development',
    release,
    sampleRate: Number.isFinite(rate) && rate >= 0 && rate <= 1 ? rate : 1,
    sendDefaultPii: false,
    maxBreadcrumbs: 0,
    beforeBreadcrumb: () => null,
    beforeSend: (event, hint) => {
      if (hint) hint.attachments = [];
      if (isExpected(hint?.originalException)) return null;
      const now = Date.now();
      if (now - windowStart >= 60000) {
        windowStart = now;
        sent = 0;
      }
      if (++sent > 30) return null;
      return sanitizeEvent(event);
    },
    defaultIntegrations: false,
    autoSessionTracking: false,
    sendClientReports: false,
    tracesSampleRate: 0,
    transportOptions: { bufferSize: 20 },
  };
}

function isExpected(error) {
  if (!(error instanceof Error)) return false;
  const status = error.status ?? error.statusCode ?? error.getStatus?.();
  return (
    (status >= 400 && status < 500) ||
    ['ZodError', 'AbortError'].includes(error.name) ||
    /^NEXT_(REDIRECT|NOT_FOUND)/.test(error.message) ||
    /^Você não tem permissão/.test(error.message)
  );
}

function createCapture(sdk) {
  const seen = new WeakSet();
  return (error, tags = {}) => {
    if (!(error instanceof Error) || seen.has(error) || !sdk.isEnabled())
      return;
    if (isExpected(error)) return;
    seen.add(error);
    try {
      sdk.captureException(error, { tags });
    } catch {
      /* Monitoring must never affect application responses. */
    }
  };
}
module.exports = { sanitizeEvent, monitoringOptions, createCapture };
