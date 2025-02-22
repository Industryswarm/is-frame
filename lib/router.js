/*
 * Node.JS + Express Controller File Router.
 * Copyright (C) Darren Smith 2024.
 */

module.exports = function(universe) {

    require('./walker')(universe.siteFolder + '/routes', function (err, data) {

        // Create Controller List for Data + Base Path:
        let preData = data;
        data = [];
        for (let i = 0; i < preData.length; i++) {
            if(preData[i].endsWith("controller.js")){
                data.push(preData[i].substring(0, preData[i].length - 14));
            }
        }

        // Sort Controller List Alphabetically:
        data.sort(function(a, b) {
            return a.localeCompare(b) || // sort by dictionary order, if equal then
                a.length - b.length; // sort by length
        });

        // Define Variables:
        let services = {};

        // Set Controller Base Path:
        let ctrlList = [], basePath;
        for (let i = 0; i < data.length; i++) {
            if(i === 0){
                basePath = data[0];
                ctrlList.push(data[0].replace(basePath, "/"));
            } else {
                if(!basePath) basePath = "/";
                ctrlList.push(data[i].replace(basePath, ""));
            }
        }
        services = {
            default: {
                base: basePath,
                routes: ctrlList
            }
        }

        // Throw Any Errors:
        if(err){throw err;}

        // Load Controllers:
        let myRoutes = services["default"].routes;
        for (let i = 0; i < myRoutes.length; i++) {
            let controller, metadata;
            let path = basePath + "/" + myRoutes[i] + "/controller.js";
            path = path.replace("//", "/");
            path = path.replace("//", "/");
            if (require("fs").existsSync(path)) {
                let ctrlClass;
                try {
                    ctrlClass = require(path)(universe);
                } catch(err) { }
                function isClass(v) { return typeof v === 'function' && /^\s*class\s+/.test(v.toString()) }
                if (ctrlClass && isClass(ctrlClass)) {
                    controller = new ctrlClass();
                }
                else { controller = function InvalidController() {}; }
            } else {
                controller = function ControllerNotFound() {};
            }
            if(!universe.routes['default']) universe.routes['default'] = {};
            if(!universe.routes['default'][myRoutes[i]]) universe.routes['default'][myRoutes[i]] = controller;
        }

        // Process Incoming Requests to Controllers:
        const processIncomingRequest = function ProcessIncomingRequest(req, res, next) {
            let routes = universe.routes["default"] ? universe.routes["default"] : universe.routes[req.hostname];
            if(!routes) { next(); return; }
            let controller;
            if(routes[req.path]) {
                controller = routes[req.path];      // Map Direct Static Match.
            } else {
                let match, matches = [], stopTracking = false;
                const urlParts = req.path.split("/");
                if(!req.params) req.params = {};
                for (let route in routes) {
                    match = true;
                    //console.log("Route: ", route);
                    //console.log("Req Path: ", req.path);
                    let patternSplit = route.split("/");
                    if (urlParts.length === patternSplit.length) {
                        for (let i = 0, l = urlParts.length; i < l; i++) {
                            let reg = patternSplit[i].match(/{(.*)}/);
                            if (reg && patternSplit[i] !== "{*}") {
                                req.params[reg[1]] = urlParts[i];
                            } else {
                                if (patternSplit[i] !== urlParts[i] && patternSplit[i] !== "{*}") match = false;
                            }
                        }
                    } else if (patternSplit.length < urlParts.length) {
                        if(route.endsWith("{*}")) {
                            for (let i = 0, l = urlParts.length; i < l; i++) {
                                if (patternSplit[i] && patternSplit[i] !== urlParts[i] && !stopTracking && patternSplit[i] !== "{*}") {
                                    match = false;
                                } else if (patternSplit[i] === "{*}") {
                                    for (let myRoute in routes) {
                                        if (myRoute.includes("{*}") && !myRoute.endsWith("{*}")) {
                                            if(!myRoute.includes(urlParts[urlParts.length - 1])) {
                                                match = false;
                                            }
                                        }
                                    }
                                    stopTracking = true;
                                }
                            }
                        } else if (route.includes("{*}") && !route.endsWith("{*}")) {
                            if(!route.includes(urlParts[urlParts.length - 1])) {
                                match = false;
                            }
                        } else {
                            match = false;
                        }
                    } else {
                        match = false;
                    }
                    if (match) {
                        //console.log("Match Made: ", routes[route]);
                        matches.push(routes[route]);
                    }
                }
                if(matches.length === 1) controller = matches[0];
                else {
                    controller = matches[matches.length - 1];
                    //console.log("Matches Array", matches);
                }
            }
            if(controller && controller[req.method.toLowerCase()]) {
                if(!res.headersSent) controller[req.method.toLowerCase()](req, res);
            } else next();
            setTimeout(function() { next(); }, 1000);
        }

        // Map Incoming Express HTTP Requests to Route Controllers:
        universe.app.use(function (req, res, next) {
            processIncomingRequest(req, res, next);
        });

        // Map Incoming Internal Function Requests to Route Controllers:
        universe.callRoute = function(route, param2, param3) {
            let cb;
            const req = { path: route }
            if (param2 && !(typeof param2 === 'function')) {
                if(param2.query) req.query = param2.query;
                if(param2.body) req.body = param2.body;
                if(param3 && typeof param3 === 'function') cb = param3;
                else cb = function EmptyCallback(){}
            }
            else if (param2 && (typeof param2 === 'function')) cb = param2;
            else return;
            const res = {
                send: function (payload) {
                    cb(payload);
                },
                json: function (payload) {
                    cb(payload);
                },
                render: function (view, param4, param5) {
                    if (param4 && !(typeof param4 === 'function')) {
                        cb(param4);
                    } else if (param5 && !(typeof param5 === 'function')) {
                        cb(param5);
                    } else {
                        cb();
                    }
                }
            }
            const next = function() {};
            processIncomingRequest(req, res, next);
        }

    });
}