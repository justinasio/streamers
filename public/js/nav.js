const formHamburgerMenu = document.querySelector('#formHamburgerMenu');
const nav = document.querySelector('#nav');

formHamburgerMenu.addEventListener('submit', (e) => {
    e.preventDefault();

    nav.classList.toggle('open');
});
nav.addEventListener('click', (e) => {
    if (e.target.id === 'nav') return nav.classList.toggle('open');
    if (e.target.classList.contains('item-link')) return nav.classList.toggle('open');
});
