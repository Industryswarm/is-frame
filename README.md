# IS-FRAME v3.0.2.
## By Darren Smith.

&nbsp;&nbsp;

Welcome to IS-Frame v3.0.1, the third framework released by IndustrySwarm (after ISNode [v1.x] and Blackrock [v2.x]).

The main difference between this (the third version of the) framework and previous versions is that previous versions were self-contained, had zero dependencies and did not integrate with Express, NodeRED or Sequelize. Whereas within this version, it is kept as lightweight as possible by including popular frameworks as dependencies.

# Features

- **Multi-Site/App Capabilities:** Sub-Folders, within the "/apps" folder of your current working directory, can be created to house separate websites or applications. All are accessible over the same IP Address / Port that the Framework is listening on, and are routed via the host names that are attached to each app.


- **Integrated NodeRED:** Each application that is being run on the framework integrates a single instance of NodeRED (one instance per app). Each app has its own flow and separate NodeRED Admin Access.


- **Express + File-Based Routing:** In addition to being able to handle different URL Routes via each App's NodeRED instance - you can create additional URL Routes using static Javascript files by altering the sub-folders within the "/apps/app.app/routes" folder, and creating a "controller.js" file within each sub-folder to handle that particular route.


- **Mustache View Engine:** The Mustache View Engine is integrated into Express within this framework so that you can render Mustache view files (as well as includes) from within your apps.


- **Support for Wildcard Routes:** Support exists for parameters within your URL Routes / Paths (eg; "/web/sites/{siteId}"), Wildcard Paths (across many path components - by creating a folder named "{\*}") and for host-based app routing (where the app folder name contains a \* within it).


- **Swagger (OpenAPI) Automation:** API Documentation is automatically generated using Swagger - at the "/api/swagger.json" endpoint. Routes are generated from the NodeRED Flow for each App, as well as from the Express File-Based Routes. You can toggle visibility for any route - from within both NodeRED and the File/Express-based Controllers.


- **Sequelize for Data Modelling:** IS-Frame integrates with the Sequelize library to handle access to databases. Data Models are loaded automatically from the "/apps/app.app/resources" folder. And many different SQL Relational Databases are supported - SQLite, PostgreSQL, MySQL / MariaDB.


- **Static File Hosting:** Static Files (HTML, CSS, JS, Images, Fonts, Etc...) can be included within the scope of each app - within the "/apps/app.app/static" folder AND also in a shared folder (/static) - where they are available to all apps being run.


# Getting Started


- **Create New Folder Structure:** Create a New Folder to Host the Framework (eg; at "/usr/src/app") and a sub-folder within it to hold the apps that are being developed or run (eg; "/usr/src/app/apps").


- **Create a "package.json" File:** Within the Root Directory for the Framework ("/usr/src/app"). Specify a name and version of your choosing. The only two critical things to include here are (i) the dependencies - "@industryswarm/is-frame" and the library for whatever database you are using (eg; "sqlite") - specifying the most recent versions; and (ii) "start.js" as the value for "main" - being the name of the primary script to launch.


- **Create a single Javascript File:** Within the root folder, alongside the "package.json" file, called "start.js". Include the following content:


    
    const isFrame = require("@industryswarm/is-frame");
    isFrame.then(function(proxy){ });


- **Run "npm install":** From within the root folder of the framework. In order to install all required dependencies.