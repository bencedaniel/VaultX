import mongoose, { set } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { SECRET_ACCESS_TOKEN, TIMEOUT } from '../config/env.js';
import { JWT_CONFIG } from '../config/index.js';
import RoleSchema from './Role.js';

/**
 * Felhasználó (User) mongoose séma.
 * Egy rendszerfelhasználó főbb adatai, jelszó hash-elés, JWT generálás.
 *
 * @property {String} username - Felhasználónév (egyedi, kötelező).
 * @property {String} fullname - Teljes név (kötelező).
 * @property {String} password - Jelszó (hash-elve tárolva, kötelező).
 * @property {String} feiid - FEI-azonosító (8 karakter, opcionális, egyedi).
 * @property {Boolean} active - Aktív-e a felhasználó (alapértelmezetten true, kötelező).
 * @property {ObjectId} role - Szerepkör azonosító (roles kollekció, kötelező).
 * @property {Date} createdAt - Létrehozás időpontja (automatikus).
 * @property {Date} updatedAt - Utolsó módosítás időpontja (automatikus).
 * @property {Number} failedLoginAttempts - Sikertelen bejelentkezések száma.
 * @property {Date} bannedUntil - Ha a felhasználó tiltva van, meddig.
 * @property {Boolean} twoFactorNeeded - Kétszintű hitelesítés szükséges-e.
 * @property {String} twoFactorSecret - Kétszintű hitelesítés titka.
 * @property {Boolean} twoFactorEnabled - Kétszintű hitelesítés engedélyezve-e.
 */
const userSchema = new mongoose.Schema({
      /**
       * Felhasználónév (egyedi).
       */
      username:{
        type: String,
        required: [true, 'Username required!'],
        unique: true,
      },
      /**
       * Teljes név.
       */
      fullname:{
        type: String,
        required: [true, 'Fullname required!'],
      },
      /**
       * Jelszó (hash-elve tárolva).
       */
        password:{
            type: String,
            required: [true, 'Password required!'],
        },
        /**
         * FEI-azonosító (8 karakter, opcionális, egyedi).
         * Üres stringből undefined lesz.
         */
        feiid:{
            type: String,
            set: v => v === '' || v == null || v == undefined ? undefined : v, // Üres stringből undefined
          validate: {
            validator: function (value) {
              return value == undefined || value.length === 8;
            },
            message: 'FEI ID must be 8 characters!'
          },
          required: false,
          sparse: true,
          unique: true,
        },
        /**
         * Aktív-e a felhasználó.
         */
        active:{
          type: Boolean,
          default: true,
          required: [true, 'Active status required']
        },
        /**
         * Szerepkör azonosító.
         */
       role:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'roles',
            required: [true, 'Role required!'],
        },
        failedLoginAttempts: {
          type: Number,
          default: 0,
        },
        bannedUntil: {
          type: Date,
          default: null,
        },
        twoFactorNeeded: {
          type: Boolean,
          default: false,
        },
        twoFactorSecret: {
          type: String,
          default: null,
        },
        twoFactorEnabled: {
          type: Boolean,
          default: false,
        }
},{ timestamps: true });


/**
 * Mentés előtti middleware: jelszó hash-elése, ha módosult.
 */
userSchema.pre("save", function (next) {
  const user = this;

  if (!user.isModified("password")) return next();
  bcrypt.genSalt(10, (err, salt) => {
    if (err) return next(err);

    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) return next(err);

      user.password = hash;
      next();
    });
  });
});




/**
 * Hozzáférési JWT generálása a felhasználóhoz.
 * @returns {string} - Aláírt JWT token.
 */
userSchema.methods.generateAccessJWT = function () {
    const timeoutMinutes = parseInt(TIMEOUT, 10)*3 || 90;
    let payload = {
        id: this._id,
    };
    return jwt.sign(payload, SECRET_ACCESS_TOKEN, {
        expiresIn: `${timeoutMinutes}m` ,
    });
};

/**
 * User mongoose modell exportálása.
 */
const User = mongoose.model('users', userSchema);
export default User;