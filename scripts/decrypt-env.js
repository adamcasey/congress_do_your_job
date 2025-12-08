#!/usr/bin/env node

/**
 * Decrypt .env.encrypted file
 * Usage: node scripts/decrypt-env.js
 *
 * This script decrypts the .env.encrypted file using the passphrase from ENV_ENCRYPTION_KEY
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Derive encryption key from passphrase using PBKDF2
 */
function deriveKey(passphrase, salt) {
  return crypto.pbkdf2Sync(passphrase, salt, 100000, KEY_LENGTH, 'sha256');
}

/**
 * Decrypt data using AES-256-GCM
 */
function decrypt(encryptedData, passphrase) {
  const buffer = Buffer.from(encryptedData, 'base64');

  // Extract components
  const salt = buffer.subarray(0, SALT_LENGTH);
  const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

  // Derive key
  const key = deriveKey(passphrase, salt);

  // Decrypt
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, null, 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Main decryption function
 */
function main() {
  const encryptedPath = path.join(process.cwd(), '.env.encrypted');
  const envPath = path.join(process.cwd(), '.env');

  // Check if .env.encrypted exists
  if (!fs.existsSync(encryptedPath)) {
    console.error('Error: .env.encrypted file not found');
    console.log('Run encrypt-env.js first to create the encrypted file');
    process.exit(1);
  }

  // Get passphrase from environment
  const passphrase = process.env.ENV_ENCRYPTION_KEY;

  if (!passphrase) {
    console.error('Error: ENV_ENCRYPTION_KEY environment variable not set');
    console.log('');
    console.log('Set the encryption key:');
    console.log('  export ENV_ENCRYPTION_KEY="your-secret-passphrase"');
    console.log('');
    console.log('This should match the key used to encrypt the file.');
    process.exit(1);
  }

  // Read encrypted file
  const encryptedContent = fs.readFileSync(encryptedPath, 'utf8');

  try {
    // Decrypt
    const decrypted = decrypt(encryptedContent, passphrase);

    // Write .env file
    fs.writeFileSync(envPath, decrypted, 'utf8');

    console.log('✅ Successfully decrypted .env.encrypted');
    console.log(`   Output: ${envPath}`);
    console.log('');
    console.log('⚠️  The .env file is not tracked by git - keep it safe!');
  } catch (error) {
    console.error('❌ Decryption failed');
    console.error('   This usually means the passphrase is incorrect');
    console.error('');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
