const { test } = require('node:test');
const assert = require('node:assert/strict');
const { monitoringOptions, sanitizeEvent, createCapture } = require('./index');

test('valid DSN enables monitoring; missing or invalid DSNs disable it', () => {
  assert.equal(
    monitoringOptions('https://public@example.invalid/1', 'staging', 'api@1')
      .enabled,
    true
  );
  for (const dsn of [undefined, '', 'garbage'])
    assert.equal(monitoringOptions(dsn, 'production', 'api@1').enabled, false);
  assert.equal(monitoringOptions('', '', '', '2').sampleRate, 1);
  assert.equal(monitoringOptions('', '', '', '0').sampleRate, 0);
});
test('allowlist drops secrets in all untrusted event surfaces, keeping stack locations', () => {
  const secret = 'private-token@example.com';
  const result = sanitizeEvent({
    message: secret,
    user: { email: secret },
    request: { headers: { Authorization: secret }, data: secret, url: secret },
    breadcrumbs: [{ message: secret }],
    extra: { password: secret },
    contexts: { location: secret },
    tags: { other: secret, request_id: secret, 'http.method': 'GET' },
    exception: {
      values: [
        {
          type: 'TypeError',
          value: secret,
          mechanism: { data: secret, type: 'generic' },
          stacktrace: {
            frames: [
              {
                filename: '/app/code.ts?token=' + secret,
                lineno: 42,
                vars: { secret },
                pre_context: [secret],
              },
            ],
          },
        },
      ],
    },
  });
  assert.ok(!JSON.stringify(result).includes(secret));
  assert.equal(result.exception.values[0].stacktrace.frames[0].lineno, 42);
  assert.equal(result.tags['http.method'], 'GET');
});
test('capture excludes expected failures, deduplicates objects and tolerates failed transport', () => {
  let calls = 0;
  const capture = createCapture({
    isEnabled: () => true,
    captureException: () => {
      calls++;
      throw new Error('offline');
    },
  });
  const failure = new Error('unexpected');
  assert.doesNotThrow(() => {
    capture(failure);
    capture(failure);
  });
  capture(Object.assign(new Error('auth'), { status: 401 }));
  capture(Object.assign(new Error('validation'), { name: 'ZodError' }));
  capture(new Error('NEXT_REDIRECT;replace;/login'));
  capture(new Error('Você não tem permissão para executar esta ação.'));
  assert.equal(calls, 1);
  const disabled = createCapture({
    isEnabled: () => false,
    captureException: () => {
      calls++;
    },
  });
  disabled(new Error());
  assert.equal(calls, 1);
});
test('beforeSend caps volume and filters automatic expected errors', () => {
  const opts = monitoringOptions(
    'https://public@example.invalid/1',
    'staging',
    'api@1'
  );
  assert.equal(
    opts.beforeSend(
      {},
      { originalException: Object.assign(new Error(), { status: 403 }) }
    ),
    null
  );
  for (let i = 0; i < 30; i++) assert.ok(opts.beforeSend({}));
  assert.equal(opts.beforeSend({}), null);
});
test('real SDK sanitizes envelopes and a rejected network transport does not escape', async () => {
  const Sentry = require('@sentry/node');
  const envelopes = [];
  const client = Sentry.init({
    ...monitoringOptions(
      'https://public@example.invalid/1',
      'staging',
      'test@1'
    ),
    transport: () => ({
      send(envelope) {
        envelopes.push(envelope);
        return Promise.reject(new Error('offline'));
      },
      flush() {
        return Promise.resolve(true);
      },
    }),
  });
  Sentry.getCurrentScope().addAttachment({
    filename: 'SECRET.txt',
    data: 'SECRET',
  });
  Sentry.captureException(new Error('SECRET payload'), {
    extra: { password: 'SECRET' },
  });
  await client.flush(1000);
  assert.equal(envelopes.length, 1);
  assert.ok(!JSON.stringify(envelopes).includes('SECRET'));
  await client.close();
});

test('real SDK remains disabled without DSN', async () => {
  const Sentry = require('@sentry/node');
  let sends = 0;
  const client = Sentry.init({
    ...monitoringOptions(undefined, 'development', 'test@1'),
    transport: () => ({
      send() {
        sends++;
        return Promise.resolve({ statusCode: 200 });
      },
      flush() {
        return Promise.resolve(true);
      },
    }),
  });
  assert.equal(Sentry.isEnabled(), false);
  Sentry.captureException(new Error('no destination'));
  await client.flush(1000);
  assert.equal(sends, 0);
  await client.close();
});
