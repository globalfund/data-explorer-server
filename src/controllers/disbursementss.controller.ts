import {inject} from '@loopback/core';
import {get, Request, response, RestBindings} from '@loopback/rest';
import axios from 'axios';
import _ from 'lodash';
import urls from '../config/urls/index.json';
import {getFilterString} from '../utils/filtering/disbursements/getFilterStringConcept';

const aggregateApplyFilterString = '$apply=<filterString>';

// const mapping = {
//   component: 'componentName',
//   cycle: 'implementationPeriodName',
//   dataPath: 'value',
//   grant: 'grantAgreementNumber',
//   location: 'geographicAreaCode_ISO3',
//   partnerId: 'principalRecipientId',
//   partner: 'principalRecipientName',
//   partnerTypeId: 'principalRecipientClassificationId',
//   partnerType: 'principalRecipientClassificationName',
//   period: 'disbursementYear',
//   status: 'implementationPeriodStatusTypeName',
//   multicountry: 'multiCountryName',
//   total: 'TotalDisbursementAmount',
//   value: 'disbursementAmount',
// };
const mapping = {
  component:
    'grantAgreementImplementationPeriod.grantAgreement.component.componentName',
  cycle: 'grantAgreementImplementationPeriod.implementationPeriodNumber',
  dataPath: 'value',
  grant:
    'grantAgreementImplementationPeriod.grantAgreement.grantAgreementNumber',
  location:
    'grantAgreementImplementationPeriod.grantAgreement.geographicArea.geographicAreaCode_ISO3',
  partnerId:
    'grantAgreementImplementationPeriod.grantAgreement.principalRecipientId',
  partner:
    'grantAgreementImplementationPeriod.grantAgreement.principalRecipient.organizationName',
  partnerTypeId:
    'grantAgreementImplementationPeriod.grantAgreement.principalRecipient.implementerClassification.implementerClassificationId',
  partnerType:
    'grantAgreementImplementationPeriod.grantAgreement.principalRecipient.implementerClassification.implementerClassificationName',
  period: 'disbursementYear',
  status:
    'grantAgreementImplementationPeriod.implementationPeriodStatusType.programStatusTypeName',
  multicountry:
    'grantAgreementImplementationPeriod.grantAgreement.multiCountry.multiCountryName',
  total: 'TotalDisbursementAmount',
  value: 'disbursementAmount',
};

