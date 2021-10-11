const partneredChannelsList = document.querySelector('#partneredChannelsList');
const buttonPartneredChannels = document.querySelector('#buttonPartneredChannels');

buttonPartneredChannels.addEventListener('click', (e) => {
    if (buttonPartneredChannels.textContent === 'Show More') {
        for (let i = 12; i < partneredChannelsList.children.length - 1; i++) {
            partneredChannelsList.children[i].classList.remove('hide');
        }
        return (buttonPartneredChannels.textContent = 'Show Less');
    }
    if (buttonPartneredChannels.textContent === 'Show Less') {
        for (let i = 12; i < partneredChannelsList.children.length - 1; i++) {
            partneredChannelsList.children[i].classList.add('hide');
        }
        return (buttonPartneredChannels.textContent = 'Show More');
    }
});
