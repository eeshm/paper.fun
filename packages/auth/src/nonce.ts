import crypto from 'crypto';
import {client as redis, redisKeys } from '@repo/redis';

/**
 * Generate a random nonce for wallet signature
 * Nonce is valid for 10 minutes (one-time use)
 * 
 * @param walletAddress - User's wallet address
 * @returns Nonce string (hex)
 */