import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';

// Create a 32-byte key from env secret
const getKey = () => {
  return crypto
    .createHash('sha256')
    .update(process.env.MESSAGE_SECRET_KEY)
    .digest();
};

export const encryptMessage = (plainText) => {
  if (!plainText) return '';

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return `${iv.toString('hex')}:${encrypted}`;
};

export const decryptMessage = (encryptedText) => {
  if (!encryptedText) return '';

  const [ivHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};