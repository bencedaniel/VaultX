import crypto from 'crypto';
import { ENCRYPTION_KEY } from '../config/env.js';
const ALGORITHM = 'aes-256-gcm';

function getEncryptionKeyBuffer() {
    if (typeof ENCRYPTION_KEY !== 'string' || ENCRYPTION_KEY.trim() === '') {
        throw new Error('ENCRYPTION_KEY is not configured');
    }

    const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'hex');
    if (keyBuffer.length !== 32) {
        throw new Error('ENCRYPTION_KEY must be a 32-byte hex string for aes-256-gcm');
    }

    return keyBuffer;
}

function encrypt(text) {
    // 1. Generálunk egy egyedi inicializációs vektort (IV)
    const iv = crypto.randomBytes(16);
    
    // 2. Létrehozzuk a titkosítót
    const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKeyBuffer(), iv);
    
    // 3. Titkosítjuk a szöveget
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // 4. Kinyerjük az authentikációs taget
    const authTag = cipher.getAuthTag().toString('hex');

    // Mivel a dekódoláshoz az IV-re és az authTag-re is szükség van, 
    // összefűzzük őket a titkosított adattal, és ezt mentjük az adatbázisba.
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function decrypt(encryptedText) {
    // Szétszedjük a mentett stringet
    const [ivHex, authTagHex, encryptedData] = encryptedText.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    // Létrehozzuk a visszafejtőt
    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKeyBuffer(), iv);
    decipher.setAuthTag(authTag);
    
    // Visszafejtjük az adatot
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
}

export { encrypt, decrypt };

