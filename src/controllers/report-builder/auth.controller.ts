import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {get, Response, response, RestBindings} from '@loopback/rest';
import {handleDataApiError} from '../../utils/dataApiError';

export class AuthController {
  constructor(@inject(RestBindings.Http.RESPONSE) private response: Response) {}

  @get('/auth/validate-token')
  @response(200)
  @authenticate({strategy: 'auth0', options: {scopes: ['greet']}})
  async validateToken() {
    try {
      return this.response.status(200).send({message: 'Token is valid'});
    } catch (error) {
      handleDataApiError(error);
    }
  }
}
