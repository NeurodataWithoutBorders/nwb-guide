import lottie from "lottie-web";

import checkChromatic from "chromatic/isChromatic";
export const isChromatic = checkChromatic();

export const startLottie = (lottieElement: HTMLElement, animationData: any) => {
    lottieElement.innerHTML = "";
    const thisLottie = lottie.loadAnimation({
        container: lottieElement,
        animationData,
        renderer: "svg",
        loop: !isChromatic,
        autoplay: !isChromatic,
    });

    if (isChromatic) thisLottie.goToAndStop(thisLottie.getDuration(true) - 1, true); // Go to last frame

    return thisLottie;
};
