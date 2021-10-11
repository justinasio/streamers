const inputUsername = document.querySelector('#inputUsername');
const inputPassword = document.querySelector('#inputPassword');
const buttonLogin = document.querySelector('#buttonLogin');
const formAuth = document.querySelector('#formAuth');

const paragraphUsername = document.querySelector('#paragraphUsername');
const paragraphPassword = document.querySelector('#paragraphPassword');
const paragraphButton = document.querySelector('#paragraphButton');

const regEx = /^[a-z0-9]+$/i;

let showErrorsTimeout = null;
let timeout = 450;

formAuth.addEventListener('keyup', () => {
    validateInputs();
});
formAuth.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Disable button to prevent spam
    buttonLogin.disabled = true;

    // Make a request
    const response = await fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: inputUsername.value,
            password: inputPassword.value,
        }),
    });
    const data = await response.json();

    // Validate response
    if (data === undefined || data.length === 0) {
        return showErrorMessage(paragraphButton, 'Something went wrong');
    }
    if (data.status === 500) {
        return showErrorMessage(paragraphButton, data.message);
    }
    if (data.status === 400 || data.status === 403 || data.status === 404 || data.status === 409) {
        if (data.input === 'username') return showErrorMessage(paragraphUsername, data.message);
        if (data.input === 'password') return showErrorMessage(paragraphPassword, data.message);
    }
    // Redirect to dashboard if successfully logged in
    if (data.status === 200) {
        window.location.replace('/dashboard');
    }
});

function validateInputs() {
    // Clear previous timeout
    clearTimeout(showErrorsTimeout);

    // Hide previous error messages if there was any
    hideErrorMessage(paragraphUsername);
    hideErrorMessage(paragraphPassword);
    hideErrorMessage(paragraphButton);

    // Disable button while validating inputs
    buttonLogin.disabled = true;

    const inputErrors = [];
    const createInputError = (input, message) => {
        inputErrors.push({ input: input, message: message });
    };

    if (inputUsername.value.length === 0 && inputPassword.value.length === 0) return;

    // Validate username input
    if (inputUsername.value.length !== 0) {
        // Validate length
        if (inputUsername.value.length < 3 || inputUsername.value.length > 25) {
            createInputError('username', 'Username should be 3-25 characters long');
        }
        // Validate value
        else if (!regEx.test(inputUsername.value)) {
            createInputError('username', 'Username should contain alphanumeric characters');
        }
    }
    // Validate password input
    if (inputPassword.value.length !== 0) {
        // Validate length
        if (inputPassword.value.length < 6 || inputPassword.value.length > 25) {
            createInputError('password', 'Password should be 6-25 characters long');
        }
    }
    // If there is validation errors loop through them and return
    if (inputErrors.length !== 0) {
        // Set a timeout for when error messages will appear
        showErrorsTimeout = setTimeout(() => {
            for (let i = 0; i < inputErrors.length; i++) {
                if (inputErrors[i].input === 'username') showErrorMessage(paragraphUsername, inputErrors[i].message);
                if (inputErrors[i].input === 'password') showErrorMessage(paragraphPassword, inputErrors[i].message);
            }
        }, timeout);
        return;
    }
    // If it passed validation without errors enable button
    if (inputUsername.value.length !== 0 && inputPassword.value.length !== 0) {
        buttonLogin.disabled = false;
    }
}

function showErrorMessage(where, message) {
    where.classList.remove('hide');
    where.textContent = message;
}
function hideErrorMessage(where) {
    where.classList.add('hide');
    where.textContent = '';
}
