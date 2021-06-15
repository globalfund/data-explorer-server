import {inject} from '@loopback/core';
import {
  get,
  Request,
  response,
  ResponseObject,
  RestBindings,
} from '@loopback/rest';
import axios, {AxiosError, AxiosResponse} from 'axios';
import _ from 'lodash';
import querystring from 'querystring';
import filtering from '../config/filtering/index.json';
import PledgesContributionsGeoFieldsMapping from '../config/mapping/pledgescontributions/geo.json';
import PledgesContributionsTimeCycleFieldsMapping from '../config/mapping/pledgescontributions/timeCycle.json';
import urls from '../config/urls/index.json';
import {FilterGroupOption} from '../interfaces/filters';
import {getFilterString} from '../utils/filtering/pledges-contributions/getFilterString';
import {getD2HCoordinates} from '../utils/pledgescontributions/getD2HCoordinates';

const PLEDGES_AND_CONTRIBUTIONS_TIME_CYCLE_RESPONSE: ResponseObject = {
  description: 'Pledges and Contributions time-cycle Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'PledgesContributionsTimeCycleResponse',
        properties: {
          count: {type: 'number'},
          data: {
            type: 'array',
            properties: {
              year: {type: 'string'},
              pledge: {type: 'number'},
              contribution: {type: 'number'},
              pledgeColor: {type: 'string'},
              contributionColor: {type: 'string'},
            },
          },
        },
      },
    },
  },
};

