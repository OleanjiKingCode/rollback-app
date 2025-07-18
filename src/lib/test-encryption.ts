/**
 * Test file to verify frontend encryption compatibility with backend
 */
import { encryptPrivateKey } from "./encryption";

// Test function to verify encryption works
export async function testEncryptionCompatibility() {
  try {
    console.log("🧪 Testing encryption compatibility...");

    const testPrivateKey =
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const encrypted = await encryptPrivateKey(testPrivateKey);

    console.log("✅ Encryption successful!");
    console.log("🔐 Encrypted length:", encrypted.length);
    console.log(
      "📝 Encrypted (first 100 chars):",
      encrypted.substring(0, 100) + "..."
    );

    // Decode base64 to check structure
    const combined = atob(encrypted);
    const saltLength = 64;
    const ivLength = 16;

    console.log("📊 Structure check:");
    console.log("- Total length:", combined.length);
    console.log("- Salt length:", saltLength);
    console.log("- IV length:", ivLength);
    console.log(
      "- Encrypted data length:",
      combined.length - saltLength - ivLength
    );

    return {
      success: true,
      encrypted,
      structure: {
        totalLength: combined.length,
        saltLength,
        ivLength,
        encryptedDataLength: combined.length - saltLength - ivLength,
      },
    };
  } catch (error) {
    console.error("❌ Encryption test failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Helper to analyze encrypted data structure
export function analyzeEncryptedData(base64Data: string) {
  try {
    const combined = atob(base64Data);
    const bytes = new Uint8Array(combined.length);
    for (let i = 0; i < combined.length; i++) {
      bytes[i] = combined.charCodeAt(i);
    }

    const saltLength = 64;
    const ivLength = 16;

    const salt = bytes.slice(0, saltLength);
    const iv = bytes.slice(saltLength, saltLength + ivLength);
    const encryptedData = bytes.slice(saltLength + ivLength);

    return {
      salt: Array.from(salt),
      iv: Array.from(iv),
      encryptedData: Array.from(encryptedData),
      structure: "salt(64) + iv(16) + encrypted_data",
    };
  } catch (error) {
    console.error("Failed to analyze encrypted data:", error);
    return null;
  }
}
