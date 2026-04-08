// Szerepkör modell importálása
import Role from '../models/Role.js';
// Felhasználó modell importálása
import User from '../models/User.js';
// Jogosultság modell importálása
import Permissions from '../models/Permissions.js';
// Naplózó függvény importálása
import { logDb } from '../logger.js';

/**
 * Az összes szerepkör lekérése
 * @returns {Promise<Array>} - Minden Role rekord
 */
export async function getAllRoles() {
    return await Role.find();
}

/**
 * Szerepkör lekérése azonosító alapján
 * @param {string} roleId - Szerepkör egyedi azonosítója
 * @returns {Promise<Object|null>} - A megtalált Role rekord vagy null
 */
export async function getRoleById(roleId) {
    return await Role.findById(roleId);
}

/**
 * Az összes szerepkör lekérése, valamint hogy hány felhasználóhoz van hozzárendelve
 * @returns {Promise<Object>} - Szerepkörök és hozzárendelt felhasználók száma
 */
export async function getAllRolesWithUserCounts() {
    const roles = await Role.find();
    const RoleNumList = [];
    
    for (const role of roles) {
        const CountUsersbyRoleId = await User.countDocuments({ role: role._id });
        RoleNumList.push({ roleID: role._id, count: CountUsersbyRoleId });
    }
    
    return { roles, RoleNumList };
}

/**
 * Szerepkör létrehozás/szerkesztés űrlaphoz szükséges adatok lekérése
 * @returns {Promise<Object>} - Jogosultság lista az űrlaphoz
 */
export async function getRoleFormData() {
    const permissions = await Permissions.find();
    return { permissions };
}

/**
 * Új szerepkör létrehozása
 * @param {Object} roleData - Az új szerepkör adatai
 * @returns {Promise<Object>} - A létrehozott Role rekord
 */
export async function createRole(roleData) {
    const { roleName, description, permissions } = roleData;
    const newRole = new Role({
        roleName,
        description,
        permissions
    });
    await newRole.save();
    logDb('CREATE', 'Role', `${roleName}`);
    return newRole;
}

/**
 * Szerepkör frissítése
 * @param {string} roleId - A frissítendő szerepkör azonosítója
 * @param {Object} roleData - Új adatok
 * @returns {Promise<Object|null>} - A frissített Role rekord vagy null
 */
export async function updateRole(roleId, roleData) {
    const { roleName, description, permissions } = roleData;
    
    const updatedRole = await Role.findByIdAndUpdate(roleId, {
        roleName,
        description,
        permissions
    }, { runValidators: true });
    logDb('UPDATE', 'Role', `${roleName}`);
    
    return updatedRole;
}

/**
 * Szerepkör törlése (csak ha nincs hozzárendelve felhasználóhoz)
 * @param {string} roleId - A törlendő szerepkör azonosítója
 * @returns {Promise<Object>} - A törölt Role rekord
 * @throws {Error} - Ha a szerepkör használatban van, vagy nem található
 */
export async function deleteRole(roleId) {
    const role = await Role.findById(roleId);
    if (!role) {
        throw new Error('Role not found');
    }

    // Check if the role is assigned to any user
    const userCount = await User.countDocuments({ role: roleId });
    if (userCount > 0) {
        throw new Error('Cannot delete role. It is assigned to one or more users.');
    }

    await Role.findByIdAndDelete(roleId);
    logDb('DELETE', 'Role', `${role.roleName}`);
    return role;
}
