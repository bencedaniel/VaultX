import Permissions from '../models/Permissions.js';
import Helpmessage from '../models/HelpMessage.js';
import { logDb, logDebug } from '../logger.js';
import { MESSAGES } from '../config/index.js';
/**
 * Retrieves all help messages sorted by description
 * @returns {Promise<Array>} Array of help messages
 */
export async function getAllHelpMessages() {
    const helpMessages = await Helpmessage.find().sort({ description: 1 });
    return helpMessages;
}

/**
 * Retrieves a help message by ID
 * @param {string} id - Help message ID
 * @returns {Promise<Object>} Help message document
 * @throws {Error} If help message not found
 */
export async function getHelpMessageById(id) {
    const helpMessage = await Helpmessage.findById(id);
    if (!helpMessage) {
        throw new Error("Help message not found");
    }
    return helpMessage;
}

/**
 * Creates a new help message
 * @param {Object} data - Help message data
 * @returns {Promise<Object>} Created help message document
 */
export async function createHelpMessage(data) {
    const newHelpMessage = new Helpmessage(data);
    await newHelpMessage.save();
    logDb('CREATE', 'Helpmessage', `${newHelpMessage._id}`);
    return newHelpMessage;
}

/**
 * Updates a help message by ID
 * @param {string} id - Help message ID
 * @param {Object} data - Updated help message data
 * @returns {Promise<Object>} Updated help message document
 * @throws {Error} If help message not found
 */
export async function updateHelpMessage(id, data) {
    const helpMessage = await Helpmessage.findByIdAndUpdate(id, data, { runValidators: true });
    if (!helpMessage) {
        throw new Error("Help message not found");
    }
    logDb('UPDATE', 'Helpmessage', `${id}`);
    return helpMessage;
}

/**
 * Deletes a help message by ID
 * @param {string} id - Help message ID
 * @returns {Promise<Object>} Deleted help message document
 * @throws {Error} If help message not found
 */
export async function deleteHelpMessage(id) {
    const helpMessage = await Helpmessage.findByIdAndDelete(id);
    if (!helpMessage) {
        throw new Error("Help message not found");
    }
    logDb('DELETE', 'Helpmessage', `${id}`);
    return helpMessage;
}

/**
 * Retrieves a help message by URI
 * @param {string} uri - Help message URI
 * @returns {Promise<Object>} Help message document
 * @returns {null} If no help message found for the URI
 */
export async function getHelpMessagebyUri(uri) {

    let uriParts = uri.split('/');
    if (uriParts.length > 0 && uriParts[uriParts.length - 1].length === 24) {
        uriParts[uriParts.length - 1] = ':id';
    }
    const patternUri = uriParts.join('/');

    const helpMessage = await Helpmessage.findOne({ url: patternUri, active: true });
    if (!helpMessage) {
        return {
            style: 'primary',
            HelpMessage: MESSAGES.HELP.NO_HELP_AVAILABLE,
            url: uri
        };
    }
    return helpMessage;
}
