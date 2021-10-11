const offlineChannelsList = document.querySelector('#offlineChannelsList');
const buttonOfflineChannels = document.querySelector('#buttonOfflineChannels');

buttonOfflineChannels.addEventListener('click', (e) => {
    if (buttonOfflineChannels.textContent === 'Show More') {
        for (let i = 12; i < offlineChannelsList.children.length - 1; i++) {
            offlineChannelsList.children[i].classList.remove('hide');
        }
        return (buttonOfflineChannels.textContent = 'Show Less');
    }
    if (buttonOfflineChannels.textContent === 'Show Less') {
        for (let i = 12; i < offlineChannelsList.children.length - 1; i++) {
            offlineChannelsList.children[i].classList.add('hide');
        }
        return (buttonOfflineChannels.textContent = 'Show More');
    }
});
