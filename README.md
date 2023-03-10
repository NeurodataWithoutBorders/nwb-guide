# NWB GUIDE

NWB GUIDE is a web application to construct conversion pipelines for the Neurodata Without Borders (NWB) format. Modeled after the [SODA for SPARC]() application, it sends queries to [neuroconv] to help you design a conversion pipeline for your data.

## Technology Stack
## Distrubution
    - [electron](https://www.electronjs.org/) for packaging the application for desktop

### Frontend
    - [vite](https://vitejs.dev/) for running a development server
    - [lit](https://lit.dev/) for web components
    - [storybook](https://storybook.js.org/) for component development

### Backend
    - [neuroconv] for running conversion pipelines
    - [flask](https://flask.palletsprojects.com/en/2.2.x/) and flask-restx](https://flask-restx.readthedocs.io/en/latest/) for exposing a [neuroconv] API

[neuroconv]: https://github.com/catalystneuro/neuroconv