const dimensions = [
  {
    id: 'Period',
    name: 'Period',
    aggregationUrl: `${urls.grantDetailDisbursements}/?${aggregateApplyFilterString}groupby((${mapping.period}),aggregate(${mapping.value} with sum as ${mapping.total}))`,
    fields: {
      id: mapping.period,
      name: mapping.period,
      value: mapping.total,
    },
    multilevel: false,
  },
  {
    id: 'Location',
    name: 'Location',
    aggregationUrl: `${
      urls.grantDetailDisbursements
    }/?${aggregateApplyFilterString}groupby((${mapping.location.replace(
      /\./g,
      '/',
    )},${mapping.multicountry.replace(/\./g, '/')}),aggregate(${
      mapping.value
    } with sum as ${mapping.total}))`,
    fields: {
      id: mapping.location,
      name: mapping.location,
      value: mapping.total,
    },
    multilevel: true,
  },
  {
    id: 'Component',
    name: 'Component',
    aggregationUrl: `${
      urls.grantDetailDisbursements
    }/?${aggregateApplyFilterString}groupby((${mapping.component.replace(
      /\./g,
      '/',
    )}),aggregate(${mapping.value} with sum as ${mapping.total}))`,
    fields: {
      id: mapping.component,
      name: mapping.component,
      value: mapping.total,
    },
    multilevel: false,
  },
  {
    id: 'PartnerType',
    name: 'Partner Type',
    aggregationUrl: `${
      urls.grantDetailDisbursements
    }/?${aggregateApplyFilterString}groupby((${mapping.partnerType.replace(
      /\./g,
      '/',
    )},${mapping.partner.replace(/\./g, '/')},${mapping.partnerTypeId.replace(
      /\./g,
      '/',
    )},${mapping.partnerId.replace(/\./g, '/')}),aggregate(${
      mapping.value
    } with sum as ${mapping.total}))`,
    fields: {
      id: mapping.partnerTypeId,
      name: mapping.partnerType,
      value: mapping.total,
      children: {
        id: mapping.partnerId,
        name: mapping.partner,
        value: mapping.total,
      },
    },
    multilevel: true,
  },
  {
    id: 'GrantCycle',
    name: 'Grant Cycle',
    aggregationUrl: `${
      urls.grantDetailDisbursements
    }/?${aggregateApplyFilterString}groupby((${mapping.cycle.replace(
      /\./g,
      '/',
    )}),aggregate(${mapping.value} with sum as ${mapping.total}))`,
    fields: {
      id: mapping.cycle,
      name: mapping.cycle,
      value: mapping.total,
    },
    multilevel: false,
  },
  {
    id: 'GrantStatus',
    name: 'Grant Status',
    aggregationUrl: `${
      urls.grantDetailDisbursements
    }/?${aggregateApplyFilterString}groupby((${mapping.status.replace(
      /\./g,
      '/',
    )}),aggregate(${mapping.value} with sum as ${mapping.total}))`,
    fields: {
      id: mapping.status,
      name: mapping.status,
      value: mapping.total,
    },
    multilevel: false,
  },
  {
    id: 'Grants',
    name: 'Grants',
    aggregationUrl: `${
      urls.grantDetailDisbursements
    }/?${aggregateApplyFilterString}groupby((${mapping.grant.replace(
      /\./g,
      '/',
    )},${mapping.cycle.replace(/\./g, '/')}),aggregate(${
      mapping.value
    } with sum as ${mapping.total}))`,
    fields: {
      id: mapping.grant,
      name: mapping.grant,
      value: mapping.total,
      children: {
        id: mapping.cycle,
        name: mapping.cycle,
        value: mapping.total,
      },
    },
    multilevel: true,
  },
];

const totalDisbursementAmountUrl = `${urls.grantDetailDisbursements}/?$apply=aggregate(${mapping.value} with sum as ${mapping.total})`;

interface DimensionFields {
  id: string;
  name: string;
  value: string;
  children?: {
    id: string;
    name: string;
    value: string;
  };
}

async function locationResponseFormatter(data: any): Promise<TreemapItem[]> {
  return axios
    .get(
      `http://localhost:${process.env.PORT ?? 4200}/filter-options/locations`,
    )
    .then(axiosResponse => {
      const regions = _.get(axiosResponse, `data.options`, []);

      regions.forEach((region: any) => {
        region.subOptions.forEach((subRegion: any) => {
          (subRegion.subOptions ?? []).forEach((country: any) => {
            const fIndex = _.findIndex(data, (item: any) => {
              return _.get(item, mapping.location, '') === country.value;
            });
            if (fIndex > -1) {
              country.total = data[fIndex][mapping.total];
            }
          });
          if (subRegion.value.indexOf('Multicountry') > -1) {
            const multicountryIndex = _.findIndex(data, {
              [mapping.multicountry]: subRegion.value,
            });
            if (multicountryIndex > -1) {
              subRegion.total = data[multicountryIndex][mapping.total];
            }
          }
          _.remove(subRegion.subOptions, (country: any) => !country.total);
          if (subRegion.subOptions) {
            subRegion.total =
              _.sumBy(subRegion.subOptions, 'total') +
              _.get(subRegion, 'total', 0);
          }
        });
        if (region.value.indexOf('Multicountry') > -1) {
          const multicountryIndex = _.findIndex(data, {
            [mapping.multicountry]: region.value,
          });
          if (multicountryIndex > -1) {
            region.total = data[multicountryIndex][mapping.total];
          }
        }
        _.remove(region.subOptions, (subRegion: any) => !subRegion.total);
        if (region.subOptions) {
          region.total =
            _.sumBy(region.subOptions, 'total') + _.get(region, 'total', 0);
        }
      });

      return regions.map((region: any) => ({
        id: region.value,
        name: region.label,
        value: region.total,
        children: region.subOptions?.map((subRegion: any) => ({
          id: subRegion.value,
          name: subRegion.label,
          value: subRegion.total,
          children: subRegion.subOptions?.map((country: any) => ({
            id: country.value,
            name: country.label,
            value: country.total,
          })),
        })),
      }));
    })
    .catch(error => {
      console.error({
        message: error.message,
        config: error.config ? error.config.url : 'No config url',
      });
      return [];
    });
}

