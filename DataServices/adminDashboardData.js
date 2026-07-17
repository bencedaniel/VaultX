// Dashboard kártya modell importálása
import DashCards from '../models/DashCards.js';
// Felhasználó modell importálása
import User from '../models/User.js';
// Jogosultság modell importálása
import Permissions from '../models/Permissions.js';
// Szerepkör modell importálása
import Role from '../models/Role.js';

/**
 * Admin dashboard statisztikai adatok lekérése
 * @returns {Promise<Object>} - Kártyák, felhasználó-, jogosultság- és szerepkör-szám
 */
export async function getAdminDashboardData() {
    const [cards, userCount, permissionCount, roleCount] = await Promise.all([
        DashCards.find({ dashtype: 'admin' }).sort({ priority: 1 }),
        User.countDocuments(),
        Permissions.countDocuments(),
        Role.countDocuments()
    ]);

    return {
        cards,
        userCount,
        permissionCount,
        roleCount
    };
}
export async function getOfficeDashboardData() {
    const [cards, userCount, permissionCount, roleCount] = await Promise.all([
        DashCards.find({ dashtype: 'office' }).sort({ priority: 1 }),
        User.countDocuments(),
        Permissions.countDocuments(),
        Role.countDocuments()
    ]);

    return {
        cards,
        userCount,
        permissionCount,
        roleCount
    };
}


/**
 * Az összes felhasználó lekérése az admin dashboardhoz
 * @returns {Promise<Array>} - Minden User rekord
 */
export async function getAllUsers() {
    return await User.find();
}

/**
 * Az összes jogosultság lekérése az admin dashboardhoz
 * @returns {Promise<Array>} - Minden Permissions rekord
 */
export async function getAllPermissions() {
    return await Permissions.find();
}
