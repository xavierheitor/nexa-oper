import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import type { Express, RequestHandler, Response } from 'express';

import type { S3StorageAdapter } from './s3-storage.adapter';

/** Same public URL contract as express.static; the bucket stays private. */
export function mountS3Uploads(app: Express, storage: S3StorageAdapter) {
  const serve =
    (prefix: string): RequestHandler =>
    async (req, res) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.setHeader('Allow', 'GET, HEAD');
        res.sendStatus(405);
        return;
      }
      let key: string;
      try {
        key = prefix + decodeURIComponent(req.path).replace(/^\/+/, '');
        if (
          !key ||
          key.includes('\\') ||
          key.includes('\0') ||
          key.split('/').some((part) => !part || part.startsWith('.'))
        ) {
          res.sendStatus(404);
          return;
        }
      } catch {
        res.sendStatus(400);
        return;
      }
      // One byte range at a time, as supported by S3.
      if (
        req.headers.range &&
        !/^bytes=(?:\d+-\d*|-\d+)$/.test(req.headers.range)
      ) {
        res.sendStatus(416);
        return;
      }
      const controller = new AbortController();
      const abort = () => controller.abort();
      res.once('close', abort);
      try {
        const options = {
          // A full response is valid when If-Range cannot be evaluated here.
          Range: req.headers['if-range'] ? undefined : req.headers.range,
          IfNoneMatch: req.headers['if-none-match'],
          IfModifiedSince: req.headers['if-none-match']
            ? undefined
            : parseDate(req.headers['if-modified-since']),
        };
        const result =
          req.method === 'HEAD'
            ? await storage.head(key, options, controller.signal)
            : await storage.read(key, options, controller.signal);
        setHeaders(res, key, result);
        if (req.method === 'HEAD') {
          res.end();
          return;
        }
        const body = 'Body' in result ? result.Body : undefined;
        if (!(body instanceof Readable)) {
          throw new TypeError('Invalid storage response');
        }
        await pipeline(body, res);
      } catch (error: unknown) {
        if (controller.signal.aborted) {
          return;
        }
        if (res.headersSent) {
          res.destroy();
          return;
        }
        sendStorageError(res, error);
      } finally {
        res.removeListener('close', abort);
      }
    };
  app.use('/uploads', serve(''));
  app.use('/mobile/photos', serve('mobile/photos/'));
}

function parseDate(value?: string): Date | undefined {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function setHeaders(
  res: Response,
  key: string,
  result: Awaited<ReturnType<S3StorageAdapter['head']>>,
) {
  res.status(result.ContentRange ? 206 : 200);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.type(key);
  if (result.ContentType && result.ContentType !== 'application/octet-stream') {
    res.setHeader('Content-Type', result.ContentType);
  }
  if (result.ContentLength !== undefined) {
    res.setHeader('Content-Length', result.ContentLength);
  }
  if (result.ContentRange) {
    res.setHeader('Content-Range', result.ContentRange);
  }
  if (result.ETag) {
    res.setHeader('ETag', result.ETag);
  }
  if (result.LastModified) {
    res.setHeader('Last-Modified', result.LastModified.toUTCString());
  }
}

function sendStorageError(res: Response, error: unknown) {
  const status = (error as { $metadata?: { httpStatusCode?: number } })
    .$metadata?.httpStatusCode;
  if (status === 304) {
    res.status(304).end();
    return;
  }
  res.sendStatus(status === 404 || status === 416 ? status : 502);
}
