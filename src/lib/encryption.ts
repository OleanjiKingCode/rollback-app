/**
 * Frontend encryption service that matches the backend implementation
 * Uses AES-256-CBC with PBKDF2 key derivation using Web Crypto API
 */

const ALGORITHM = "AES-CBC";
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 64; // 512 bits
const PBKDF2_ITERATIONS = 100000;

// Use the same encryption key as backend (should match ENCRYPTION_KEY env var on backend)
const ENCRYPTION_KEY =
  import.meta.env.VITE_ENCRYPTION_KEY || "rollback-frontend-encryption-key01"; // 32 characters exactly

/**
 * Encrypts a private key using AES-256-CBC with PBKDF2 key derivation
 * Matches the backend encryption implementation exactly using Web Crypto API
 */
export async function encryptPrivateKey(privateKey: string): Promise<string> {
  try {


    // Check if Web Crypto API is available
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error("Web Crypto API not available in this browser");
    }

    // Generate random IV and salt using Web Crypto API
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

    // Convert encryption key to buffer
    const keyBuffer = new TextEncoder().encode(ENCRYPTION_KEY);

    // Import the base key for PBKDF2
    const baseKey = await window.crypto.subtle.importKey(
      "raw",
      keyBuffer,
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"]
    );

    // Derive key using PBKDF2 (matches backend implementation)
    const derivedKey = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: PBKDF2_ITERATIONS,
        hash: "SHA-512",
      },
      baseKey,
      { name: ALGORITHM, length: KEY_LENGTH * 8 },
      false,
      ["encrypt"]
    );

    // Encrypt the private key
    const privateKeyBuffer = new TextEncoder().encode(privateKey);
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv,
      },
      derivedKey,
      privateKeyBuffer
    );

    // Combine all components: salt + iv + encrypted data
    const saltArray = Array.from(salt);
    const ivArray = Array.from(iv);
    const encryptedArray = Array.from(new Uint8Array(encryptedBuffer));

    const combined = new Uint8Array([
      ...saltArray,
      ...ivArray,
      ...encryptedArray,
    ]);

    // Convert to base64 (matches backend format)
    const base64Result = btoa(String.fromCharCode(...combined));

    return base64Result;
  } catch (error) {
    console.error("❌ Failed to encrypt private key on frontend:", error);
    throw new Error(`Failed to encrypt private key: ${error.message}`);
  }
}

/**
 * Utility function to verify encryption/decryption works
 * This can be used for testing purposes
 */
export async function testEncryption(testKey: string): Promise<boolean> {
  try {
    const encrypted = await encryptPrivateKey(testKey);
    return encrypted.length > 0;
  } catch (error) {
    console.error("❌ Encryption test failed:", error);
    return false;
  }
}
