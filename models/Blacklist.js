import mongoose from "mongoose";
/**
 * Blacklist mongoose séma.
 * Letiltott JWT tokeneket tárol, hogy a kijelentkezett vagy visszavont tokenek ne legyenek érvényesek.
 *
 * @property {String} token - A letiltott JWT token (kötelező).
 * @property {Date} createdAt - Létrehozás időpontja (automatikus).
 * @property {Date} updatedAt - Utolsó módosítás időpontja (automatikus).
 */
const BlacklistSchema = new mongoose.Schema(
    {
        /**
         * A letiltott JWT token.
         */
        token: {
            type: String,
            required: true,
            ref: "User",
        },
    },
    { timestamps: true }
);
/**
 * Blacklist mongoose modell exportálása.
 */
export default mongoose.model("blacklist", BlacklistSchema);
