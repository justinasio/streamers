const iframeStream = document.querySelector('#iframeStream');

const buttonListView = document.querySelector('#buttonListView');
const buttonLiveView = document.querySelector('#buttonLiveView');

const inputSearchChannel = document.querySelector('#inputSearchChannel');
const buttonShowPartners = document.querySelector('#buttonShowPartners');
const buttonSortViewers = document.querySelector('#buttonSortViewers');

const sectionContent = document.querySelector('#sectionContent');
const onlineChannelsList = document.querySelector('#onlineChannelsList');

// Buttons - for changing views
buttonListView.addEventListener('click', (e) => {
    // If button is already active then return
    if (buttonListView.classList.contains('active')) return;

    buttonListView.classList.add('active');
    buttonLiveView.classList.remove('active');

    // Remove live view
    sectionContent.classList.remove('show-channel-live-view');
    // Hide iframe stream
    hideIframeStream();
});
buttonLiveView.addEventListener('click', (e) => {
    // If button is already active then return
    if (buttonLiveView.classList.contains('active')) return;

    buttonLiveView.classList.add('active');
    buttonListView.classList.remove('active');

    // Show content in live view
    sectionContent.classList.add('show-channel-live-view');
    // Enable iframe stream
    showIframeStream(iframeStream.getAttribute('data-default-channel-name'));

    // Remove previous selected channel class
    for (let i = 0; i < onlineChannelsList.children.length; i++) {
        onlineChannelsList.children[i].children[0].classList.remove('active');
    }

    // Select first channel and give it a class active
    onlineChannelsList.children[0].children[0].classList.add('active');
});
// When clicked on a channel show their stream "iframe"
onlineChannelsList.addEventListener('click', (e) => {
    // If channel is already 'active' then return;
    if (e.target.classList.contains('active')) return;

    // Get channel name
    const channelName = e.target.parentElement.getAttribute('data-channel-name');
    if (!channelName) return;

    // Remove any 'active' class from all elements
    for (let i = 0; i < onlineChannelsList.children.length; i++) {
        onlineChannelsList.children[i].children[0].classList.remove('active');
    }

    // Give it a class of 'active'
    e.target.classList.add('active');
    // Show iframe with that channels name
    showIframeStream(channelName);
});

// Button - to show only partnered streamers
buttonShowPartners.addEventListener('click', () => {
    buttonShowPartners.classList.toggle('enabled');

    for (let i = 0; i < onlineChannelsList.children.length; i++) {
        if (!onlineChannelsList.children[i].children[3].children[0].children[1]) {
            onlineChannelsList.children[i].classList.toggle('hidden');
        }
    }
});
// Button - to sort channels by their viewer count
buttonSortViewers.addEventListener('click', () => {
    buttonSortViewers.classList.toggle('enabled');
    onlineChannelsList.classList.toggle('reverse');
});
// Input - for displaying certain channels
inputSearchChannel.addEventListener('keyup', () => {
    let inputValue = inputSearchChannel.value.toLowerCase();

    let hiddenElementsCount = 0;

    // If the last element in sectionContent has a class name of 'no-channels-overlay' remove it
    if (sectionContent.children[sectionContent.children.length - 1].className === 'no-channels-overlay') {
        sectionContent.removeChild(sectionContent.lastChild);
    }

    // Loop through children and hide or show elements depending on a value provided
    for (let i = 0; i < onlineChannelsList.children.length; i++) {
        let index = onlineChannelsList.children[i].getAttribute('data-channel-name').indexOf(inputValue);

        if (index >= 0) {
            onlineChannelsList.children[i].classList.remove('hide');
        } else {
            hiddenElementsCount++;
            onlineChannelsList.children[i].classList.add('hide');
        }
    }

    // If every element is hidden then display and overlay
    if (hiddenElementsCount === onlineChannelsList.children.length) {
        createAndInsertOverlayElement(sectionContent, '¯\\_(ツ)_/¯', `We can't find the channel name`);
    }
});
// Input - change class depending on criteria
inputSearchChannel.addEventListener('focus', () => {
    inputSearchChannel.parentElement.classList.add('enabled');
});
inputSearchChannel.addEventListener('blur', () => {
    if (inputSearchChannel.value.length > 0) return;

    inputSearchChannel.parentElement.classList.remove('enabled');
});

function showIframeStream(channelName) {
    const host = iframeStream.getAttribute('data-host');

    iframeStream.setAttribute('data-channel-name', channelName);
    iframeStream.src = `https://embed.twitch.tv?autoplay=false&channel=${channelName}&height=100%25&layout=video&parent=${host}`;
}
function hideIframeStream() {
    iframeStream.src = '';
}

function createAndInsertOverlayElement(where, emoji, message) {
    const noChannelsOverlayDiv = document.createElement('div');
    const h1 = document.createElement('h1');
    const p = document.createElement('p');

    noChannelsOverlayDiv.className = 'no-channels-overlay';
    h1.textContent = emoji;
    p.textContent = message;

    noChannelsOverlayDiv.appendChild(h1);
    noChannelsOverlayDiv.appendChild(p);

    where.appendChild(noChannelsOverlayDiv);
}
