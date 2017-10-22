const mongoose = require('mongoose');

var stockSchema = mongoose.Schema({
        ticker: {
            type: String,
            required: true
        },
        created_at: {
            type: Date,
            required: true,
            default: Date.now
        },
        updated_at: {
            type: Date,
            required: true,
            default: Date.now
        },
        open: [{
            type: Number
        }],
        close: [{
            type: Number
        }],
        date: [{
            type: Date
        }],
        high: [{
            type: Number
        }],
        low: [{
            type: Number
        }]
});

module.exports = mongoose.model('Stock', stockSchema);
