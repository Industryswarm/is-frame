/*
 * NodeRED Settings Object.
 * Copyright (C) Darren Smith 2024.
 */

const path = require("path");
module.exports = function (universe) {
    return {
        apiMaxLength: '50mb',
        httpAdminRoot: universe.cfg.httpAdminRoot,
        httpNodeRoot: '/',
        userDir: universe.siteFolder + '/flows',
        flowFile: universe.siteFolder + '/flows/flows.json',
        flowFilePretty: true,
        functionGlobalContext: { universe: universe },
        adminAuth: require(path.join(__dirname, './flowAuth')),
        credentialSecret: universe.cfg.credentialSecret,
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
                level: "off",
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
                url: "/"
            },
            deployButton: {
                type:"simple",
                label:"Deploy"
            },
            tours: true,
            userMenu: true,
            logout: {
                redirect: "/"
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
                enabled: false
            }
        }
    }
}