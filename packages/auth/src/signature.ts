import * as ed from '@noble/ed25519';
import bs58 from 'bs58';

/**
 * Verify that a message was signed by the wallet's private key
 * For Solana: Uses Ed25519 signature verification
 * 
 * @param message - Original message that was signed
 * @param signature - Base58-encoded signature from wallet
 * @param walletAddress - Base58-encoded public key (wallet address)
 * @returns true if signature is valid, false otherwise
 */
export async function verifySignature(
  message: string,
  signature: string,
  walletAddress: string
): Promise<boolean> {
  try {
    // Decode base58 inputs to raw bytes
    const signatureBytes = bs58.decode(signature);
    const addressBytes = bs58.decode(walletAddress);

    // Encode message to UTF-8 bytes
    const messageBytes = new TextEncoder().encode(message);

    // Verify signature: ed25519.verify(signature, message, publicKey)
    // Note: ed.verify() is synchronous, returns boolean directly
    const isValid = ed.verify(signatureBytes, messageBytes, addressBytes);

    return isValid;
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}