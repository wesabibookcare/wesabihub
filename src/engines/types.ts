export type WOSStatus = 'SUCCESS' | 'FAILURE' | 'PENDING' | 'WARNING';

export interface WOSResponse<T = any> {
  status: WOSStatus;
  success: boolean;
  message: string;
  data?: T;
  errorCode?: string;
  auditRef?: string;
  nextAction?: string;
  timestamp: string;
}

export function createWOSResponse<T>(
  success: boolean,
  message: string,
  data?: T,
  options: Partial<Omit<WOSResponse<T>, 'success' | 'message' | 'data' | 'timestamp'>> = {}
): WOSResponse<T> {
  return {
    success,
    status: success ? 'SUCCESS' : 'FAILURE',
    message,
    data,
    timestamp: new Date().toISOString(),
    ...options
  };
}
