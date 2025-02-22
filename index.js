#!/usr/bin/env node

/*!
* isFrame Proxy Server Application.
*
* Copyright (c) 2024 Darren Smith.
*
* 1. Enumerates Available Apps.
* 2. Creates a Child Process for each App.
* 3. Routes Incoming HTTP Requests to the Correct App.
* 4. Returns Response to the Original Requester.
*/


// Import Libraries & Initialise Variables:
let sites = {},
    hosts = {};
const http = require("http"),
      express = require("express"),
      app = express(),
      server = http.createServer(app),
      WebSocket = require('ws'),
      { WebSocketServer, createWebSocketStream } = require('ws'),
      wss = new WebSocketServer({ noServer: true }),
      bodyParser = require('body-parser'),
      forms = require('multer')(),
      { fork } = require("child_process"),
      process = require('node:process'),
      cwd = process.cwd(),
      fs = require('fs'),
      path = require('path'),
      pkg = require(cwd + '/package.json');


// Print Startup Banner:
console.log("==========================================");
console.log("Welcome to IS-FRAME v" + pkg.version + ".");
console.log("Created by: Darren Smith.");
console.log("==========================================\n\n");


// Load Application:
const loadApplication = function(site){
    try {
        sites[site] = fork(path.join(__dirname, '/lib/loader.js'), [site]);
        sites[site].on("close", (code) => {
            if(code !== 1) {
                console.log("IS-Frame: Application '" + site + "' Terminated (Code: " + code + "). Restarting Now...");
                setTimeout(() => {
                    loadApplication(site);
                }, 25);
            }
        });
        sites[site].send('start');
    } catch(err) { console.log("IS-Frame: Loading \"" + site + "\" Application...  ERROR!!! Not Loaded.") }
}


// Enumerate and Load Apps:
fs.readdir(cwd + "/apps", function (err, filesPath) {
    if (err) throw err;
    const apps = filesPath.map(function (filePath) { return cwd + "/apps/" + filePath; });
    for(let i = 0; i < apps.length; i++) {
        if(!apps[i].endsWith(".DS_Store")) {
            let site = apps[i].split("/");
            site = site[site.length - 1];
            try {
                const cfg = require(cwd + "/apps/" + site + "/app.json");
                const socketPath = "/tmp/is-frame_" + site + ".sock";
                if (!site.includes("*")) {
                    for (const env in cfg.environments) {
                        hosts[cfg.environments[env]] = {
                            socketPath: socketPath,
                            site: site
                        }
                    }
                } else {
                    hosts["*"] = {
                        socketPath: socketPath,
                        site: site
                    }
                }
            } catch(err) { console.log("IS-Frame: Loading \"" + site + "\" Application...  ERROR!!! Not Loaded.") }
            loadApplication(site);
        }
    }
});


// Parse Request Body:
app.use(bodyParser.json());
app.use(forms.fields());
app.use(bodyParser.urlencoded({ extended: false }));


// Add a simple route for common static content served from 'static' (available to all apps):
try {
    app.use("/",express.static(cwd + "/static"));
} catch(err) { console.log("IS-Frame: Error Mounting Common Static File Path") }


// Proxy Incoming HTTP Requests to Unix Socket of Appropriate Child Process and Handle Response:
app.use(function(req, res) {
    if(!hosts[req.host] && !hosts["*"]) {
        if(!res.headersSent) {
            fs.readFile(path.join(__dirname, './public/errors/404.html'), 'utf8', function (err, data) {
                if (err) throw err;
                res.status(404).send(data);
            });
        }
        return;
    }
    let bodyData = "",
        contentType = "";
    if(!req.headers) req.headers = {};
    const options = {
        path: req.path,
        method: req.method,
        headers: req.headers,
    };
    if(hosts[req.host]) options.socketPath = hosts[req.host].socketPath;
    else if (hosts["*"]) options.socketPath = hosts["*"].socketPath;
    if(req.headers["content-type"]) contentType = req.headers["content-type"];
    if(req.body && contentType.includes("x-www-form-urlencoded")) {
        for(let key in req.body)
            bodyData += encodeURIComponent(key) + "=" + encodeURIComponent(req.body[key]) + "&";
        if(bodyData.length > 0) bodyData = bodyData.slice(0, -1);
    } else if(req.body && contentType.includes("json")) {
        bodyData = JSON.stringify(req.body);
    }
    if(bodyData) options.headers["Content-Length"] = Buffer.byteLength(bodyData);
    if(req.query) {
        let queryString = "";
        for(let key in req.query) queryString += key + "=" + req.query[key] + "&";
        if(queryString.length > 0) options.path += "?" + queryString.slice(0, -1);
    }
    try {
        const outgoingReq = http.request(options, (incomingRes) => {
            let body = "";
            incomingRes.resume();
            res.status(incomingRes.statusCode);
            res.set(incomingRes.headers);
            incomingRes.pipe(res);
            incomingRes.on('end', () => {
                if (!incomingRes.complete) {
                    res.send();
                    return;
                }
                if (!res.headersSent && body) res.send(body);
                else if (!res.headersSent && !body) res.send("IS-Frame: Error - No Body to Return");
            });
        });
        outgoingReq.on('error', (e) => {
            if (!res.headersSent) res.send();
        });
        if (bodyData) outgoingReq.write(bodyData);
        outgoingReq.end();
    } catch(err) {
        console.log("IS-Frame: Error Routing Request to Application");
    }
});


// Handle WebSocket Connections
wss.on('connection', function connection(ws, request) {
    ws.on('error', console.error);
    try {
        const wsClient = new WebSocket("ws+unix://" + hosts[request.headers['host']].socketPath + ":" + request.url);
        const clientDuplexStream = createWebSocketStream(wsClient, {});
        const serverDuplexStream = createWebSocketStream(ws, {});
        clientDuplexStream.on('error', console.error);
        serverDuplexStream.on('error', console.error);
        wsClient.on('open', function () {
            clientDuplexStream.on('data', function (chunk) {
                ws.send(chunk.toString());
            });
            serverDuplexStream.on('data', function (chunk) {
                wsClient.send(chunk.toString());
            });
        });
    } catch(err) { }
});
server.on('upgrade', function upgrade(request, socket, head) {
    socket.on('error', console.error);
    wss.handleUpgrade(request, socket, head, function done(ws) {
        wss.emit('connection', ws, request);
    });
});


// Begin Listening for Incoming Requests:
const port = 3000;
server.listen(port, function() {
    console.log("IS-Frame: Starting up HTTP / WebSocket Listener on port " + port + ".\n\n");
    console.log("IS-Frame: Loading Applications...\n\n");
});


// Return Universe Object to Main (Parent) Script on being Required:
const proxy = {};
module.exports = new Promise((resolve, reject) => {
    resolve(proxy);
});