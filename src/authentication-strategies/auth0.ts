// src/auth0.strategy.ts
import {AuthenticationStrategy} from '@loopback/authentication';
import {HttpErrors, Request} from '@loopback/rest';
import {securityId, UserProfile} from '@loopback/security';
import * as jwt from 'jsonwebtoken';
import {JwksClient} from 'jwks-rsa';

export class Auth0Strategy implements AuthenticationStrategy {
  name = 'auth0';

  private client: JwksClient;

  constructor() {
    this.client = new JwksClient({
      jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
    });
  }

  async authenticate(request: Request): Promise<UserProfile | undefined> {
    const token = this.extractToken(request);
    const payload = await this.verifyToken(token);
    return this.toUserProfile(payload);
  }

  private extractToken(request: Request): string {
    const auth = request.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      throw new HttpErrors.Unauthorized('Missing Bearer token');
    }

    // Normalize possible quoted/space-padded bearer values before decoding.
    const token = auth
      .slice(7)
      .trim()
      .replace(/^['\"]|['\"]$/g, '');
    if (!token) {
      throw new HttpErrors.Unauthorized('Missing token value');
    }

    return token;
  }

  private async verifyToken(token: string): Promise<jwt.JwtPayload> {
    if (token.split('.').length !== 3) {
      throw new HttpErrors.Unauthorized(
        'Invalid JWT format (expected header.payload.signature)',
      );
    }

    const decoded = jwt.decode(token, {complete: true});
    if (!decoded || typeof decoded === 'string') {
      throw new HttpErrors.Unauthorized('Invalid token');
    }

    const key = await this.client.getSigningKey(decoded.header.kid);
    const signingKey = key.getPublicKey();

    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        signingKey,
        {
          audience: process.env.AUTH0_AUDIENCE,
          issuer: `https://${process.env.AUTH0_DOMAIN}/`,
          algorithms: ['RS256'],
        },
        (err, payload) => {
          if (err) reject(new HttpErrors.Unauthorized(err.message));
          else if (!payload || typeof payload === 'string') {
            reject(new HttpErrors.Unauthorized('Invalid token payload'));
          } else {
            resolve(payload as jwt.JwtPayload);
          }
        },
      );
    });
  }

  private toUserProfile(payload: jwt.JwtPayload): UserProfile {
    const id =
      typeof payload.sub === 'string' && payload.sub.length > 0
        ? payload.sub
        : 'unknown';

    return {
      [securityId]: id,
      id,
      name:
        typeof payload.name === 'string'
          ? payload.name
          : typeof payload.nickname === 'string'
            ? payload.nickname
            : undefined,
      email: typeof payload.email === 'string' ? payload.email : undefined,
    };
  }
}
