/*
 * NodeRED Authentication + Authorisation Service.
 * Copyright (C) Darren Smith 2024.
 */

module.exports = {
   type: "credentials",
   users: function(username) {
    return new Promise(function(resolve) {
        if(username === "admin") {
           let user = { username: username, permissions: "*" };
           resolve(user);
        } else {
           resolve(null);
        }
    });
   },
   authenticate: function(username,password) {
    return new Promise(function(resolve) {
       if(username === "admin" && password === "password") {
           let user = { username: username, permissions: "*" };
           resolve(user);
       } else {
           resolve(null);
       }
    });
   },
   default: function() {
       return new Promise(function(resolve) {
           // Resolve with the user object for the default user.
           // If no default user exists, resolve with null.
           //resolve({anonymous: true, permissions:"read"});
           resolve(null);
       });
   }
}
