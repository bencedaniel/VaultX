// Jogosultság modell importálása
import Permissions from '../models/Permissions.js';
// Szerepkör modell importálása
import Role from '../models/Role.js';
// Dashboard kártya modell importálása
import DashCards from '../models/DashCards.js';
// Riasztás modell importálása
import Alert from '../models/Alert.js';
// Naplózó függvény importálása
import { logDb } from '../logger.js';

/**
 * Az összes jogosultság lekérése
 * @returns {Promise<Array>} - Minden Permissions rekord
 */
export async function getAllPermissions() {
    return await Permissions.find();
}

/**
 * Jogosultság lekérése azonosító alapján
 * @param {string} permId - Jogosultság egyedi azonosítója
 * @returns {Promise<Object|null>} - A megtalált Permissions rekord vagy null
 */
export async function getPermissionById(permId) {
    return await Permissions.findById(permId);
}

/**
 * Az összes jogosultság lekérése, valamint hogy hány helyen van használatban (szerepkör, kártya, riasztás)
 * @returns {Promise<Object>} - Jogosultságok és használati statisztikák
 */
export async function getAllPermissionsWithUsageCounts() {
    const permissions = await Permissions.find();
    const RolePermNumList = [];
    
    for (const perm of permissions) {
        RolePermNumList.push({
            permID: perm._id,
            Rolecount: await Role.countDocuments({ permissions: perm.name }),
            Cardcount: await DashCards.countDocuments({ perm: perm.name }),
            Alertcount: await Alert.countDocuments({ permission: perm.name })
        });
    }
    
    return { permissions, RolePermNumList };
}

/**
 * Új jogosultság létrehozása
 * @param {Object} permData - Az új jogosultság adatai
 * @returns {Promise<Object>} - A létrehozott Permissions rekord
 */
export async function createPermission(permData) {
    const { name, displayName, attachedURL, requestType } = permData;
    const newPermission = new Permissions({
        name,
        displayName,
        attachedURL,
        requestType
    });
    await newPermission.save();
    logDb('CREATE', 'Permission', `${name}`);
    return newPermission;
}

/**
 * Jogosultság frissítése
 * @param {string} permId - A frissítendő jogosultság azonosítója
 * @param {Object} permData - Új adatok
 * @returns {Promise<Object|null>} - A frissített Permissions rekord vagy null
 */
export async function updatePermission(permId, permData) {
    const { displayName, attachedURL } = permData;
    
    const updatedPermission = await Permissions.findByIdAndUpdate(permId, {
        displayName: displayName,
        attachedURL: attachedURL
    }, { runValidators: true });
    logDb('UPDATE', 'Permission', `${updatedPermission.name}`);
    
    return updatedPermission;
}

/**
 * Jogosultság törlése (csak ha nincs használatban sehol)
 * @param {string} permId - A törlendő jogosultság azonosítója
 * @returns {Promise<Object>} - A törölt Permissions rekord
 * @throws {Error} - Ha a jogosultság használatban van, vagy nem található
 */
export async function deletePermission(permId) {
    const permission = await Permissions.findById(permId);
    if (!permission) {
        throw new Error('Permission not found');
    }
    
    // Check if permission is assigned to any dashboard cards
    const CardCount = await DashCards.countDocuments({ requiredPermissions: permission.name });
    if (CardCount > 0) {
        throw new Error('Cannot delete permission. It is assigned to one or more dashboard cards.');
    }
    
    // Check if permission is assigned to any alerts
    const alertCount = await Alert.countDocuments({ requiredPermissions: permission.name });
    if (alertCount > 0) {
        throw new Error('Cannot delete permission. It is assigned to one or more alerts.');
    }
    
    // Check if permission is assigned to any roles
    const roleCount = await Role.countDocuments({ permissions: permission.name });
    if (roleCount > 0) {
        throw new Error('Cannot delete permission. It is assigned to one or more roles.');
    }
    
    await Permissions.findByIdAndDelete(permId);
    logDb('DELETE', 'Permission', `${permission.name}`);
    return permission;
}
