
import { app, path, port } from './electron/index.js'
import { Notyf } from 'notyf'
import checkChromatic from 'chromatic/isChromatic';

import lottie from 'lottie-web'

export const joinPath = (...args) => path ? path.join(...args) : args.filter(str => str).join('/');


export let runOnLoad = (fn) => {
  if (document.readyState === 'complete') fn();
  else window.addEventListener('load', fn);
}

// Base Request URL for Python Server
export const baseUrl = `http://127.0.0.1:${port}`



// Filesystem Management
export const homeDirectory = app?.getPath("home") ?? '';
export const progressFilePath = homeDirectory ? joinPath(homeDirectory, "NWB GUIDE", "Progress") : '';
export const guidedProgressFilePath = homeDirectory ? joinPath(homeDirectory, "NWB GUIDE", "Guided-Progress") : '';

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
  duration: 3000,
  types: [
    {
      type: "checking_server_is_live",
      background: "grey",
      icon: {
        className: "fas fa-wifi",
        tagName: "i",
        color: "white",
      },
    },
    {
      type: "checking_server_api_version",
      background: "grey",
      icon: {
        className: "fas fa-wifi",
        tagName: "i",
        color: "white",
      },
    },
    {
      type: "loading_internet",
      background: "grey",
      icon: {
        className: "fas fa-wifi",
        tagName: "i",
        color: "white",
      },
    },
    {
      type: "app_update",
      background: "grey",
      icon: {
        className: "fas fa-sync-alt",
        tagName: "i",
        color: "white",
      },
    },
    {
      type: "success",
      background: "#13716D",
      icon: {
        className: "fas fa-check-circle",
        tagName: "i",
        color: "white",
      },
    },
    {
      type: "warning",
      background: "#fa8c16",
      icon: {
        className: "fas fa-exclamation-triangle",
        tagName: "i",
        color: "white",
      },
      duration: 20000,
    },
    {
      type: "app_update_warning",
      background: "#fa8c16",
      icon: {
        className: "fas fa-tools",
        tagName: "i",
        color: "white",
      },
    },
    {
      type: "error",
      background: "#B80D49",
      icon: {
        className: "fas fa-times-circle",
        tagName: "i",
        color: "white",
      },
      duration: 20000,
    },
  ],
});


export const notify = (message, type="success", duration) => {
  const info = { type, message }
  if (duration) info.duration = duration
  return notyf.open(info)
}

export const dismissNotification = (notification) => notyf.dismiss(notification)