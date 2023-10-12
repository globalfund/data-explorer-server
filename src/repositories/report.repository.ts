import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Report} from '../models';

export class ReportRepository extends DefaultCrudRepository<
  Report,
  typeof Report.prototype.id
> {
  constructor(@inject('datasources.db') dataSource: DbDataSource) {
    super(Report, dataSource);
  }
}
