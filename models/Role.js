import mongoose from 'mongoose';



/**
 * Szerepkör (Role) mongoose séma.
 * Felhasználói szerepkörök, azok jogosultságai és leírása.
 *
 * @property {String} roleName - Szerepkör neve (egyedi, kötelező).
 * @property {String[]} permissions - Jogosultságok tömbje (kötelező).
 * @property {String} description - Szerepkör leírása (kötelező, alapértelmezetten üres).
 * @property {Date} createdAt - Létrehozás időpontja (automatikus).
 * @property {Date} updatedAt - Utolsó módosítás időpontja (automatikus).
 */
const RoleSchema = new mongoose.Schema({
        /**
         * Szerepkör neve (egyedi).
         */
        roleName:{
            type: String,
            required: [true, 'Role name required!'],
            unique: true,
        },
        /**
         * Jogosultságok tömbje.
         */
        permissions:{
            type: [String],
            required: [true, 'Permissions required!'],
        },
        /**
         * Szerepkör leírása.
         */
        description:{
            type: String,
            default: '',
            required: [true, 'Description required!'],
        }
},{ timestamps: true });

/**
 * Role mongoose modell exportálása.
 */
export default mongoose.model('roles', RoleSchema);
