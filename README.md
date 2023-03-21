# NWB GUIDE

> **Note:** This project is under heavy pre-release development and is not recommended for practical use.

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
Run the following command to start the Electron application.

```bash
npm start
```

## Contributing

### Repo Structure
#### NWB GUIDE
1. `/src` - Contains all the source code for the frontend
    - `index.js` - The entry point for the application
    - `pages.js` - The main code that controls which pages are rendered and how they are linked together
    - `stories` - Contains all the Web Components and related Storybook såtories
    - `electron` - Contains all the Electron-related code to enable conditional inclusion for development mode
2. `/pyflask` - Contains all the source code for the backend

#### SODA
There are many subdirectories that contain the source code for the original SODA pipeline. The most important ones are listed below:
1. `/scripts` - Contains all the scripts for the original SODA pipeline
2. `/assets` - Contains all the frontend-facing assets (e.g. images, code, etc.) for the original SODA pipeline

### Development Mode
Run the application in development mode to enable hot reloading of the JavaScript code by running parallel instances of the Flask server and a Vite development server.
```bash
npm run dev
```