import mongoose from "mongoose";

function roundToDecimals(value, decimals = 3) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return NaN;
    const multiplier = Math.pow(10, decimals);
    return Number((Math.round((numericValue * multiplier) + Number.EPSILON) / multiplier).toFixed(decimals));
}

const ScoreSheetSchema = new mongoose.Schema(
    {
        EventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "events",
            required: [true, "Event ID required!"],
        },
        EntryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "entries",
            required: [true, "Entry ID required!"],
        },
        TemplateId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "scoresheets_temp",
            required: [true, "Template ID required!"],
        },
        TimetablePartId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "timetableparts",
            required: [true, "Timetable Part ID required!"],
        },

        Judge: {
            userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, "Judge info required!"],
            refPath: "users" // dinamikus collection
            },
            table: {
            type: String,
            required: true
            }
        }
        ,

        inputDatas: {
            type: [{id:String, value: String}],
            default: [],
            required: [true, "Input data required!"],
        },
        totalScoreFE: {
            type: Number,
            required: [true, "Total score required!"],
        },
        totalScoreBE: {
            type: Number,
            required: [true, "Total score required!"],
        }
        
  }, { timestamps: true }
);

ScoreSheetSchema.index(
  { EventId: 1, EntryId: 1, TemplateId: 1 , TimetablePartId: 1, 'Judge.table': 1 },
  { unique: true }
);
ScoreSheetSchema.pre('save', function(next) {
    const normalizedFE = roundToDecimals(this.totalScoreFE, 3);
    const normalizedBE = roundToDecimals(this.totalScoreBE, 3);

    if (!Number.isFinite(normalizedFE) || !Number.isFinite(normalizedBE)) {
        throw new Error('Invalid total score value' + ` (FE: ${this.totalScoreFE}, BE: ${this.totalScoreBE})`);
    }

    this.totalScoreFE = normalizedFE;
    this.totalScoreBE = normalizedBE;

    if(normalizedBE !== normalizedFE){
        throw new Error('Total score mismatch between front-end and back-end values' + ` (FE: ${normalizedFE}, BE: ${normalizedBE})`);
    }

    next();
});
export default mongoose.model("scoresheets", ScoreSheetSchema);