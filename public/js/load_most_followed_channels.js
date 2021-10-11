const mostFollowedChannelsList = document.querySelector('#mostFollowedChannelsList');
const buttonMostFollowedChannels = document.querySelector('#buttonMostFollowedChannels');

buttonMostFollowedChannels.addEventListener('click', (e) => {
    if (buttonMostFollowedChannels.textContent === 'Show More') {
        for (let i = 12; i < mostFollowedChannelsList.children.length - 1; i++) {
            mostFollowedChannelsList.children[i].classList.remove('hide');
        }
        return (buttonMostFollowedChannels.textContent = 'Show Less');
    }
    if (buttonMostFollowedChannels.textContent === 'Show Less') {
        for (let i = 12; i < mostFollowedChannelsList.children.length - 1; i++) {
            mostFollowedChannelsList.children[i].classList.add('hide');
        }
        return (buttonMostFollowedChannels.textContent = 'Show More');
    }
});
