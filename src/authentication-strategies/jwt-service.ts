import {
  bind,
  BindingScope,
  config,
  ContextTags,
  Provider,
} from '@loopback/core';
import {RequestHandler} from 'express';
import {expressjwt} from 'express-jwt';
import {Auth0Config, JWT_SERVICE, KEY} from './types';

const jwks = require('jwks-rsa');

@bind({
  tags: {[ContextTags.KEY]: JWT_SERVICE},
  scope: BindingScope.SINGLETON,
})
export class JWTServiceProvider implements Provider<RequestHandler> {
  constructor(
    @config({fromBinding: KEY})
    private options: Auth0Config,
  ) {}

  value() {
    const auth0Config = this.options || {};
    // Use `expressjwt` to verify the Auth0 JWT token
    return expressjwt({
      secret: jwks.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: auth0Config.jwksUri,
      }),
      audience: auth0Config.audience,
      issuer: auth0Config.issuer,
      algorithms: (auth0Config.algorithms || ['RS256']) as any, // cast to Algorithm[]
      // Customize `getToken` to allow `access_token` query string in addition
      // to `Authorization` header
      getToken: req => {
        if (
          req.headers.authorization &&
          req.headers.authorization.split(' ')[0] === 'Bearer'
        ) {
          return req.headers.authorization.split(' ')[1];
        } else if (req.query && req.query.access_token) {
          // If access_token is an array, return the first string value
          if (Array.isArray(req.query.access_token)) {
            return req.query.access_token[0] as string;
          }
          return req.query.access_token as string;
        }
        return undefined;
      },
    });
  }
}
