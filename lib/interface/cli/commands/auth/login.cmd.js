const debug = require('debug')('codefresh:auth:login');
const Command = require('../../Command');
const _ = require('lodash');
const CFError = require('cf-errors');
const DEFAULTS = require('../../defaults');
const { auth } = require('../../../../logic');
const { user } = require('../../../../logic/api');
const { JWTContext } = auth.contexts;
const authManager = auth.manager;
const authRoot = require('../root/auth.cmd');


const _loginWithUserPassword = async (username, password, url) => {
    try {
        const token = await user.loginWithUserPassword(username, password);
        return JWTContext.createFromToken(token, url);
    } catch (err) {
        throw new CFError({
            cause: err,
            message: 'Failed to login with username and password',
        });
    }
};

const command = new Command({
    command: 'login <username> <password>',
    description: 'Login',
    builder: (yargs) => {
        return yargs
            .usage('Login options')
            .positional('username', {
                describe: 'username',
                required: true,
            })
            .positional('password', {
                describe: 'password',
                required: true,
            })
            .option('url', {
                describe: 'Codefresh system custom url',
                default: DEFAULTS.URL,
            });
    },
    handler: async (argv) => {
        const authContext = await _loginWithUserPassword(argv.username, argv.password, argv.url);

        await authContext.validate();
        await authManager.addContext(authContext);
        await authManager.setCurrentContext(authContext);
        await authManager.persistContexts(authContext);

        console.log(`Login succeeded to ${authContext.url}`);
        console.log(`Switched to context: ${authContext.name}`);
    },
});
authRoot.subCommand(command);


module.exports = command;