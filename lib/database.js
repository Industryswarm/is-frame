/*
 * Sequelize Database / ORM Loader.
 * Copyright (C) Darren Smith 2024.
 */

const { Sequelize, DataTypes, Model } = require("sequelize");
module.exports = function(universe) {
    let config = {};
    config.dialect = universe.cfg.db.dialect;
    config.logging = false;
    if(config.dialect === "sqlite") {
        if(config.storage !== "memory") config.storage = universe.siteFolder + "/data/" + universe.cfg.db.storage;
        if(config.storage === "memory") universe.db = new Sequelize("sqlite::memory:");
        else universe.db = new Sequelize(config);
    } else {
        config.host = universe.cfg.db.host;
        const database = universe.cfg.db.database;
        const username = universe.cfg.db.username;
        const password = universe.cfg.db.password;
        universe.db = new Sequelize(database, username, password, config);
    }
    universe.db.DataTypes = DataTypes;
    universe.db.Model = Model;
    return universe.db;
}