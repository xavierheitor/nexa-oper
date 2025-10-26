declare module 'multer' {
  interface MulterLimits {
    fields?: number;
    files?: number;
    parts?: number;
    fileSize?: number;
    fieldNameSize?: number;
    fieldSize?: number;
    headerPairs?: number;
  }

  interface StorageEngine {} // eslint-disable-line @typescript-eslint/no-empty-interface

  interface MulterOptions {
    storage?: StorageEngine;
    limits?: MulterLimits;
    fileFilter?: (
      req: import('express').Request,
      file: Express.Multer.File,
      callback: (error: Error | null, acceptFile: boolean) => void
    ) => void;
  }

  export function memoryStorage(): StorageEngine;
  export default function multer(options?: MulterOptions): unknown;
}

declare namespace Express {
  namespace Multer {
    interface File {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
      destination?: string;
      filename?: string;
      path?: string;
      stream: NodeJS.ReadableStream;
    }
  }
}
