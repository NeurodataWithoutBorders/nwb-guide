import { isElectron, app, port } from '../electron/index.js'

import serverSVG from "../stories/assets/server.svg?raw";
import webAssetSVG from "../stories/assets/web_asset.svg?raw";
import wifiSVG from "../stories/assets/wifi.svg?raw";

// Base Request URL for Python Server
export const baseUrl = `http://127.0.0.1:${port}`;

const isPromise = (o) => typeof o === 'object' && typeof o.then === 'function'

export const resolve = (object, callback) => {
  if (isPromise(object)) {
    return new Promise(resolvePromise => {
        object.then((res) => resolvePromise((callback) ? callback(res) : res))
    })
  } else return (callback) ? callback(object) : object
}

// -------------------------------------------------

import { StatusBar } from "../stories/status/StatusBar.js";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";

const appVersion = app?.getVersion();

export const statusBar = new StatusBar({
  items: [
    { label: unsafeSVG(webAssetSVG), value: isElectron ? appVersion ?? 'ERROR' : 'Web' },
    { label: unsafeSVG(wifiSVG) },
    { label: unsafeSVG(serverSVG) }
  ]
})


let serverCallbacks: Function[] = []
export const onServerOpen = (callback:Function) => {
  if (statusBar.items[2].status === true) return callback()
  else {
    return new Promise(res => {
        serverCallbacks.push(() => {
            res(callback())
        })

    })
 }
}

export const activateServer = () => {
 statusBar.items[2].status = true

 serverCallbacks.forEach(cb => cb())
 serverCallbacks = []
}

export const serverGlobals = {
    species: new Promise((res, rej) => {
      onServerOpen(() => {
        fetch(new URL("get-recommended-species", baseUrl))
          .then((res) => res.json())
          .then((species) => {
            res(species)
            serverGlobals.species = species
          })
          .catch(() => rej());
      });
    }),
    cpus: new Promise((res, rej) => {
      onServerOpen(() => {
        fetch(new URL("cpus", baseUrl))
          .then((res) => res.json())
          .then((cpus) => {
            res(cpus)
            serverGlobals.cpus = cpus
          })
          .catch(() => rej());
      });
    })
  }
