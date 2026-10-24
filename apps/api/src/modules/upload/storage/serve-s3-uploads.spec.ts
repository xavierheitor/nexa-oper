import express from 'express';
import request from 'supertest';
import { Readable } from 'node:stream';
import { mountS3Uploads } from './serve-s3-uploads';
import type { S3StorageAdapter } from './s3-storage.adapter';

describe('private S3 upload delivery', () => {
  const read = jest.fn<
    Promise<unknown>,
    [string, { Range?: string; IfNoneMatch?: string }, AbortSignal]
  >();
  const head = jest.fn();
  const app = express();
  mountS3Uploads(app, { read, head } as unknown as S3StorageAdapter);
  beforeEach(() => {
    jest.resetAllMocks();
    read.mockImplementation(() =>
      Promise.resolve({
        Body: Readable.from(Buffer.from('photo')),
        ContentLength: 5,
        ContentType: 'image/jpeg',
        ETag: '"v1"',
      }),
    );
    head.mockResolvedValue({ ContentLength: 5, ContentType: 'image/jpeg' });
  });

  it('streams bytes without redirecting to the private endpoint', async () => {
    const res = await request(app)
      .get('/uploads/checklists/photo.jpg')
      .expect(200);
    expect(res.body).toEqual(Buffer.from('photo'));
    expect(res.headers.location).toBeUndefined();
    expect(read.mock.calls[0][0]).toBe('checklists/photo.jpg');
  });
  it('maps legacy mobile paths to the same bucket key', async () => {
    await request(app).get('/mobile/photos/123/photo.jpg').expect(200);
    expect(read.mock.calls[0][0]).toBe('mobile/photos/123/photo.jpg');
  });
  it('uses metadata only for HEAD', async () => {
    await request(app)
      .head('/uploads/photo.jpg')
      .expect(200)
      .expect('Content-Length', '5');
    expect(head).toHaveBeenCalled();
    expect(read).not.toHaveBeenCalled();
  });
  it('forwards a byte range and returns partial response headers', async () => {
    read.mockResolvedValue({
      Body: Readable.from('ph'),
      ContentLength: 2,
      ContentRange: 'bytes 0-1/5',
    });
    await request(app)
      .get('/uploads/photo.jpg')
      .set('Range', 'bytes=0-1')
      .expect(206)
      .expect('Content-Range', 'bytes 0-1/5');
    expect(read.mock.calls[0][1].Range).toBe('bytes=0-1');
  });
  it('handles conditional cache requests', async () => {
    read.mockRejectedValue({ $metadata: { httpStatusCode: 304 } });
    await request(app)
      .get('/uploads/photo.jpg')
      .set('If-None-Match', '"v1"')
      .expect(304);
    expect(read.mock.calls[0][1].IfNoneMatch).toBe('"v1"');
  });
  it.each([404, 416, 403, 500])(
    'maps upstream status %s without leaking details',
    async (status) => {
      read.mockRejectedValue({
        $metadata: { httpStatusCode: status },
        message: 'private endpoint secret',
      });
      const res = await request(app)
        .get('/uploads/photo.jpg')
        .expect([404, 416].includes(status) ? status : 502);
      expect(res.text).not.toContain('secret');
    },
  );
  it.each([
    '/uploads/.env',
    '/uploads/%2e%2e%2fsecret',
    '/uploads/foo%5csecret',
    '/uploads/%00',
  ])('rejects unsafe key %s', async (url) => {
    await request(app).get(url).expect(404);
    expect(read).not.toHaveBeenCalled();
  });
  it('rejects unsupported multiple ranges', async () => {
    await request(app)
      .get('/uploads/photo.jpg')
      .set('Range', 'bytes=0-1,3-4')
      .expect(416);
    expect(read).not.toHaveBeenCalled();
  });
});
