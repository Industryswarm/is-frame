#!/usr/bin/env node

/*!
* isFrame Application Loader.
*
* Copyright (c) 2024 Darren Smith.
*/


// Exit if App is NOT specified in command-line arguments:
const process = require('node:process');
if(!process.argv[2]) {
    console.log("App Loader: No Application Specified.");
    process.exit(0);
}


// Import Libraries and Initialise Variables:
const http = require('http'),
      express = require("express"),
      mustacheExpress = require('mustache-express'),
      bodyParser = require('body-parser'),
      forms = require('multer')(),
      RED = require("node-red"),
      EventEmitter = require('events'),
      cwd = process.cwd(),
      pkg = require(cwd + '/package.json'),
      fs = require('fs'),
      path = require('path'),
      app = express(),
      site = process.argv[2],
      siteFolder = cwd + "/apps/" + site,
      socketPath = "/tmp/is-frame_" + site + ".sock",
      universe = {
        site: site,
        siteFolder: siteFolder,
        cfg: require(siteFolder + '/app.json'),
        RED: RED,
        app: app,
        beacon: new EventEmitter(),
        resources: {},
        routes: {},
        context: {},
        pkg: pkg
      };


// Parse Request Body:
app.use(bodyParser.json());
app.use(forms.array());
app.use(bodyParser.urlencoded({ extended: false }));


// Register Mustache View Engine:
const VIEWS_PATH = siteFolder + '/views';
app.engine('mustache', mustacheExpress(VIEWS_PATH + '/partials', '.mustache'));
app.set('view engine', 'mustache');
app.set('views', VIEWS_PATH);


// Add a simple route for static content served from 'static':
app.use("/",express.static(siteFolder + "/static"));


// Forward Slash Redirection Middleware:
app.use(function (req, res, next) {
    if(req.path.endsWith("/") && req.path !== "/web/admin/flow/" && req.path !== "/") res.redirect(req.path.slice(0, -1));
    next();
});


// Create a server:
const server = http.createServer(app);


// Create the settings object:
const settings = require(path.join(__dirname, '/settings.js'))(universe);


// Initialise NodeRED Runtime
RED.init(server, settings);
app.use(settings.httpAdminRoot,RED.httpAdmin);
app.use(settings.httpNodeRoot,RED.httpNode);
if(!universe.pkg.customAttributes) universe.pkg.customAttributes = {};


// Delete Unix Socket if it Already Exists:
try { fs.unlinkSync(socketPath); }
catch (err) {}


// Listen for Incoming Requests on Unix Socket:
server.listen(socketPath, function() {
    console.log("IS-Frame App Loader: Loading \"" + site + "\" Application...");
});


// Start NodeRED (Runtime + Admin):
RED.start().then(r => null);


// Start Handlers For - DB Cxn (ORM), Resources, File-Based Routes, Errors & Swagger:
require(path.join(__dirname, '/database.js'))(universe);
require(path.join(__dirname, '/resources.js'))(universe);
require(path.join(__dirname, '/router.js'))(universe);
require(path.join(__dirname, '/errors.js'))(universe);
require(path.join(__dirname, '/swagger.js'))(universe, RED);


// Setup Global Emitter (this is just for testing at the moment):
let interval = 0;
setInterval(function(){
    universe.beacon.emit('event', {interval: interval});
    interval ++;
}, 10000);