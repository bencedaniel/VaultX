import mongoose from 'mongoose';

const resultGeneratorSchema = new mongoose.Schema({
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'categorys',
        required: [true, 'Category required!'],
        unique: [true, 'A result generator for this category already exists!'],
    },
    calcSchemaTemplate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'calculationtemplates',
        required: [true, 'Calculation template required!'],
    },
    active: {
        type: Boolean,
        default: true,
        required: [true, 'Active status required!'],
    }
},{ timestamps: true });

export default mongoose.model('resultgenerator', resultGeneratorSchema);
