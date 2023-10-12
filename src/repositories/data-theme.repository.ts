import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {DataTheme} from '../models';

export class DataThemeRepository extends DefaultCrudRepository<
  DataTheme,
  typeof DataTheme.prototype.id
> {
  constructor(@inject('datasources.db') dataSource: DbDataSource) {
    super(DataTheme, dataSource);
  }
}
