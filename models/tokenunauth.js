import mongoose from "mongoose";
/**
 * Blacklist mongoose séma.
 * Letiltott JWT tokeneket tárol, hogy a kijelentkezett vagy visszavont tokenek ne legyenek érvényesek.
 *
 * @property {String} token - A letiltott JWT token (kötelező).
 * @property {Date} createdAt - Létrehozás időpontja (automatikus).
 * @property {Date} updatedAt - Utolsó módosítás időpontja (automatikus).
 */
const unauthTokenSchema = new mongoose.Schema(
    {
        /**
         * A letiltott JWT token.
         */
        token: {
            type: String,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

unauthTokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });
/**
 * UnauthToken mongoose modell exportálása.
 */
export default mongoose.model("unauthtoken", unauthTokenSchema);
