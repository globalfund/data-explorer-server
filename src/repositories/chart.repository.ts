import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Chart} from '../models';

export class ChartRepository extends DefaultCrudRepository<
  Chart,
  typeof Chart.prototype.id
> {
  constructor(@inject('datasources.db') dataSource: DbDataSource) {
    super(Chart, dataSource);
  }
}
