const fsPromises = require('fs').promises;
const axios = require('axios');

const Channel = require('./Channel');

const twitchInstance = axios.create({
    method: 'GET',
    baseURL: 'https://api.twitch.tv/helix/',
    headers: {
        'Client-Id': `${process.env.TWITCH_CLIENT_ID}`,
        Authorization: `${process.env.TWITCH_AUTH_BEARER_TOKEN}`,
    },
});

class Twitch {
    static async searchChannels(channelName) {
        const { data } = await twitchInstance(`/search/channels?query=${channelName}`);
        return data.data;
    }
    static async searchChannel(channelName) {
        const { data } = await twitchInstance(`/users?login=${channelName}`);
        return data.data[0];
    }
    static async getChannelFollowers(channelId) {
        const { data } = await twitchInstance(`/users/follows?to_id=${channelId}`);
        return data.total;
    }
    static async getChannelLiveData(channelId) {
        const { data } = await twitchInstance(`/streams?user_id=${channelId}`);
        return data.data[0];
    }
    static async storeChannelsData() {
        try {
            // Get channels
            const channels = await Channel.find({}, 'channel_name');

            if (channels.length === 0) return;

            // Define arrays to store data
            let channelsData = [];
            let allResponses = [];

            // Send a request to the Twitch API for each channel to get their basic data
            for (let i = 0; i < channels.length; i++) {
                allResponses.push(Twitch.searchChannel(channels[i].channel_name));
            }

            // Await all responses at once
            allResponses = await Promise.all(allResponses);

            // Loop through responses
            for (let i = 0; i < allResponses.length; i++) {
                // If response is empty it usually means that the channel name was changed or suspended
                if (!allResponses[i]) {
                    // Remove channel from the database
                    await Channel.findOneAndRemove({ _id: channels[i]._id });
                    continue;
                }
                channelsData.push({
                    id: allResponses[i].id,
                    login: allResponses[i].login,
                    display_name: allResponses[i].display_name,
                    profile_image_url: allResponses[i].profile_image_url,
                    broadcaster_type: allResponses[i].broadcaster_type,
                });
            }

            // Redefine an array to store new responses
            allResponses = [];

            // Send a request to the Twitch API for each channel to get their follower count
            for (let i = 0; i < channelsData.length; i++) {
                allResponses.push(Twitch.getChannelFollowers(channelsData[i].id));
            }

            allResponses = await Promise.all(allResponses);

            // Loop through responses and assign followers
            for (let i = 0; i < allResponses.length; i++) {
                if (!allResponses[i]) {
                    channelsData[i].followers = 0;
                } else {
                    channelsData[i].followers = allResponses[i];
                }
            }

            allResponses = [];

            // Send a request to the Twitch API for each channel to get their live data
            for (let i = 0; i < channelsData.length; i++) {
                allResponses.push(Twitch.getChannelLiveData(channelsData[i].id));
            }

            allResponses = await Promise.all(allResponses);

            // Loop through responses and assign data
            for (let i = 0; i < allResponses.length; i++) {
                // If response empty it means channel is not live
                if (!allResponses[i]) {
                    channelsData[i].is_live = false;
                } else {
                    channelsData[i].is_live = true;
                    channelsData[i].game_name = allResponses[i].game_name;
                    channelsData[i].viewer_count = allResponses[i].viewer_count;
                    channelsData[i].title = allResponses[i].title;
                }
            }

            // Save data locally
            await fsPromises.writeFile('./data/channels-data.json', JSON.stringify(channelsData));

            console.log('Channels data successfully stored!');
        } catch (e) {
            console.log(e);
            console.log('Storing channels data failed!');
        }
    }
}

module.exports = Twitch;
