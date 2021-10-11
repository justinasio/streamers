const inputSearch = document.querySelector('#inputSearch');
const inputRemove = document.querySelector('#inputRemove');

const searchResults = document.querySelector('#searchResults');
const removeResults = document.querySelector('#removeResults');

const regEx = /^\w+$/;
const timeout = 500;
let searchChannelTimeout = null;

// inputSearch - Search
inputSearch.addEventListener('keyup', () => {
    // Clear previous delayed request
    clearTimeout(searchChannelTimeout);

    // If input is empty then return and show overlay
    if (inputSearch.value.length === 0) {
        return createAndInsertOverlayElement(searchResults, '(⊙_⊙)', 'Search to add channel', true);
    }

    // While typing show overlay
    createAndInsertOverlayElement(searchResults, '(＠_＠)', 'Searching...', true);

    // Create delayed request to a server
    searchChannelTimeout = setTimeout(async () => {
        // Validate inputs
        if (inputSearch.value.length < 3 || inputSearch.value.length > 25) {
            return createAndInsertOverlayElement(searchResults, '(◉_◉)', 'Channel name should be 3-25 characters long', true);
        }
        if (!regEx.test(inputSearch.value)) {
            return createAndInsertOverlayElement(searchResults, '╮(╯-╰)╭', 'Channel name should only contain alphanumeric characters', true);
        }

        // Make a request
        const data = await makeRequestToTheServer('/search-channel', { channel_name: inputSearch.value.toLowerCase() });

        // Validate received data
        if (!data) return createAndInsertOverlayElement(searchResults, 'x_x', 'Something went wrong', true);
        if (data.status !== 200) return createAndInsertOverlayElement(searchResults, '¯\\_(ツ)_/¯', `${data.message}`, true);

        // Loop through data and create channel elements
        let fragment = new DocumentFragment();

        for (let i = 0; i < data.data.length; i++) {
            const channelDiv = document.createElement('div');
            const channelImageDiv = document.createElement('div');
            const channelContentDiv = document.createElement('div');
            const channelFormButtonForm = document.createElement('form');
            const img = document.createElement('img');
            const h5 = document.createElement('h5');
            const button = document.createElement('button');

            channelDiv.className = 'channel';
            channelDiv.setAttribute('data-channel-name', data.data[i].broadcaster_login);

            channelImageDiv.className = 'channel-image';
            channelContentDiv.className = 'channel-content';
            channelFormButtonForm.className = 'channel-form-button';

            img.src = data.data[i].thumbnail_url;
            img.alt = 'channel image';
            h5.textContent = data.data[i].display_name;
            button.textContent = 'Add';

            channelImageDiv.appendChild(img);
            channelContentDiv.appendChild(h5);
            channelFormButtonForm.appendChild(button);

            channelDiv.append(channelImageDiv, channelContentDiv, channelFormButtonForm);

            fragment.appendChild(channelDiv);
        }
        // Remove previous displayed overlay
        searchResults.removeChild(searchResults.firstChild);
        // Append elements
        searchResults.appendChild(fragment);
    }, timeout);
});
// inputSearch - Add class when focused
inputSearch.addEventListener('focus', () => {
    inputSearch.parentElement.classList.add('enabled');
});
// inputSearch - Remove class when away from input and value length is 0
inputSearch.addEventListener('blur', () => {
    if (inputSearch.value.length > 0) return;
    inputSearch.parentElement.classList.remove('enabled');
});

// inputRemove - Search
inputRemove.addEventListener('keyup', () => {
    const value = inputRemove.value.toLowerCase();

    let hiddenElementsCount = 0;

    // If there is just one element that has 'results-overlay' class name then return
    if (removeResults.children.length === 1) {
        if (removeResults.children[removeResults.children.length - 1].className === 'results-overlay') return;
    }
    // If the last element in removeResults has a class name of 'results-overlay' then remove it
    if (removeResults.children[removeResults.children.length - 1].className === 'results-overlay') {
        removeResults.removeChild(removeResults.lastChild);
    }

    // Loop through elements and hide or show channels depending on a value provided
    for (let i = 0; i < removeResults.children.length; i++) {
        if (removeResults.children[i].getAttribute('data-channel-name').indexOf(value) >= 0) {
            removeResults.children[i].classList.remove('hide');
        } else {
            hiddenElementsCount++;
            removeResults.children[i].classList.add('hide');
        }
    }

    // If the number of hidden elements matches the number of elements in 'removeResults'
    if (hiddenElementsCount === removeResults.children.length) {
        createAndInsertOverlayElement(removeResults, '¯\\_(ツ)_/¯', `We can't find the channel name`);
    }
});
// inputRemove - Add class when focused
inputRemove.addEventListener('focus', () => {
    inputRemove.parentElement.classList.add('enabled');
});
// inputRemove - Remove class when away from input and value length is 0
inputRemove.addEventListener('blur', () => {
    if (inputRemove.value.length > 0) return;
    inputRemove.parentElement.classList.remove('enabled');
});

// searchResults - Add channel
searchResults.addEventListener('submit', async (e) => {
    e.preventDefault();

    const button = e.target.children[0];
    const channelName = e.target.parentElement.getAttribute('data-channel-name');

    button.disabled = true;

    // Make request to a server
    const data = await makeRequestToTheServer('/add-channel', { channel_name: channelName });

    // Validate
    if (data.status === 409) {
        button.classList.add('warning');
        button.textContent = 'Already added';
        return;
    }
    if (data.status === 401) {
        button.classList.add('wrong');
        button.textContent = 'No permissions';
        return;
    }
    if (data.length === 0 || data.status !== 201) {
        button.classList.add('wrong');
        button.textContent = 'Error';
        return;
    }

    button.textContent = 'Remove';
    button.disabled = false;

    // If removeResults has no channels to remove then remove overlay
    if (removeResults.children[0].className === 'results-overlay') {
        removeResults.removeChild(removeResults.children[0]);
    }

    removeResults.insertBefore(e.target.parentElement, removeResults.firstChild);
});
// removeResults - Remove channel
removeResults.addEventListener('submit', async (e) => {
    e.preventDefault();

    const button = e.target.children[0];
    const channelName = e.target.parentElement.getAttribute('data-channel-name');

    button.disabled = true;

    // Make request to a server
    const data = await makeRequestToTheServer('/remove-channel', { channel_name: channelName });

    // Validate
    if (data.status === 401) {
        button.classList.add('wrong');
        button.textContent = 'No permissions';
        return;
    }
    if (data.length === 0 || data.status !== 200) {
        button.classList.add('wrong');
        button.textContent = 'Error';
        return;
    }

    // Remove it from the removeResults
    e.target.parentElement.remove();

    // Display overlay if removeResults is empty
    if (removeResults.childElementCount === 0) {
        createAndInsertOverlayElement(removeResults, '(⊙_⊙)', 'No channels to remove');
    }
});

async function makeRequestToTheServer(route, body) {
    const response = await fetch(route, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    return await response.json();
}

function createAndInsertOverlayElement(where, emoji, message, removeElements) {
    const resultsOverlayDiv = document.createElement('div');
    const h1 = document.createElement('h1');
    const p = document.createElement('p');

    resultsOverlayDiv.className = 'results-overlay';
    h1.textContent = emoji;
    p.textContent = message;

    resultsOverlayDiv.appendChild(h1);
    resultsOverlayDiv.appendChild(p);

    if (removeElements) {
        while (where.firstChild) {
            where.removeChild(where.firstChild);
        }
    }

    where.appendChild(resultsOverlayDiv);
}
