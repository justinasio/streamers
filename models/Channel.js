const mongoose = require('mongoose');

const channelSchema = mongoose.Schema({
    channel_name: {
        type: String,
        required: true,
    },
    date_added: {
        type: Date,
        required: true,
    },
});

module.exports = mongoose.model('Channel', channelSchema);
