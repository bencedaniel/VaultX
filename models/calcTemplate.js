import mongoose from 'mongoose';

const calcSchema = new mongoose.Schema({

    round1FirstP: {
            type: Number,
            required: [true, 'Test 1 percentage required!'],
    },
    round1SecondP: {
            type: Number,
            required: [true, 'Test 2  percentage required!'],
    },
    round2FirstP: {
            type: Number,
            required: [true, 'Final percentage required!'],
    }
},{ timestamps: true });

export default mongoose.model('calculationtemplates', calcSchema);
