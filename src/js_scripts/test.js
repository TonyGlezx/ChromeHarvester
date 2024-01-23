function scrollDown(times, delay) {
    let count = 0;
    let interval = setInterval(() => {
        window.scrollBy(0, 10); // Scroll 10 pixels down
        count++;
        if (count >= times) {
            clearInterval(interval);
        }
    }, delay);
}

// Scroll down 100 times, with a delay of 100 milliseconds between each scroll
scrollDown(10000, 100);
