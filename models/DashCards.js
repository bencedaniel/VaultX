import mongoose from 'mongoose';



/**
 * Dashboard kártya (DashboardCard) mongoose séma.
 * A főoldali kártyák metaadatait tartalmazza (pl. admin/user, jogosultság, cím, szöveg, linkek).
 *
 * @property {String} dashtype - Kártya típusa ('user' vagy 'admin').
 * @property {Number} priority - Megjelenítési sorrend/prioritás (alapértelmezett: 99).
 * @property {String} style - Megjelenítési stílus (pl. szín).
 * @property {String} perm - Jogosultság, amelyhez a kártya tartozik.
 * @property {String} title - Kártya címe.
 * @property {String} text - Kártya szövege.
 * @property {String[]} label - Címkék tömbje.
 * @property {String[]} href - Linkek tömbje.
 * @property {Date} createdAt - Létrehozás időpontja (automatikus).
 * @property {Date} updatedAt - Utolsó módosítás időpontja (automatikus).
 */
const DashboardCardSchema = new mongoose.Schema({
  /**
   * Kártya típusa ('user' vagy 'admin').
   */
  dashtype: {
    type: String,
    required: [true, 'Dashboard type is required'],
    enum: ['user', 'admin','office']
  },
  /**
   * Megjelenítési sorrend/prioritás.
   */
  priority: {
    type: Number,
    required: [true, 'Priority is required'],
    default: 99
  },
  /**
   * Megjelenítési stílus (pl. szín).
   */
  style: {
    type: String,
    required: [true, 'Style is required']
  },
  /**
   * Jogosultság, amelyhez a kártya tartozik.
   */
  perm: {
    type: String,
    required: [true, 'Permission is required']
  },
  /**
   * Kártya címe.
   */
  title: {
    type: String,
    required: [true, 'Title is required']
  },
  /**
   * Kártya szövege.
   */
  text: {
    type: String,
    default: ''
  },
  /**
   * Címkék tömbje.
   */
  label: {
    type: [String],
    default: ''
  },
  /**
   * Linkek tömbje.
   */
  href: {
    type: [String],
    default: ''
  },
}, { timestamps: true });

/**
 * DashboardCard mongoose modell exportálása.
 */
export default mongoose.model('dashboarcards', DashboardCardSchema);
