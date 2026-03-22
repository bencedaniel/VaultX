import mongoose from 'mongoose';


const RoleSchema = new mongoose.Schema({
        roleName:{
            type: String,
            required: [true, 'Role name required!'],
            unique: true,
        },
        permissions:{
            type: [String],
            required: [true, 'Permissions required!'],
        },
        description:{
            type: String,
            default: '',
            required: [true, 'Description required!'],
        }
},{ timestamps: true });

export default mongoose.model('roles', RoleSchema);
