/*
 * Sequelize Database / ORM Loader.
 * Copyright (C) Darren Smith 2024.
 */

const { Sequelize, DataTypes } = require("sequelize");
module.exports = function(universe) {
    let config = {};
    config.dialect = universe.cfg.customAttributes.db.dialect;
    config.logging = false;
    if(config.dialect === "sqlite") {
        config.storage = universe.siteFolder + "/data/" + universe.cfg.customAttributes.db.storage;
        if(config.storage === "memory") universe.db = new Sequelize("sqlite::memory:");
        else universe.db = new Sequelize(config);
    } else {
        config.host = universe.cfg.customAttributes.db.host;
        const database = universe.cfg.customAttributes.db.database;
        const username = universe.cfg.customAttributes.db.username;
        const password = universe.cfg.customAttributes.db.password;
        universe.db = new Sequelize(database, username, password, config);
    }
    universe.db.DataTypes = DataTypes;
    return universe.db;
}