<p align="center">
  <img src="src/renderer/assets/img/logo-guide-draft-transparent-tight.png" width="250" alt="NeuroConv logo"/>
  <h3 align="center">NWB Graphical User Interface for Data Entry</h3>
</p>

> **Note:** This project is under heavy pre-release development and is not recommended for practical use.

<!-- TABLE OF CONTENTS -->

## Table of Contents

- [About](#about)
- [Installation](#installation)
- [Developer Installation](#developer-installation)
  - [Clone the Repo](#clone-the-repo)
  - [Install Python Dependencies](#install-pythoh-dependencies)
  - [Install JavaScript Dependencies](#installing-javascript-dependencies)
  - [Run the Application](#run-the-application)
- [Repo Structure](#repo-structure)

## About
NWB GUIDE is a desktop app that provides a no-code user interface for converting neurophysiology data to NWB.

<p align="center">
  <a href="https://www.youtube.com/watch?v=z-rk2wi5BDc" target="_blank">
  <img src="docs/assets/guide-video-image.png" alt="Watch the video" width="500" />
  </a>
</p>


## Installation
See the installation instructions on our [documentation](https://nwb-guide.readthedocs.io/en/latest/installation.html).

## Developer Installation
### Clone the Repo

Start by cloning the repository

```
git clone https://github.com/catalystneuro/nwb-guide
```

### Install Pythoh Dependencies

Install the appropriate Python dependencies for your operating system.

#### Windows
```bash
conda env create -f ./environments/environment-Windows.yml
```

#### Mac
```bash
conda env create -f ./environments/environment-MAC.yml
```

#### M1 Mac
```bash
conda env create -f ./environments/environment-MAC-arm64.yml
```

#### Linux
```bash
conda env create -f ./environments/environment-Linux.yml
```

Before starting NWB GUIDE, you'll need to ensure that the Python environment is activated.

```bash
conda activate nwb-guide
```

### Installing JavaScript Dependencies

Next, install all JavaScript dependencies based on the `package-lock.json` file.

```bash
npm ci
```

### Run the Application

You can now run the following command to start the application using Electron.

```bash
npm start
```

## Repo Structure
1. `/src` - Contains all the source code for the frontend
    - `index.js` - The entry point for the application
    - `pages.js` - The main code that controls which pages are rendered and how they are linked together
    - `stories` - Contains all the Web Components and related Storybook stories
    - `electron` - Contains all the Electron-related code to enable conditional inclusion for development mode
    - `assets` - Contains all the frontend-facing assets (e.g. images, css, etc.)
2. `/pyflask` - Contains all the source code for the backend

For more information about how to contribute, see our [Developer Guide](https://nwb-guide.readthedocs.io/en/latest/developer_guide.html).
