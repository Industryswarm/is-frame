#!/usr/bin/env node

/*!
* isFrame Application Loader.
*
* Copyright (c) 2024 Darren Smith.
*/


// Exit if App is NOT specified in command-line arguments:
const process = require('node:process');
if(!process.argv[2]) {
    console.log("IS-Frame: No Application Specified.");
    process.exit(1);
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
      fs = require('fs'),
      path = require('path'),
      app = express(),
      site = process.argv[2],
      siteFolder = cwd + "/apps/" + site,
      socketPath = "/tmp/is-frame_" + site + ".sock",
      universe = {
        pkg: null,
        cfg: null,
        site: site,
        siteFolder: siteFolder,
        RED: RED,
        app: app,
        beacon: new EventEmitter(),
        resources: {},
        routes: {},
        context: {},
        routerLoaded: false,
        hooks: {
            in: [],
            out: []
        }
      };


// Additional Declarations and Inclusions:
try {
    universe.cfg = require(siteFolder + '/app.json');
    universe.pkg = require(cwd + '/package.json');
} catch(err) { process.exit(1); }


// Parse Request Body:
app.use(bodyParser.json());
app.use(forms.array());
app.use(bodyParser.urlencoded({ extended: false }));


// Register Mustache View Engine:
const VIEWS_PATH = siteFolder + '/views';
app.engine('mustache', mustacheExpress(VIEWS_PATH + '/partials', '.mustache'));
app.set('view engine', 'mustache');
app.set('views', VIEWS_PATH);


// Handle In(coming) Hooks (Max 1 at the moment):
app.use(function (req, res, next) {
    let handle = false,
        incoming = universe.hooks.in;
    if (typeof incoming === 'function') {
        incoming(req, res, next);
        handle = true;
    }
    if(!handle || req.path.includes(universe.cfg.httpAdminRoot)) next();
});


// Add a simple route for static content served from 'static':
try {
    app.use("/",express.static(siteFolder + "/static"));
} catch(err) { console.log("IS-Frame: Error Mounting Static File Path for " + site) }


// Forward Slash Redirection Middleware:
app.use(function (req, res, next) {
    if(req.path.endsWith("/") && req.path !== "/web/admin/flow/" && req.path !== "/") res.redirect(req.path.slice(0, -1));
    next();
});


// Create a server:
const server = http.createServer(app);


// Create the settings object:
let settings;
try {
    settings = require(path.join(__dirname, '/settings.js'))(universe);
} catch(err) { process.exit(1); }

// Initialise NodeRED Runtime
RED.init(server, settings);
app.use(settings.httpAdminRoot,RED.httpAdmin);
app.use(settings.httpNodeRoot,RED.httpNode);
if(!universe.pkg) universe.pkg = {};


// Delete Unix Socket if it Already Exists:
try { fs.unlinkSync(socketPath); }
catch (err) {}


// Listen for Incoming Requests on Unix Socket:
server.listen(socketPath, function() { });


// Start NodeRED (Runtime + Admin):
RED.start().then(r => console.log("IS-Frame: Loading \"" + site + "\" Application...  Done!"));


// Start Handlers For - DB Cxn (ORM), Resources, File-Based Routes, Errors & Swagger:
try {
    require(path.join(__dirname, '/database.js'))(universe);
    require(path.join(__dirname, '/resources.js'))(universe);
    require(path.join(__dirname, '/router.js'))(universe);
    require(path.join(__dirname, '/errors.js'))(universe);
    require(path.join(__dirname, '/swagger.js'))(universe, RED);
} catch(err) { process.exit(1); }


// Setup Global Emitter (this is just for testing at the moment):
let interval = 0;
setInterval(function(){
    universe.beacon.emit('event', {interval: interval});
    interval ++;
}, 10000);