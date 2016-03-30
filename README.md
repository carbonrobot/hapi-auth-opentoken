hapi-auth-opentoken
--------------------

[![npm version](https://badge.fury.io/js/hapi-auth-opentoken.svg)](https://badge.fury.io/js/hapi-auth-opentoken)

Opentoken authentication scheme designed to work with PINGFederate Opentoken endpoints.

## Usage

```js
const opentoken = {
    register: require('hapi-auth-opentoken'),
    options: {
        password: 'testPassword',
        cipherSuite: 0,
        tokenName: 'opentoken'
    }
};

server.register([opentoken], (err) => {

    server.auth.strategy('default', 'opentoken', { validateFunc: validate });
    server.route({ method: 'GET', path: '/', config: { auth: 'default' } });
    
});

function validate(request, token, callback) {
    // token contains the decrypted saml response
    
    callback(err, { id: '12345', name: 'Jos Sykes' });
}
```

## Options

Opentoken takes the following options

- password - the token decryption shared key (default: null)
- cipherSuite - the opentoken cipher algorithm used by the server. One of the following [0,1,2,3] (default: 0)
- tokenName - (required) the name of the parameter in the POST request body to parse the token from
- tokenTolerance - The amount of time (in seconds) to allow for clock skew between servers in seconds (default: 120)
- tokenLifetime - The duration (in seconds) for which the token is valid. (default: 300)
- tokenRenewal - The amount of time (in seconds) the token will renew itself for. (default: 12hrs)

## Validation

The validation function has a signature of `validate(request, token, callback)` where

- request - the hapi.js request object
- token - the decrypted opentoken saml information
- callback - a callback function taking the following parameters
    - err - An optional error message which gets logged to stdout, null if no error
    - user - the user information to attach to request.auth.credentials in downstream methods