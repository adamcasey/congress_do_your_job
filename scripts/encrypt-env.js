#!/usr/bin/env node

/**
 * Encrypt .env file for safe storage in GitHub
 * Usage: node scripts/encrypt-env.js
 *
 * This script uses AES-256-GCM encryption with a passphrase stored in GitHub Secrets
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
 * Encrypt data using AES-256-GCM
 */
function encrypt(text, passphrase) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(passphrase, salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  // Combine salt + iv + tag + encrypted data
  const result = Buffer.concat([
    salt,
    iv,
    tag,
    Buffer.from(encrypted, 'hex')
  ]);

  return result.toString('base64');
}

/**
 * Main encryption function
 */
function main() {
  const envPath = path.join(process.cwd(), '.env');
  const encryptedPath = path.join(process.cwd(), '.env.encrypted');

  // Check if .env exists
  if (!fs.existsSync(envPath)) {
    console.error('Error: .env file not found');
    console.log('Create a .env file first or copy from .env.example');
    process.exit(1);
  }

  // Get passphrase from environment or prompt
  const passphrase = process.env.ENV_ENCRYPTION_KEY;

  if (!passphrase) {
    console.error('Error: ENV_ENCRYPTION_KEY environment variable not set');
    console.log('');
    console.log('Set the encryption key:');
    console.log('  export ENV_ENCRYPTION_KEY="your-secret-passphrase"');
    console.log('');
    console.log('Then run this script again.');
    console.log('');
    console.log('⚠️  IMPORTANT: Store this passphrase in GitHub Secrets as ENV_ENCRYPTION_KEY');
    process.exit(1);
  }

  // Read .env file
  const envContent = fs.readFileSync(envPath, 'utf8');

  // Encrypt
  const encrypted = encrypt(envContent, passphrase);

  // Write encrypted file
  fs.writeFileSync(encryptedPath, encrypted, 'utf8');

  console.log('✅ Successfully encrypted .env file');
  console.log(`   Output: ${encryptedPath}`);
  console.log('');
  console.log('⚠️  Remember to:');
  console.log('   1. Add ENV_ENCRYPTION_KEY to GitHub Secrets');
  console.log('   2. Commit .env.encrypted to git');
  console.log('   3. NEVER commit the unencrypted .env file');
}

main();
