/**
 * Swagger Definition File Generator
 **/

module.exports = function(universe, RED) {
    "use strict";

    const convToSwaggerPath = x => `/{${x.substring(2)}}`;
    const trimAll = ary => ary.map(x => x.trim());
    const csvStrToArray = csvStr => csvStr ? trimAll(csvStr.split(",")) : [];
    const ensureLeadingSlash = url => (url.startsWith("/") ? url : "/" + url);
    const stripTerminalSlash = url =>
        url.length > 1 && url.endsWith("/") ? url.slice(0, -1) : url;
    const regexColons = /\/:\w*/g;

    RED.httpNode.get("/api/swagger.json", (req, res) => {

        // Define Default Swagger Template:
        const DEFAULT_TEMPLATE = {
            swagger: "2.0",
            host: req.hostname,
            schemes: [req.protocol],
            info: {
                title: universe.cfg.name,
                version: universe.cfg.version,
                description: "# Introduction\nWelcome to the " + universe.cfg.name + " API!\n* You can view the <a href=\"/integration\">API Documentation</a>.\n* Or explore and interact with the API using the <a href=\"/integration/console\">API Console</a>.\n* Or <a href=\"/\">Return to the " + universe.cfg.name + " homepage.</a>\n",
                "x-logo": {
                    // "url": "https://xxx",
                    "backgroundColor": "#FFFFFF",
                    "altText": universe.cfg.name
                }
            }
        };

        // Set Base Details:
        const {
            httpNodeRoot,
            swagger: { parameters: additionalParams = [], template: resp = { ...DEFAULT_TEMPLATE } } = {}
        } = RED.settings;
        const { basePath = httpNodeRoot } = resp;
        resp.basePath = stripTerminalSlash(basePath);
        resp.paths = {};

        // Fetch HTTP In Nodes from NodeRED:
        if(!RED.nodes) RED.nodes = { eachNode: function(){}, getNode: function(){}};
        RED.nodes.eachNode(node => {
            const { name, type, method, swaggerDoc, url } = node;

            if (type === "http in") {
                const swagger = RED.nodes.getNode(swaggerDoc);
                const endPoint = ensureLeadingSlash(url.replace(regexColons, convToSwaggerPath));

                const {
                    summary = name || method + " " + endPoint,
                    description = "",
                    tags = "",
                    consumes,
                    produces,
                    deprecated,
                    parameters = [],
                    responses = {
                        default: {
                            description: ""
                        }
                    }
                } = swagger || {};

                const aryTags = csvStrToArray(tags),
                    aryConsumes = csvStrToArray(consumes),
                    aryProduces = csvStrToArray(produces);

                if(!description.toLowerCase().includes("hidden") || req.query.hidden === "false") {
                    if (!resp.paths[endPoint]) resp.paths[endPoint] = {};
                    resp.paths[endPoint][method] = {
                        summary,
                        description,
                        tags: aryTags,
                        consumes: aryConsumes,
                        produces: aryProduces,
                        deprecated,
                        parameters: [...parameters, ...additionalParams],
                        responses
                    };
                }
            }
        });

        // Fetch External HTTP Express Routes:
        for (let host in universe.routes) {
            let routes = universe.routes["default"] ? universe.routes["default"] : universe.routes[req.hostname];
            for (let endPoint in routes) {
                let controller = routes[endPoint];
                for (const method of ["get", "post", "put", "update", "delete"]) {
                    if(controller[method]) {
                        let metadata;
                        if(controller && controller.metadata) metadata = controller.metadata();
                        else metadata = { hidden: true, methods: {} }
                        if(!metadata.methods) metadata.methods = {};
                        if(!metadata.methods[method]) metadata.methods[method] = {};
                        if(!metadata.hidden || req.query.hidden === "false"){
                            if (!resp.paths[endPoint]) resp.paths[endPoint] = {};
                            if (!resp.paths[endPoint][method]) resp.paths[endPoint][method] = {};
                            let parameters;
                            if(metadata.methods[method].parameters) parameters = metadata.methods[method].parameters;
                            else parameters = [];
                            resp.paths[endPoint][method] = {
                                summary: metadata.methods[method].name || method + " " + endPoint,
                                description: metadata.methods[method].description,
                                tags: csvStrToArray(metadata.methods[method].tags),
                                consumes: csvStrToArray(metadata.methods[method].consumes),
                                produces: csvStrToArray(metadata.methods[method].produces),
                                deprecated: metadata.methods[method].deprecated,
                                parameters: [...parameters, ...additionalParams],
                                responses: {
                                    default: {
                                        description: ""
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        res.json(resp);
    });
};
