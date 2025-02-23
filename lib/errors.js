/*
 * Node.JS + Error Page Handler
 * Copyright (C) Darren Smith 2024.
 */

const path = require('path');

module.exports = function(universe) {

    // Handle Error Pages (After all other controllers have been loaded):
    const interval = setInterval(function() {
        if(universe.routerLoaded) {
            universe.app.use(function (req, res) {
                require('fs').readFile(path.join(__dirname, '../public/errors/404.html'), 'utf8', function (err, data) {
                    if (err) throw err;
                    if (!res.headersSent) res.status(404).send(data);
                });
            });
            clearInterval(interval);
        }
    }, 1000);

}