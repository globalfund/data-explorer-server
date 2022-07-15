import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import {ServiceMixin} from '@loopback/service-proxy';
import 'dotenv/config';
import path from 'path';
import {DbDataSource} from './datasources';

export {ApplicationConfig};

export class ApiApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Set datasource based off environment
    const dbHost = process.env.MONGO_HOST ?? 'localhost';
    const dbPort = process.env.MONGO_PORT ?? 27017;
    const dbUser = process.env.MONGO_USERNAME ?? '';
    const dbPass = process.env.MONGO_PASSWORD ?? '';
    const database = process.env.MONGO_DB ?? 'the-data-explorer-db';

    this.bind('datasources.config.db').to({
      name: 'db',
      connector: 'mongodb',
      url: '',
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPass,
      database: database,
      useNewUrlParser: true,
    });
    this.bind('datasources.db').toClass(DbDataSource);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/api-explorer',
      indexTitle: 'The Data Explorer API',
    });
    this.component(RestExplorerComponent);

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };
  }
}
