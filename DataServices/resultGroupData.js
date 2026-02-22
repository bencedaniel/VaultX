import resultGroup from '../models/resultGroup.js';
import resultGenerator from '../models/resultGenerator.js';
import Category from '../models/Category.js';
import calcTemplate from '../models/calcTemplate.js';
import DailyTimeTable from '../models/DailyTimeTable.js';
import TimetablePart from '../models/Timetablepart.js';
import { logDb, logDebug } from '../logger.js';

const normalizeID = (value) => {
    if (value === '' || value === null || value === undefined) {
        return null;
    }
    return String(value);
};

/**
 * Get all result groups for a specific event with full population
 */
export const getResultGroupsByEvent = async (eventId) => {
    const groups = await resultGroup.find({ event: eventId })
        .populate('event')
        .populate('category')
        .populate('calcTemplate')
        .populate({
            path: 'round1First',
            populate: { path: 'dailytimetable' }
        })
        .populate({
            path: 'round1Second',
            populate: { path: 'dailytimetable' }
        })
        .populate({
            path: 'round2First',
            populate: { path: 'dailytimetable' }
        });
    
    groups.sort((a, b) => b.category.Star - a.category.Star);
    return groups;
};

/**
 * Get result groups for results display (simpler population)
 */
export const getResultGroupsForResults = async (eventId) => {
    const groups = await resultGroup.find({ event: eventId })
        .populate('category')
        .populate('calcTemplate')
        .populate({
            path: 'round1First',
            populate: { path: 'dailytimetable' }
        })
        .populate({
            path: 'round1Second',
            populate: { path: 'dailytimetable' }
        })
        .populate({
            path: 'round2First',
            populate: { path: 'dailytimetable' }
        });
    
    groups.sort((a, b) => b.category.Star - a.category.Star);
    return groups;
};

/**
 * Get single result group by ID
 */
export const getResultGroupById = async (id) => {
    return await resultGroup.findById(id);
};

/**
 * Get result group with full details for detailed results display
 */
export const getResultGroupWithDetails = async (id) => {
    return await resultGroup.findById(id)
        .populate('category')
        .populate('calcTemplate')
        .populate('round1First')
        .populate('round1Second')
        .populate('round2First');
};

/**
 * Get form data for result group creation/editing
 */
export const getGroupFormData = async (eventId) => {
    const categories = await Category.find();
    const calcTemplates = await calcTemplate.find();
    const dailyTimetables = await DailyTimeTable.find({ event: eventId }).select('_id');
    
    const timetableParts = await TimetablePart.find({ 
        dailytimetable: { $in: dailyTimetables.map(dt => dt._id) } 
    }).populate('dailytimetable');
    
    const timetablePartsRound1 = await TimetablePart.find({ 
        dailytimetable: { $in: dailyTimetables.map(dt => dt._id) }, 
        Round: '1' 
    }).populate('dailytimetable');
    
    const timetablePartsRound2 = await TimetablePart.find({ 
        dailytimetable: { $in: dailyTimetables.map(dt => dt._id) }, 
        Round: '2 - Final' 
    }).populate('dailytimetable');

    return {
        categories,
        calcTemplates,
        timetableParts,
        timetablePartsRound1,
        timetablePartsRound2
    };
};

/**
 * Update result group
 */
export const updateResultGroup = async (id, data) => {
    const round1First = normalizeID(data.round1First);
    const round1Second = normalizeID(data.round1Second);
    const round2First = normalizeID(data.round2First);

    // Validate timetable parts are not the same (ignore empty values)
    if ((round1First && round1Second && round1First === round1Second) || 
        (round1First && round2First && round1First === round2First) || 
        (round1Second && round2First && round1Second === round2First)) {
        throw new Error("The same timetable part cannot be selected for multiple rounds.");
    }

    data.round1First = round1First;
    data.round1Second = round1Second;
    data.round2First = round2First;

    const updated = await resultGroup.findByIdAndUpdate(id, data, { new: true });
    logDb('UPDATE', 'ResultGroup', `${id}`);
    return updated;
};

/**
 * Create new result group
 */
export const createResultGroup = async (eventId, data) => {
    const round1First = normalizeID(data.round1First);
    const round1Second = normalizeID(data.round1Second);
    const round2First = normalizeID(data.round2First);

    // Validate timetable parts are not the same (ignore empty values)
    if ((round1First && round1Second && round1First === round1Second) || 
        (round1First && round2First && round1First === round2First) || 
        (round1Second && round2First && round1Second === round2First)) {
        throw new Error("The same timetable part cannot be selected for multiple rounds.");
    }

    data.round1First = round1First;
    data.round1Second = round1Second;
    data.round2First = round2First;

    data.event = eventId;

    const newGroup = new resultGroup(data);
    await newGroup.save();
    logDb('CREATE', 'ResultGroup', `${newGroup._id}`);
    return newGroup;
};

/**
 * Delete result group by ID
 */
export const deleteResultGroup = async (id) => {
    await resultGroup.findByIdAndDelete(id);
    logDb('DELETE', 'ResultGroup', `${id}`);
};

/**
 * Generate result groups from active generators
 */
export const generateGroupsForActiveGenerators = async (eventId, username) => {
    const activeGenerators = await resultGenerator.find({ active: true });
    
    for (const generator of activeGenerators) {
        const groupExists = await resultGroup.findOne({ 
            event: eventId, 
            category: generator.category 
        });
        
        if (groupExists) {
            continue; // Skip if group already exists
        }
        
        const newResultGroup = new resultGroup({
            event: eventId,
            category: generator.category,
            calcTemplate: generator.calcSchemaTemplate,
        });
        
        await newResultGroup.save();
        logDb('CREATE', 'ResultGroup', `${newResultGroup._id}`);
    }
};
