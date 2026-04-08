import User from '../models/User.js';
import Role from '../models/Role.js';
import bcrypt from 'bcrypt';
import { logDb, logDebug } from '../logger.js';

/**
 * Felhasználó lekérdezése azonosító alapján.
 * @param {string} id - Felhasználó azonosító.
 * @returns {Promise<Object>} Felhasználó dokumentum.
 * @throws {Error} Ha a felhasználó nem található.
 */
export const getUserById = async (id) => {
    const user = await User.findById(id);
    if (!user) {
        throw new Error('User not found');
    }
    return user;
};

/**
 * Felhasználó lekérdezése azonosító alapján, szerepkörrel feltöltve.
 * @param {string} id - Felhasználó azonosító.
 * @returns {Promise<Object>} Feltöltött felhasználó dokumentum.
 * @throws {Error} Ha a felhasználó nem található.
 */
export const getUserByIdWithRole = async (id) => {
    const user = await User.findById(id).populate('role');
    if (!user) {
        throw new Error('User not found');
    }
    return user;
};

/**
 * Felhasználói profil frissítése (felhasználónév, feiid, jelszó, teljes név).
 * @param {string} id - Felhasználó azonosító.
 * @param {Object} data - Frissítendő adatok (username, feiid, password, fullname).
 * @returns {Promise<Object>} A frissített felhasználó dokumentum.
 * @throws {Error} Ha a felhasználó nem található.
 */
export const updateUserProfile = async (id, data) => {
    logDebug(`Updating user ${id} with data: ${JSON.stringify(data)}`);
    const { username, feiid, password, fullname } = data;
    const updateData = { username, feiid, fullname };
    
    // Ha nincs új jelszó megadva, megtartjuk a régit
    if (!password || password === '') {
        const user = await User.findById(id);
        if (!user) {
            throw new Error('User not found');
        }
        updateData.password = user.password;
    } else {
        // Új jelszó titkosítása
        updateData.password = await bcrypt.hash(password, 10);
    }
    
    const updatedUser = await User.findByIdAndUpdate(id, updateData, { runValidators: true, new: true });
    if (!updatedUser) {
        throw new Error('User not found');
    }
    logDb('UPDATE', 'User', `${id}`);
    return updatedUser;
};

/**
 * Összes szerepkör lekérdezése.
 * @returns {Promise<Array>} Szerepkörök tömbje.
 */
export const getAllRoles = async () => {
    return await Role.find();
};

/**
 * Űrlap-adatok lekérdezése felhasználói profilhoz (szerepkörök listája).
 * @returns {Promise<Object>} Objektum, amely tartalmazza a szerepkörök tömbjét.
 */
export const getUserProfileFormData = async () => {
    const roleList = await Role.find();
    return { roleList };
};
