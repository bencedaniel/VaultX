// Felhasználó modell importálása
import User from '../models/User.js';
// Szerepkör modell importálása
import Role from '../models/Role.js';
// Jelszó hash-eléshez szükséges könyvtár
import bcrypt from 'bcrypt';
// Naplózó függvény importálása
import { logDb } from '../logger.js';

/**
 * Az összes felhasználó lekérése, szerepkör információval együtt
 * @returns {Promise<Array>} - Felhasználók listája, szerepkörrel kiegészítve
 */
export async function getAllUsersWithRoles() {
    return await User.find().populate('role', 'roleName');
}

/**
 * Felhasználó lekérése azonosító alapján
 * @param {string} userId - Felhasználó egyedi azonosítója
 * @returns {Promise<Object|null>} - A megtalált felhasználó vagy null
 */
export async function getUserById(userId) {
    return await User.findById(userId);
}

/**
 * Felhasználó létrehozás/szerkesztés űrlaphoz szükséges adatok lekérése
 * @returns {Promise<Object>} - Szerepkör lista az űrlaphoz
 */
export async function getUserFormData() {
    const roles = await Role.find();
    return { roles };
}

/**
 * Felhasználó adatainak frissítése, jelszó kezelésével
 * Ha a jelszó üres, megtartja a régit; ha van új jelszó, hash-eli mentés előtt
 * @param {string} userId - A frissítendő felhasználó azonosítója
 * @param {Object} updateData - Új adatok (pl. username, password, role, stb.)
 * @returns {Promise<Object|null>} - A frissített felhasználó vagy null
 */
export async function updateUser(userId, updateData) {
    const processedData = { ...updateData };
    
    // Jelszó logika kezelése
    if (updateData.password === '') {
        // Ha üres a jelszó mező, megtartjuk a régi hash-elt jelszót
        const existingUser = await User.findById(userId);
        processedData.password = existingUser.password;
    } else {
        // Ha új jelszót adtak meg, hash-eljük mentés előtt
        processedData.password = await bcrypt.hash(updateData.password, 10);
    }
    // Felhasználó frissítése az új adatokkal
    const user = await User.findByIdAndUpdate(userId, processedData, { runValidators: true });
    logDb('UPDATE', 'User', `${processedData.username}`);
    return user;
}

/**
 * Felhasználó inaktiválása (soft delete)
 * @param {string} userId - Az inaktiválandó felhasználó azonosítója
 * @returns {Promise<Object>} - Az inaktivált felhasználó
 * @throws {Error} - Ha a felhasználó nem található
 */
export async function inactivateUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }
    
    // Aktív státusz false-ra állítása (soft delete)
    user.active = false;
    await User.findByIdAndUpdate(userId, user, { runValidators: true });
    logDb('UPDATE', 'User', `${user.username}`);
    
    return user;
}
