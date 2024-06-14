import { isElectron, app, port } from '../../utils/electron'

import serverSVG from "../../assets/icons/server.svg?raw";
import webAssetSVG from "../../assets/icons/web_asset.svg?raw";
import wifiSVG from "../../assets/icons/wifi.svg?raw";

import { StatusBar } from "../components/StatusBar.js";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";

// Base Request URL for Python Server
export const baseUrl = `http://127.0.0.1:${port}`;

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
        fetch(new URL("/dandi/get-recommended-species", baseUrl))
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
        fetch(new URL("/system/cpus", baseUrl))
          .then((res) => res.json())
          .then((cpus) => {
            res(cpus)
            serverGlobals.cpus = cpus
          })
          .catch(() => rej());
      });
    })
  }