function multiLevelDimensionResponseFormatter(
  data: any,
  dimensionFields: DimensionFields,
  dimensionId: string,
): TreemapItem[] {
  if (dimensionId === 'Location') {
    // @ts-ignore
    return locationResponseFormatter(data).then(resp => resp);
  }
  const groupedBy = _.groupBy(data, dimensionFields.id);
  return _.map(groupedBy, (value, key) => {
    const childrenDimensionFields = {
      id: dimensionFields.children ? dimensionFields.children.id : '',
      name: dimensionFields.children ? dimensionFields.children.name : '',
      value: dimensionFields.children ? dimensionFields.children.value : '',
    };
    const children = _.map(value, (item: any) => {
      const id = _.get(item, `[${childrenDimensionFields.id}]`, '');
      const name =
        `${dimensionId === 'Grants' ? 'Implementation period ' : ''}` +
        _.get(item, `[${childrenDimensionFields.name}]`, '');
      return {
        id: id ? id.toString() : '',
        name: name ? name.toString() : '',
        value: item[childrenDimensionFields.value],
      };
    });
    const name = _.get(value[0], `[${dimensionFields.name}]`, '');
    return {
      id: key ? key.toString() : '',
      name: name ? name.toString() : '',
      value: _.sumBy(children, 'value'),
      children,
    };
  });
}

function nonMultiLevelDimensionResponseFormatter(
  data: any,
  dimensionFields: {
    id: string;
    name: string;
    value: string;
  },
  dimensionId: string,
): TreemapItem[] {
  return data.map((item: any) => ({
    id: _.get(item, `[${dimensionFields.id}]`, '').toString(),
    name:
      `${dimensionId === 'GrantCycle' ? 'Cycle ' : ''}` +
      _.get(item, `[${dimensionFields.name}]`, '').toString(),
    value: _.get(item, `[${dimensionFields.value}]`, 0),
  }));
}

interface TreemapItem {
  id: string;
  name: string;
  value: number;
  children?: TreemapItem[];
}

export class DisbursementssController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  @get('/disbursementss/dimensions')
  @response(200)
  dimensions() {
    return {dimensions};
  }

  @get('/disbursementss/total')
  @response(200)
  total() {
    return axios
      .get(totalDisbursementAmountUrl)
      .then(resp => {
        return {
          total: _.get(
            resp,
            `data[${mapping.dataPath}][0][${mapping.total}]`,
            0,
          ),
        };
      })
      .catch(error => {
        console.error({
          message: error.message,
          config: error.config ? error.config.url : 'No config url',
        });
        return {
          total: 0,
        };
      });
  }

  @get('/disbursementss/treemap')
  @response(200)
  async treemap(): Promise<{data: TreemapItem[]}> {
    const selectedDimensionParam = this.req.query.dimension
      ? this.req.query.dimension.toString()
      : 'Period';

    const selectedDimension =
      _.find(dimensions, {id: selectedDimensionParam}) ?? dimensions[0];

    const url = getFilterString(
      this.req.query,
      selectedDimension.aggregationUrl,
    );

    const resp = await axios
      .get(url)
      .then(axiosResponse => {
        const data = _.get(axiosResponse, `data[${mapping.dataPath}]`, []);

        if (selectedDimension.multilevel) {
          return multiLevelDimensionResponseFormatter(
            data,
            selectedDimension.fields,
            selectedDimension.id,
          );
        } else {
          return nonMultiLevelDimensionResponseFormatter(
            data,
            selectedDimension.fields,
            selectedDimension.id,
          );
        }
      })
      .catch(error => {
        console.error({
          message: error.message,
          config: error.config ? error.config.url : 'No config url',
        });
        return [];
      });

    return {
      data: resp,
    };
  }
}
