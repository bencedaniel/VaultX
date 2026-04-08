import { validationResult } from "express-validator";
import { logValidation } from "../logger.js";

/**
 * Express-validator middleware validációs eredmények ellenőrzésére.
 * Ha vannak hibák, naplózza azokat, visszatölti a form adatokat a session-be,
 * és visszairányítja a felhasználót az eredeti oldalra hibaüzenettel.
 * @param {Request} req - Express kérés objektum.
 * @param {Response} res - Express válasz objektum.
 * @param {Function} next - Express next függvény.
 */
const Validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Hibák üzeneteinek összegyűjtése
        const messages = errors.array().map(err => err.msg);
        const errorMessage = messages.join(", ");

        // Validáció naplózása felhasználóval
        logValidation('FIELD_VALIDATION', errorMessage, { user: req.user?.username });

        // Hibaüzenet és form adatok session-be mentése
        req.session.failMessage = errorMessage;
        req.session.formData = req.body;
        // Visszairányítás az eredeti oldalra
        return res.redirect(req.originalUrl);
    }
    // Ha nincs hiba, tovább a következő middleware-re
    next();
};

export default Validate;
