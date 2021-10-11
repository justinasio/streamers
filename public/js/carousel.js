class Carousel {
    constructor(idOrClass, timer) {
        this.timer = timer;
        this.carousel = document.querySelector(`${idOrClass}`);
        this.positionClasses = ['carousel-item left', 'carousel-item center enabled', 'carousel-item right'];
    }
    listen() {
        let timer = this.setCarouselInterval();

        this.carousel.addEventListener('click', (e) => {
            clearInterval(timer);

            let [a, b, c] = this.positionClasses;

            if (e.target.parentElement.className === 'carousel-item right') this.positionClasses = [c, a, b];
            if (e.target.parentElement.className === 'carousel-item left') this.positionClasses = [b, c, a];

            this.setPositions();

            timer = this.setCarouselInterval();
        });
    }
    setPositions() {
        this.carousel.children[0].className = this.positionClasses[0];
        this.carousel.children[1].className = this.positionClasses[1];
        this.carousel.children[2].className = this.positionClasses[2];
    }
    setCarouselInterval() {
        return setInterval(() => {
            let [a, b, c] = this.positionClasses;
            this.positionClasses = [c, a, b];

            this.setPositions();
        }, this.timer);
    }
}

const carousel = new Carousel('#carousel', 5000);
carousel.listen();
