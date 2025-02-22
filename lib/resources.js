/*
 * Node.JS + Express Resource Model Loader
 * Copyright (C) Darren Smith 2024.
 */

module.exports = function(universe) {

    require('./walker')(universe.siteFolder + '/resources', function (err, data) {
        for (let i = 0; i < data.length; i++) {
            if(!data[i].endsWith(".DS_Store")) {
                let pathArray = data[i].split("/");
                let modelName = pathArray[pathArray.length - 1];
                if(modelName.includes(".js")) {
                    modelName = modelName.split(".")[0];
                    try {
                        if(modelName !== "Associations") universe.resources[modelName] = require(data[i])(universe);
                    } catch(err) { }
                }
            }
        }
        try {
            require(universe.siteFolder + '/resources/Associations/Associations.js')(universe);
        } catch(err) { }
        universe.db.sync({ force: true });
    });

}