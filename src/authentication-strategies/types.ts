import {
  AuthenticationBindings,
  AuthenticationStrategy,
} from '@loopback/authentication';
import {BindingKey} from '@loopback/core';
import {RequestHandler} from 'express';

export interface Auth0Config {
  jwksUri: string;
  audience: string;
  issuer: string;
  algorithms: string[];
}

export const JWT_SERVICE: BindingKey<RequestHandler> = BindingKey.create(
  'services.JWTService',
);

export const KEY = BindingKey.create<AuthenticationStrategy>(
  `${AuthenticationBindings.AUTHENTICATION_STRATEGY_EXTENSION_POINT_NAME}.JWTAuthenticationStrategy`,
);
