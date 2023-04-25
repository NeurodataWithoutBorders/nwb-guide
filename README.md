<p align="center">
  <img src="src/assets/img/logo-guide-draft-transparent-tight.png" width="250" alt="NeuroConv logo"/>
  <h3 align="center">NWB Graphical User Interface for Data Entry</h3>
</p>

> **Note:** This project is under heavy pre-release development and is not recommended for practical use.

<!-- TABLE OF CONTENTS -->

## Table of Contents

- [About](#about)
- [Installation](#installation)
- [Getting Started](#getting-started)
- [Contributing](#contributing)

## About
NWB GUIDE is a desktop app that provides a no-code user interface for converting neurophysiology data to NWB.

## Installation
Install the appropriate Python dependencies for your operating system.

### Windows
```bash
conda env create -f ./tools/anaconda-env/environment-Windows.yml
```

### Mac
```bash
conda env create -f ./tools/anaconda-env/environment-MAC.yml
```

### Linux
```bash
conda env create -f ./tools/anaconda-env/environment-Linux.yml
```


Next, install all JavaScript dependencies based on the `package-lock.json` file.

```bash
npm ci
```

## Getting Started
Before starting NWB GUIDE, you'll need to ensure that the Python environment is activated.

```bash
conda activate env-electron-python
```

You can now run the following command to start the application using Electron.

```bash
npm start
```

## Contributing

### Repo Structure
#### NWB GUIDE
1. `/src` - Contains all the source code for the frontend
    - `index.js` - The entry point for the application
    - `pages.js` - The main code that controls which pages are rendered and how they are linked together
    - `stories` - Contains all the Web Components and related Storybook stories
    - `electron` - Contains all the Electron-related code to enable conditional inclusion for development mode
    - `assets` - Contains all the frontend-facing assets (e.g. images, css, etc.)
2. `/pyflask` - Contains all the source code for the backend

### Development Mode
Run the application in development mode to enable hot reloading of the JavaScript code by running parallel instances of the Flask server and a Vite development server.
```bash
npm run dev
```
