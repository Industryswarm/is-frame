/*
 * NodeRED Settings Object.
 * Copyright (C) Darren Smith 2024.
 */

const path = require("path");
module.exports = function (universe) {
    return {
        apiMaxLength: '50mb',
        httpAdminRoot: universe.cfg.customAttributes.httpAdminRoot,
        httpNodeRoot: '/',
        userDir: universe.siteFolder + '/flows',
        flowFile: universe.siteFolder + '/flows/flows.json',
        flowFilePretty: true,
        functionGlobalContext: { universe: universe },
        adminAuth: require(path.join(__dirname, './flowAuth')),
        credentialSecret: universe.cfg.customAttributes.credentialSecret,
        httpNodeCors: {
            origin: "*",
            methods: "GET,PUT,POST,DELETE"
        },
        diagnostics: {
            enabled: true,
            ui: true,
        },
        // storageModule: require("./lib/storage"),
        logging: {
            console: {
                level: "info",
                metrics: false,
                audit: false,
            }
        },
        editorTheme: {
            page: {
                title: universe.cfg.name
            },
            header: {
                title: universe.cfg.name,
                image: null,
                url: universe.cfg.customAttributes.publicProtocol + "://" + universe.cfg.customAttributes.homepage
            },
            deployButton: {
                type:"simple",
                label:"Deploy"
            },
            tours: true,
            userMenu: true,
            logout: {
                redirect: universe.cfg.customAttributes.publicProtocol + "://" + universe.cfg.customAttributes.homepage
            },
            projects: {
                enabled: false
            },
            theme: "cobalt2",
            codeEditor: {
                lib: "ace"
            },
            markdownEditor: {
                mermaid: {
                    enabled: true
                }
            },
            multiplayer: {
                enabled: true
            }
        },
        swagger: {
            "template": {
                "swagger": "2.0",
                "host": universe.cfg.customAttributes.homepage,
                "schemes": [universe.cfg.customAttributes.publicProtocol],
                "info": {
                    "title": universe.cfg.name,
                    "x-logo": {
                        // "url": "https://circl.ai/assets/img/logo-only.png",
                        "backgroundColor": "#FFFFFF",
                        "altText": universe.cfg.name
                    },
                    "description": "# Introduction\nWelcome to the " + universe.cfg.name + " API!\n* You can view the <a href=\"/integration\">API Documentation</a>.\n* Or explore and interact with the API using the <a href=\"/integration/console\">API Console</a>.\n* Or <a href=\"/\">Return to the " + universe.cfg.name + " homepage.</a>\n",
                    "version": universe.cfg.version
                }
            }
        }
    }
}