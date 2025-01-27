/*
 * Node.JS + Express Resource Model Loader
 * Copyright (C) Darren Smith 2024.
 */

module.exports = function(universe) {

    require('./walker')(universe.siteFolder + '/resources', function (err, data) {
        for (let i = 0; i < data.length; i++) {
            if(!data[i].endsWith(".DS_Store")) {
                let pathArray = data[i].split(".")[0].split("/");
                let modelName = pathArray[pathArray.length - 1];
                try {
                    universe.resources[modelName] = require(data[i])(universe);
                } catch(err) {
                    console.log(modelName + " is an invalid model resource.");
                }

            }
        }
        universe.db.sync({ force: true });
    });

}