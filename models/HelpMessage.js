import mongoose from "mongoose";

const HelpMessage = new mongoose.Schema(
    {
        url: {
            type: String,
            required: [true, 'URL required!'],
        },
        HelpMessage: {
            type: String,
            required: [true, 'Help message description required!'],
        }, 
        active: {
            type: Boolean,
            default: true,
            required: [true, 'Active status required']
        },
        style:{
            type: String,
            default: 'danger',
        }

       
    },
    { timestamps: true }
);

export default mongoose.model('helpmessages', HelpMessage);
