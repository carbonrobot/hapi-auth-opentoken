const Boom = require('boom'),
    Hoek = require('hoek'),
    OpenTokenAPI = require('opentoken').OpenTokenAPI;

// default internal settings
const internals = {
    settings: {
        tokenName: 'opentoken',
        cipherSuite: 0,
        password: null
    }
};

/**
 * Authenticate for this scheme [required]
 * 
 * @param request - Hapi Request object @see http://hapijs.com/api#request-object
 * @param reply - reply is a callback that must be called when your authentication is complete.
 */
function authenticate(request, reply) {
    // Opentoken is sent in the payload, so we initiate passthrough
    // because the authenticate method is required by hapi.js
    return reply.continue({ credentials: {} });
}

/**
 * Payload authentication for this scheme. 
 * Opentoken is sent as a parameter in the body of the request.
 * 
 * @param request - Hapi Request object @see http://hapijs.com/api#request-object
 * @param reply - reply is a callback that must be called when your authentication is complete.
 */
function payload(request, reply) {

    console.log('Request:', {
        id: request.id,
        info: request.info,
        method: request.method,
        query: request.query,
        payload: request.payload,
        path: request.path,
        headers: request.headers
    });

    // check for token existence
    const tokenName = internals.settings.tokenName;
    if (!request.payload) {
        return reply(Boom.unauthorized('Missing opentoken with name [' + tokenName + '] from request body.'));
    }

    // parse token
    var token = request.payload[tokenName];
    internals.openTokenApi.parseToken(token, (err, data) => {
        if (err) {
            console.log(err);
            return reply(Boom.unauthorized('Error parsing opentoken'));
        }

        internals.validate(request, data, (err, user) => {
            if (err) {
                return reply(err, null);
            }

            if (!user) {
                return reply(Boom.unauthorized('User not authenticated'));
            }

            // inject into auth, we cant use continue to do so in the payload block
            request.auth.credentials.user = user;
            return reply.continue();
        });

    });
}

/**
 This method must return an object with at least the key authenticate. Other optional methods that can be used are payload and response.
 * @param server
 * @param options
 */
function scheme(server, options) {
    Hoek.assert(typeof options.validate === 'function', 'options.validate must be a valid function in opentoken scheme');
    
    internals.validate = options.validate;
    
    return {
        authenticate: authenticate,
        payload: payload,
        options: {
            payload: true
        }
    };
}

/**
 * Register the plugin with the hapi ecosystem
 */
exports.register = function(server, options, next) {
    internals.settings = Hoek.applyToDefaults(internals.settings, options);

    var otkOptions = {};
    if (options.tokenLifetime) {
        otkOptions.tokenLifetime = options.tokenLifetime;
    }
    if (options.tokenRenewal) {
        otkOptions.tokenRenewal = options.tokenRenewal;
    }
    if (options.tokenTolerance) {
        otkOptions.tokenTolerance = options.tokenTolerance;
    }

    // open token processor
    internals.openTokenApi = new OpenTokenAPI(
        internals.settings.cipherSuite,
        internals.settings.password,
        otkOptions);

    server.auth.scheme('opentoken', scheme);
    return next();
};

exports.register.attributes = {
    pkg: require('./package.json')
};

