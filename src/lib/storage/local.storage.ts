import fs from 'fs/promises';
import path from 'path';
import { StorageAdapter, StorageUploadOptions } from './storage.adapter';

export class LocalStorageAdapter implements StorageAdapter {
  private baseDir: string;

  constructor(baseDir = path.join(process.cwd(), 'uploads')) {
    this.baseDir = baseDir;
    // Ensure base directory exists in development
    fs.mkdir(this.baseDir, { recursive: true }).catch(console.error);
  }

  private getFilePath(key: string) {
    // Prevent directory traversal
    const safeKey = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, '');
    return path.join(this.baseDir, safeKey);
  }

  async upload(key: string, data: Buffer | Blob, options?: StorageUploadOptions): Promise<string> {
    const filePath = this.getFilePath(key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    
    let buffer: Buffer;
    if (data instanceof Blob) {
      buffer = Buffer.from(await data.arrayBuffer());
    } else {
      buffer = data;
    }

    await fs.writeFile(filePath, buffer);
    return key;
  }

  async delete(key: string): Promise<boolean> {
    try {
      await fs.unlink(this.getFilePath(key));
      return true;
    } catch {
      return false;
    }
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      return await fs.readFile(this.getFilePath(key));
    } catch {
      return null;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.getFilePath(key));
      return true;
    } catch {
      return false;
    }
  }

  async getAccessUrl(key: string, expiresInSeconds?: number): Promise<string> {
    // In local development, we might serve this via a generic local API route
    return `/api/v1/media?key=${encodeURIComponent(key)}`;
  }
}

export const storage = new LocalStorageAdapter();
