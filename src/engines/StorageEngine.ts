import { StorageService } from '../services/StorageService';
import { monitoringEngine } from './MonitoringEngine';

/**
 * WeSabiHub Storage Engine
 * Manages all platform file persistence and URL generation.
 */
class StorageEngine {
  private static instance: StorageEngine;

  private constructor() {}

  public static getInstance(): StorageEngine {
    if (!StorageEngine.instance) {
      StorageEngine.instance = new StorageEngine();
    }
    return StorageEngine.instance;
  }

  async uploadFile(path: string, file: File | string): Promise<string> {
    try {
      return await StorageService.uploadFile(path, file);
    } catch (err: any) {
      await monitoringEngine.captureError(err, 'STORAGE', 'MEDIUM', { path });
      throw err;
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      await StorageService.deleteFile(path);
    } catch (err: any) {
      await monitoringEngine.captureError(err, 'STORAGE', 'MEDIUM', { path });
      throw err;
    }
  }

  /**
   * Helper for user document uploads
   */
  async uploadUserDocument(userId: string, docType: string, file: File | string): Promise<string> {
    const fileName = typeof file === 'string' ? 'upload.jpg' : file.name;
    const path = StorageService.getUserDocPath(userId, docType, fileName);
    return await this.uploadFile(path, file);
  }
}

export const storageEngine = StorageEngine.getInstance();
