declare module 'multer-s3' {
  import { StorageEngine } from 'multer';
  import { S3Client } from '@aws-sdk/client-s3';

  interface S3StorageOptions {
    s3: S3Client;
    bucket: string;
    metadata?: (req: Express.Request, file: Express.Multer.File, cb: (error: any, metadata?: any) => void) => void;
    key?: (req: Express.Request, file: Express.Multer.File, cb: (error: any, key?: string) => void) => void;
    contentType?: (req: Express.Request, file: Express.Multer.File, cb: (error: any, contentType?: string) => void) => void;
    acl?: string;
  }

  function s3Storage(options: S3StorageOptions): StorageEngine;
  export = s3Storage;
} 