export class PledgescontributionsController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  @get('/pledges-contributions/time-cycle')
  @response(200, PLEDGES_AND_CONTRIBUTIONS_TIME_CYCLE_RESPONSE)
  timeCycle(): object {
    const filterString = getFilterString(
      this.req.query,
      PledgesContributionsTimeCycleFieldsMapping.pledgescontributionsTimeCycleAggregation,
    );
    const params = querystring.stringify(
      {},
      '&',
      filtering.param_assign_operator,
      {
        encodeURIComponent: (str: string) => str,
      },
    );
    const url = `${urls.pledgescontributions}/?${params}${filterString}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const rawData = _.get(
          resp.data,
          PledgesContributionsTimeCycleFieldsMapping.dataPath,
          [],
        );
        const groupByYear = _.groupBy(
          rawData,
          PledgesContributionsTimeCycleFieldsMapping.year,
        );
        const data: Record<string, unknown>[] = [];

        _.orderBy(Object.keys(groupByYear), undefined, 'asc').forEach(
          (year: string) => {
            const pledge = _.find(
              groupByYear[year],
              (item: any) =>
                item[PledgesContributionsTimeCycleFieldsMapping.indicator] ===
                'Pledge',
            );
            const contribution = _.find(
              groupByYear[year],
              (item: any) =>
                item[PledgesContributionsTimeCycleFieldsMapping.indicator] ===
                'Contribution',
            );
            data.push({
              year,
              pledge: _.get(
                pledge,
                PledgesContributionsTimeCycleFieldsMapping.amount,
                0,
              ),
              contribution: _.get(
                contribution,
                PledgesContributionsTimeCycleFieldsMapping.amount,
                0,
              ),
              pledgeColor: '#868E96',
              contributionColor: '#495057',
            });
          },
        );

        return {
          count: data.length,
          data,
        };
      })
      .catch((error: AxiosError) => {
        console.error(error);
      });
  }

  @get('/pledges-contributions/geomap')
  @response(200, PLEDGES_AND_CONTRIBUTIONS_TIME_CYCLE_RESPONSE)
  geomap(): object {
    const filterString = getFilterString(
      this.req.query,
      PledgesContributionsGeoFieldsMapping.pledgescontributionsGeoMapAggregation,
    );
    const params = querystring.stringify(
      {},
      '&',
      filtering.param_assign_operator,
      {
        encodeURIComponent: (str: string) => str,
      },
    );
    const valueType = (
      this.req.query.valueType ?? PledgesContributionsGeoFieldsMapping.pledge
    ).toString();
    const url = `${urls.pledgescontributions}/?${params}${filterString}`;

    return axios
      .all([
        axios.get(url),
        axios.get(
          PledgesContributionsGeoFieldsMapping.inAppDonorsFilterOptionsURL,
        ),
        // TODO: check how to serve static geojson in-app
        axios.get(PledgesContributionsGeoFieldsMapping.geojsonURL),
        axios.get(PledgesContributionsGeoFieldsMapping.d2hspatialshapesURL),
      ])
      .then(
        axios.spread((...responses) => {
          const geoJSONData = responses[2].data.features;
          const donorFilterOptions = responses[1].data.options;
          const D2HDonorCoordinateData: any[] = [];

          responses[3].data.value[0].members.forEach((member: any) => {
            member.donorSpatialShapes.forEach((shape: any) => {
              D2HDonorCoordinateData.push(shape);
            });
          });

          const rawData = _.get(
            responses[0].data,
            PledgesContributionsGeoFieldsMapping.dataPath,
            [],
          );
          const donorCountries = _.groupBy(
            rawData,
            PledgesContributionsGeoFieldsMapping.countryDonors,
          );
          const publicSectorCountries: any[] = [];
          const nonCountrySectorDonors: any[] = [];

          Object.keys(donorCountries).forEach((iso3: string) => {
            if (iso3 !== 'undefined') {
              const items = donorCountries[iso3];
              const pledges = _.filter(items, {
                [PledgesContributionsGeoFieldsMapping.indicator]:
                  PledgesContributionsGeoFieldsMapping.pledge,
              });
              const contributions = _.filter(items, {
                [PledgesContributionsGeoFieldsMapping.indicator]:
                  PledgesContributionsGeoFieldsMapping.contribution,
              });
              publicSectorCountries.push({
                code: iso3,
                geoName: items[0].donor.geographicArea.geographicAreaName,
                id: items[0].donorId,
                amounts: [
                  {
                    label: 'Pledge',
                    value: _.sumBy(
                      pledges,
                      PledgesContributionsGeoFieldsMapping.amount,
                    ),
                  },
                  {
                    label: 'Contribution',
                    value: _.sumBy(
                      contributions,
                      PledgesContributionsGeoFieldsMapping.amount,
                    ),
                  },
                ],
              });
            } else {
              const nonPublicDonors = _.groupBy(
                donorCountries[iso3],
                PledgesContributionsGeoFieldsMapping.nonCountryDonors,
              );
              Object.keys(nonPublicDonors).forEach(
                (donor: string, index: number) => {
                  const donorData = nonPublicDonors[donor][0];
                  const lat = _.get(
                    donorData,
                    PledgesContributionsGeoFieldsMapping.donorLat,
                    null,
                  );
                  const long = _.get(
                    donorData,
                    PledgesContributionsGeoFieldsMapping.donorLong,
                    null,
                  );
                  if (lat && long) {
                    const pledges = _.filter(nonPublicDonors[donor], {
                      [PledgesContributionsGeoFieldsMapping.indicator]:
                        PledgesContributionsGeoFieldsMapping.pledge,
                    });
                    const contributions = _.filter(nonPublicDonors[donor], {
                      [PledgesContributionsGeoFieldsMapping.indicator]:
                        PledgesContributionsGeoFieldsMapping.contribution,
                    });
                    let subType = '';
                    donorFilterOptions.forEach((option: FilterGroupOption) => {
                      if (_.find(option.subOptions, {label: donor})) {
                        subType = option.label;
                      }
                    });
                    const multiCoordinates =
                      subType === 'Debt2Health'
                        ? getD2HCoordinates(donor, D2HDonorCoordinateData)
                        : null;
                    nonCountrySectorDonors.push({
                      code: donor,
                      geoName: donor,
                      id: _.get(
                        donorData,
                        PledgesContributionsGeoFieldsMapping.donorId,
                      ),
                      latitude: parseFloat(
                        multiCoordinates ? multiCoordinates[0][0] : lat,
                      ),
                      longitude: parseFloat(
                        multiCoordinates ? multiCoordinates[0][1] : long,
                      ),
                      amounts: [
                        {
                          label: 'Pledge',
                          value: _.sumBy(
                            pledges,
                            PledgesContributionsGeoFieldsMapping.amount,
                          ),
                        },
                        {
                          label: 'Contribution',
                          value: _.sumBy(
                            contributions,
                            PledgesContributionsGeoFieldsMapping.amount,
                          ),
                        },
                      ],
                      subType,
                      d2hCoordinates: multiCoordinates,
                      intId: index,
                    });
                  }
                },
              );
            }
          });

          const maxValue: number =
            _.max(
              publicSectorCountries.map((d: any) =>
                _.get(_.find(d.amounts, {label: valueType}), 'value', 0),
              ),
            ) ?? 0;
          let interval = 0;
          if (maxValue) {
            interval = maxValue / 13;
          }
          const intervals: number[] = [];
          for (let i = 0; i < 13; i++) {
            intervals.push(interval * i);
          }
          const features = geoJSONData.map((feature: any) => {
            const fItem = _.find(publicSectorCountries, {
              code: feature.properties.iso_a3,
            });
            let itemValue = 0;
            if (fItem) {
              const fItemValue = _.get(
                _.find(fItem.amounts, {label: valueType}),
                'value',
                0,
              );
              if (
                (fItemValue < maxValue || fItemValue === maxValue) &&
                (fItemValue >= intervals[11] || fItemValue === intervals[11])
              ) {
                itemValue = 12;
              }
              if (
                (fItemValue < intervals[11] || fItemValue === intervals[11]) &&
                (fItemValue >= intervals[10] || fItemValue === intervals[10])
              ) {
                itemValue = 11;
              }
              if (
                (fItemValue < intervals[10] || fItemValue === intervals[10]) &&
                (fItemValue >= intervals[9] || fItemValue === intervals[9])
              ) {
                itemValue = 10;
              }
              if (
                (fItemValue < intervals[9] || fItemValue === intervals[9]) &&
                (fItemValue >= intervals[8] || fItemValue === intervals[8])
              ) {
                itemValue = 9;
              }
              if (
                (fItemValue < intervals[8] || fItemValue === intervals[8]) &&
                (fItemValue >= intervals[7] || fItemValue === intervals[7])
              ) {
                itemValue = 8;
              }
              if (
                (fItemValue < intervals[7] || fItemValue === intervals[7]) &&
                (fItemValue >= intervals[6] || fItemValue === intervals[6])
              ) {
                itemValue = 7;
              }
              if (
                (fItemValue < intervals[6] || fItemValue === intervals[6]) &&
                (fItemValue >= intervals[5] || fItemValue === intervals[5])
              ) {
                itemValue = 6;
              }
              if (
                (fItemValue < intervals[5] || fItemValue === intervals[5]) &&
                (fItemValue >= intervals[4] || fItemValue === intervals[4])
              ) {
                itemValue = 5;
              }
              if (
                (fItemValue < intervals[4] || fItemValue === intervals[4]) &&
                (fItemValue >= intervals[3] || fItemValue === intervals[3])
              ) {
                itemValue = 4;
              }
              if (
                (fItemValue < intervals[3] || fItemValue === intervals[3]) &&
                (fItemValue >= intervals[2] || fItemValue === intervals[2])
              ) {
                itemValue = 3;
              }
              if (
                (fItemValue < intervals[2] || fItemValue === intervals[2]) &&
                (fItemValue >= intervals[1] || fItemValue === intervals[1])
              ) {
                itemValue = 2;
              }
              if (
                (fItemValue < intervals[1] || fItemValue === intervals[1]) &&
                (fItemValue >= intervals[0] || fItemValue === intervals[0])
              ) {
                itemValue = 1;
              }
            }
            return {
              ...feature,
              properties: {
                ...feature.properties,
                value: itemValue,
                data: fItem ? fItem : {},
              },
            };
          });

          return {
            maxValue,
            layers: features,
            pins: nonCountrySectorDonors,
          };
        }),
      )
      .catch((error: AxiosError) => {
        console.error(error);
      });
  }
}
