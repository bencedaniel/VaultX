// Token feketelista modell importálása
import Blacklist from '../models/Blacklist.js';
// Felhasználó modell importálása
import User from '../models/User.js';
// Szerepkör modell importálása
import RoleModel from '../models/Role.js';
// Jogosultság modell importálása
import PermissionModel from '../models/Permissions.js';
// Logger és adatbázis naplózó importálása
import { logger } from '../logger.js';
import { logDb } from '../logger.js';

/**
 * Ellenőrzi, hogy a token feketelistán van-e
 * @param {string} token - Az ellenőrizendő token
 * @returns {Promise<Object|null>} - A megtalált Blacklist rekord vagy null
 */
export async function isTokenBlacklisted(token) {
    return await Blacklist.findOne({ token });
}

/**
 * Token feketelistára helyezése
 * @param {string} token - A feketelistára helyezendő token
 * @returns {Promise<Object>} - A létrehozott Blacklist rekord
 */
export async function blacklistToken(token) {
    const newBlacklist = new Blacklist({ token });
    await newBlacklist.save();
    // Naplózás: token sikeresen feketelistára került
    logger.userManagement(`Token blacklisted successfully.`);
    logDb('CREATE', 'Blacklist', `${newBlacklist._id}`);
    return newBlacklist;
}

/**
 * Felhasználó keresése azonosító alapján, szerepkörrel együtt
 * @param {string} userId - A keresett felhasználó azonosítója
 * @returns {Promise<Object|null>} - A megtalált felhasználó (szerepkörrel) vagy null
 */
export async function findUserByIdWithRole(userId) {
    return await User.findById(userId).populate("role");
}

/**
 * Szerepkör lekérése jogosultságokkal együtt, szerepkör azonosító alapján
 * @param {string} roleId - A keresett szerepkör azonosítója
 * @returns {Promise<Object|null>} - A szerepkör és a hozzá tartozó jogosultságok, vagy null ha nem található
 */
export async function getRoleWithPermissions(roleId) {
    const role = await RoleModel.findById(roleId);
    if (!role) return null;
    // Jogosultságok lekérése, amelyek szerepelnek a szerepkörben
    const permissions = await PermissionModel.find({
        name: { $in: role.permissions }
    });
    return { role, permissions };
}
