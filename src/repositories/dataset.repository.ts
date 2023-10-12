import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Dataset} from '../models';

export class DatasetRepository extends DefaultCrudRepository<
  Dataset,
  typeof Dataset.prototype.id
> {
  constructor(@inject('datasources.db') dataSource: DbDataSource) {
    super(Dataset, dataSource);
  }
}
