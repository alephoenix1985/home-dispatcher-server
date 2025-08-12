import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { envConfig } from '../config/env.config.js'; // Import the central config

const subscriptionSchema = new mongoose.Schema({
    // Schema definition here
}, { timestamps: true });

subscriptionSchema.plugin(mongoosePaginate);

// Use the default paginate limit from the central config
mongoosePaginate.paginate.options = {
    limit: envConfig.app.defaultPaginateLimit,
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
