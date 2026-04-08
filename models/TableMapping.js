import mongoose from "mongoose";


/**
 * Bírói asztal hozzárendelés (TableMapping) mongoose séma.
 * Egy bírói asztal, teszttípus és szerepkör összerendelését tárolja.
 *
 * @property {String} Table - Bírói asztal azonosítója (A-H, kötelező).
 * @property {String} TestType - Teszttípus ('compulsory', 'free test', 'technical test', kötelező).
 * @property {String} Role - Szerepkör ('horse', 'compulsory', 'artistic', 'technical', kötelező).
 * @property {Date} createdAt - Létrehozás időpontja (automatikus).
 * @property {Date} updatedAt - Utolsó módosítás időpontja (automatikus).
 */
const TableMappingSchema = new mongoose.Schema(
    {
        /**
         * Bírói asztal azonosítója (A-H).
         */
        Table: {
            type: String,
            enum: ['A', 'B','C','D','E','F','G','H'],
            required: [true, 'Judge Table ID required!'],
        },
        /**
         * Teszttípus.
         */
        TestType: {
            type: String,
            enum: ['compulsory', 'free test','technical test'],
            required: [true, 'Test type required!'],
        },
        /**
         * Szerepkör.
         */
        Role: {
            type: String,
            enum: ['horse', 'compulsory','artistic','technical'],
            required: [true, 'Role required!'],
        },
    },
    { timestamps: true }
);

/**
 * TableMapping mongoose modell exportálása.
 */
export default mongoose.model('tables', TableMappingSchema);
