import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { envConfig } from '../config/env.config.js'; // Import the central config

const profileSchema = new mongoose.Schema({
    // Schema definition here
}, { timestamps: true });

profileSchema.plugin(mongoosePaginate);

// Use the default paginate limit from the central config
mongoosePaginate.paginate.options = {
    limit: envConfig.app.defaultPaginateLimit,
};

const Profile = mongoose.model('Profile', profileSchema);

export default Profile;
