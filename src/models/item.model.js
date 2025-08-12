// src/models/item.model.js
import mongoose from 'mongoose';

/**
 * @fileoverview Defines the Mongoose schema and model for an 'Item'.
 * This represents the structure of the documents stored in the MongoDB collection.
 */

const ItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        required: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Item = mongoose.model('Item', ItemSchema);
export default Item;