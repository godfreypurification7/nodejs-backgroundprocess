const { sampleHandler } = require("./Routeshandler/sampleHandler");
const { userHandler } = require("./Routeshandler/userHandler");
const { tokenHandler } = require("./Routeshandler/tokenHandler");
const { checkHandler } = require("./Routeshandler/checkHandler");

const routes = {
    'sample': sampleHandler,
    'user': userHandler,
    'token': tokenHandler,
    'check': checkHandler,
};

module.exports = routes;