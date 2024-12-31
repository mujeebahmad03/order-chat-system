export interface ApiResponseType<T> {
  success: boolean;
  data?: T;
  error?: string | string[];
  message?: string;
  metadata?: {
    timestamp: string;
    path: string;
    [key: string]: any;
  };
}
