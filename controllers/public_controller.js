const fsPromises = require('fs').promises;

exports.get_index = async (req, res, next) => {
    let channelsData = JSON.parse(await fsPromises.readFile('./data/channels-data.json'));

    // Sort & Filter channelsData
    channelsData = channelsData.sort((a, b) => {
        return b.followers - a.followers;
    });

    let onlineChannels = [];
    let offlineChannels = [];
    let partneredChannels = [];

    for (let i = 0; i < channelsData.length; i++) {
        if (channelsData[i].is_live) {
            onlineChannels.push(channelsData[i]);
        } else {
            offlineChannels.push(channelsData[i]);
        }
        if (channelsData[i].broadcaster_type === 'partner') {
            partneredChannels.push(channelsData[i]);
        }
    }

    // Sort online channels by their viewer count
    onlineChannels = onlineChannels.sort((a, b) => {
        return b.viewer_count - a.viewer_count;
    });

    res.render('public/index', {
        page_title: 'Home',
        channels_data: {
            online_channels: onlineChannels,
            offline_channels: offlineChannels,
            partnered_channels: partneredChannels,
            most_followed_channels: channelsData,
        },
    });
};
