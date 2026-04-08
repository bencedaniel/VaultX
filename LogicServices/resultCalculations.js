
import {
    getSelectedEvent,
    getEntriesByEventAndCategory,
    getScoresForTimetablePart,
    getEntryWithPopulation
} from '../DataServices/resultCalculationsData.js';

/**
 * Első szintű eredményszámítás adott csoport és rész alapján.
 * @param {Object} resultGroupDoc - Az eredménycsoport dokumentum.
 * @param {string} part - Rész azonosító ('R1F', 'R1S', 'R2F').
 * @returns {Promise<{title: string, results: Array}>} Eredménycím és eredmények tömbje.
 */
export async function FirstLevel(resultGroupDoc, part) {
    // Aktuális esemény lekérdezése
    const event = await getSelectedEvent();
    // Eseményhez és kategóriához tartozó nevezések lekérdezése
    const entries = await getEntriesByEventAndCategory(event?._id, resultGroupDoc.category);
    // Megfelelő timetable part azonosító kiválasztása
    const timetablePartID = part === 'R1F' ? resultGroupDoc.round1First :
                          part === 'R1S' ? resultGroupDoc.round1Second :
                          part === 'R2F' ? resultGroupDoc.round2First : null;

    // Eredmények lekérdezése az adott részhez
    const results = await getScoresForTimetablePart(entries.map(e => e._id), timetablePartID);

    // Cím generálása a rész alapján
    const title = part === 'R1F' ? 'Round 1 - First Part Results' :
                  part === 'R1S' ? 'Round 1 - Second Part Results' :
                  part === 'R2F' ? 'Round 2 - Final Part Results' : '';

    return { title, results };
}

/**
 * Második szintű eredményszámítás (összesítés részszintek alapján).
 * @param {Object} resultGroupDoc - Az eredménycsoport dokumentum.
 * @param {string} part - Rész azonosító ('R1' vagy 'R2').
 * @returns {Promise<Object>} Eredménycím, részletek és eredmények tömbje.
 * @throws {Error} Ha a part paraméter érvénytelen.
 */
export async function SecondLevel(resultGroupDoc, part) {
    const event = await getSelectedEvent();
    const entries = await getEntriesByEventAndCategory(event?._id, resultGroupDoc.category);

    if (part === 'R1') {
        // Első és második rész eredményeinek lekérdezése párhuzamosan
        const firstPromise = FirstLevel(resultGroupDoc, 'R1F');
        const secondPromise = FirstLevel(resultGroupDoc, 'R1S');

        let firstMultiplier = resultGroupDoc.calcTemplate.round1FirstP / 100;
        let secondMultiplier = resultGroupDoc.calcTemplate.round1SecondP / 100;

        // Ha az egyik szorzó 0, csak a másik rész eredményeit vesszük figyelembe
        if (firstMultiplier === 0) {
            const second = await secondPromise;
            second.results.forEach(element => {
                element.secondTotalScore = element.TotalScore;
            });
            return {
                title: 'Round 2 - Final Results',
                sizeOfpointDetails: 2,
                results: second.results
            };
        } else if (secondMultiplier === 0) {
            const first = await firstPromise;
            first.results.forEach(element => {
                element.firstTotalScore = element.TotalScore;
            });
            return {
                title: 'Round 2 - Final Results',
                sizeOfpointDetails: 2,
                results: first.results
            };
        }

        // Szorzók arányosítása
        const allMultiplier = firstMultiplier + secondMultiplier;
        firstMultiplier = firstMultiplier / allMultiplier;
        secondMultiplier = secondMultiplier / allMultiplier;

        // Mindkét rész eredményeinek lekérdezése
        const [firstData, secondData] = await Promise.all([firstPromise, secondPromise]);
        const firstResults = firstData.results;
        const secondResults = secondData.results;

        // Nevezésekhez tartozó eredmények összekapcsolása és végső pontszám számítása
        const combinedResultsPromises = entries.map(async (entry) => {
            const firstResult = firstResults.find(r => r.entry._id.toString() === entry._id.toString());
            const secondResult = secondResults.find(r => r.entry._id.toString() === entry._id.toString());

            if (!firstResult || !secondResult) return null;

            const entryData = await getEntryWithPopulation(entry._id);
            return {
                entry: entryData,
                firstTotalScore: firstResult.TotalScore,
                secondTotalScore: secondResult.TotalScore,
                TotalScore: ((firstResult.TotalScore * firstMultiplier) + (secondResult.TotalScore * secondMultiplier)),
            };
        });

        const combinedResults = (await Promise.all(combinedResultsPromises)).filter(Boolean);
        combinedResults.sort((a, b) => b.TotalScore - a.TotalScore);
        
        return {
            title: 'Round 1 - Final Results',
            results: combinedResults
        };
    } else if (part === 'R2') {
        // Második kör eredményeinek lekérdezése
        const first = await FirstLevel(resultGroupDoc, 'R2F');
        first.results.forEach(element => {
            element.firstTotalScore = element.TotalScore;
        });

        return {
            title: 'Round 2 - Final Results',
            sizeOfpointDetails: 2,
            results: first.results
        };
    }

    throw new Error('Invalid part for SecondLevel calculation');
}

/**
 * Végső szintű eredményszámítás (összesítés minden kör alapján).
 * @param {Object} resultGroupDoc - Az eredménycsoport dokumentum.
 * @returns {Promise<{results: Array}>} Végső eredmények tömbje.
 */
export async function TotalLevel(resultGroupDoc) {
    const event = await getSelectedEvent();
    const entries = await getEntriesByEventAndCategory(event?._id, resultGroupDoc.category);
    
    // Mindkét szint eredményeinek lekérdezése párhuzamosan
    const [round1, round2] = await Promise.all([
        SecondLevel(resultGroupDoc, 'R1'),
        SecondLevel(resultGroupDoc, 'R2')
    ]);

    let round1FirstMultiplier = resultGroupDoc.calcTemplate.round1FirstP / 100;
    let round1SecondMultiplier = resultGroupDoc.calcTemplate.round1SecondP / 100;
    let round1Multiplier = round1FirstMultiplier + round1SecondMultiplier;
    let round2Multiplier = resultGroupDoc.calcTemplate.round2FirstP / 100;

    // Ha az egyik szint szorzója 0, csak a másik szint eredményeit vesszük figyelembe
    if (round1Multiplier === 0) {
        round2.results.forEach(element => {
            element.round2TotalScore = element.TotalScore;
        });
        return { results: round2.results };
    } else if (round2Multiplier === 0) {
        round1.results.forEach(element => {
            element.round1TotalScore = element.TotalScore;
        });
        return { results: round1.results };
    }

    const round1Results = round1.results;
    const round2Results = round2.results;

    // Nevezésekhez tartozó eredmények összekapcsolása és végső pontszám számítása
    const combinedResultsPromises = entries.map(async (entry) => {
        const round1Result = round1Results.find(r => r.entry._id.toString() === entry._id.toString());
        const round2Result = round2Results.find(r => r.entry._id.toString() === entry._id.toString());

        if (!round1Result || !round2Result) return null;

        const entryData = await getEntryWithPopulation(entry._id);
        return {
            entry: entryData,
            round1TotalScore: round1Result.TotalScore,
            round2TotalScore: round2Result.TotalScore,
            TotalScore: ((round1Result.TotalScore * round1Multiplier) + (round2Result.TotalScore * round2Multiplier)),
        };
    });

    const combinedResults = (await Promise.all(combinedResultsPromises)).filter(Boolean);
    combinedResults.sort((a, b) => b.TotalScore - a.TotalScore);
    
    return { results: combinedResults };
}
