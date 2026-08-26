export interface StorageUploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  isPrivate?: boolean;
}

export interface StorageAdapter {
  upload(key: string, data: Buffer | Blob, options?: StorageUploadOptions): Promise<string>;
  delete(key: string): Promise<boolean>;
  get(key: string): Promise<Buffer | null>;
  exists(key: string): Promise<boolean>;
  getAccessUrl(key: string, expiresInSeconds?: number): Promise<string>;
}
