/**
 * Type definitions for application configuration
 */

export type NodeEnv = 'development' | 'production' | 'test';

export interface AppConfig {
  // Server
  port: number;
  nodeEnv: NodeEnv;
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;

  // Database
  databaseUrl: string;

  // Redis
  redisUrl: string;

  // Security
  jwtSecret: string;
  corsOrigin: string;

  // Logging
  logLevel: string;
}
