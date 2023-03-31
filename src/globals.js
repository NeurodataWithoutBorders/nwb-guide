
import { app, path, port } from './electron/index.js'
import { Notyf } from 'notyf'
import checkChromatic from 'chromatic/isChromatic';

import lottie from 'lottie-web'

export const joinPath = (...args) => path?.join(...args);

// Base Request URL for Python Server
export const baseUrl = `http://127.0.0.1:${port}`



// Filesystem Management
export const homeDirectory = app?.getPath("home") ?? '';
export const progressFilePath = joinPath(homeDirectory, "NWB GUIDE", "Progress");
export const guidedProgressFilePath = joinPath(homeDirectory, "NWB GUIDE", "Guided-Progress");

export const isStorybook = window.location.href.includes('iframe.html')

// ---------- Lottie Helper ----------
const isChromatic = checkChromatic()

export const startLottie = (lottieElement, animationData) => {
  lottieElement.innerHTML = "";
  const thisLottie = lottie.loadAnimation({
    container: lottieElement,
    animationData,
    renderer: "svg",
    loop: !isChromatic,
    autoplay: !isChromatic,
  });

  if (isChromatic) thisLottie.goToAndStop(thisLottie.getDuration(true) - 1, true) // Go to last frame

  return thisLottie
}

// ---------- Notification Helper ----------
export const notyf = new Notyf({
  position: { x: "right", y: "bottom" },
  dismissible: true,
  ripple: false,
  types: [
    {
      type: "checking_server_is_live",
      background: "grey",
      icon: {
        className: "fas fa-wifi",
        tagName: "i",
        color: "white",
      },
      duration: 1000,
    },
    {
      type: "checking_server_api_version",
      background: "grey",
      icon: {
        className: "fas fa-wifi",
        tagName: "i",
        color: "white",
      },
      duration: 1000,
    },
    {
      type: "loading_internet",
      background: "grey",
      icon: {
        className: "fas fa-wifi",
        tagName: "i",
        color: "white",
      },
      duration: 10000,
    },
    {
      type: "ps_agent",
      background: "grey",
      icon: {
        className: "fas fa-cogs",
        tagName: "i",
        color: "white",
      },
      duration: 5000,
    },
    {
      type: "app_update",
      background: "grey",
      icon: {
        className: "fas fa-sync-alt",
        tagName: "i",
        color: "white",
      },
      duration: 0,
    },
    {
      type: "api_key_search",
      background: "grey",
      icon: {
        className: "fas fa-users-cog",
        tagName: "i",
        color: "white",
      },
      duration: 0,
    },
    {
      type: "success",
      background: "#13716D",
      icon: {
        className: "fas fa-check-circle",
        tagName: "i",
        color: "white",
      },
      duration: 800,
    },
    {
      type: "final",
      background: "#13716D",
      icon: {
        className: "fas fa-check-circle",
        tagName: "i",
        color: "white",
      },
      duration: 3000,
    },
    {
      type: "warning",
      background: "#fa8c16",
      icon: {
        className: "fas fa-exclamation-triangle",
        tagName: "i",
        color: "white",
      },
      duration: 3000,
    },
    {
      type: "app_update_warning",
      background: "#fa8c16",
      icon: {
        className: "fas fa-tools",
        tagName: "i",
        color: "white",
      },
      duration: 0,
    },
    {
      type: "error",
      background: "#B80D49",
      icon: {
        className: "fas fa-times-circle",
        tagName: "i",
        color: "white",
      },
      duration: 3000,
    },
  ],
});


export const notify = (type="success", message, duration=5000) => notyf.open({
  type,
  message,
  duration,
})
