# Offline-first web application demo

## Project Overview:
The aim of this application is to demonstrate a simple offline-first service that helps
choosing a restaurant based on it's location, description and customer reviews. 

## Features:
- Responsive design,
- Accessibility,
- Offline usage through integration of Service worker, Cache API and IndexedDB.

### Installation
1. Run `npm install` to install project dependencies.
2. Run `npm i -g gulp`.
3. In this folder, start up a simple HTTP server to serve up the site files on your local computer.
In a terminal, check the version of Python you have: `python -V`.  If you don't have Python installed,
 navigate to Python's [website](https://www.python.org/) to download and install the software.

### Running
1. If you have Python 2.x, spin up the server with `python -m SimpleHTTPServer 8000`. 
For Python 3.x, you can use `python3 -m http.server 8000`.
2. With your server running, visit: `http://localhost:8000`.
3. Run `gulp` to modify styles and js files.

### Demo data from local API server 
This application is working in connection with a server environment.
Take the following steps to run the server:
```
git clone https://github.com/udacity/mws-restaurant-stage-3.git
npm i
npm i sails -g
node server
```



