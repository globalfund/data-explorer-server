import {inject} from '@loopback/core';
import {
  get,
  Request,
  response,
  ResponseObject,
  RestBindings,
} from '@loopback/rest';
import axios, {AxiosResponse} from 'axios';
import _ from 'lodash';
import {mapTransform} from 'map-transform';
import moment from 'moment';
import querystring from 'querystring';
import filtering from '../config/filtering/index.json';
import performanceframeworkMappingUtilsExpand from '../config/mapping/performanceframework/expand.json';
import performanceframeworkExpandMap from '../config/mapping/performanceframework/expandMap.json';
import performanceframeworkMap from '../config/mapping/performanceframework/index.json';
import performanceframeworkMappingUtils from '../config/mapping/performanceframework/utils.json';
import urls from '../config/urls/index.json';
import {
  PFIndicator,
  PFIndicatorResult,
  PFIndicatorResultDisaggregationGroup,
  PFIndicatorResultIntervention,
  PFIndicatorResultInterventionValue,
} from '../interfaces/performanceFrameworkNetwork';
import {handleDataApiError} from '../utils/dataApiError';
import {getFilterString} from '../utils/filtering/performanceframework/getFilterString';
import {
  formatPFData,
  getAchievementRateLegendValues,
  getColorBasedOnValue,
} from '../utils/performanceframework/formatPFData';
import {getTimeframeGroups} from '../utils/performanceframework/getTimeframes';

const PERFORMANCE_FRAMEWORK_RESPONSE: ResponseObject = {
  description: 'Performance Framework Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'PerformanceFrameworkResponse',
        properties: {
          count: {type: 'integer'},
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                year: {type: 'string'},
                rating: {type: 'number'},
              },
            },
          },
        },
      },
    },
  },
};

export class PerformanceframeworkController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  @get('/performance-framework')
  @response(200, PERFORMANCE_FRAMEWORK_RESPONSE)
  performancerating(): object {
    if (!this.req.query.grantId || !this.req.query.IPnumber) {
      return {
        data: [],
        message: '"grantId" and "IPnumber" parameters are required.',
      };
    }
    const filterString = getFilterString(
      this.req.query,
      `${performanceframeworkMappingUtils.defaultSelect}${performanceframeworkMappingUtils.defaultExpand}${performanceframeworkMappingUtils.defaultFilter}`,
    );
    const mapper = mapTransform(performanceframeworkMap);
    const params = querystring.stringify(
      {},
      '&',
      filtering.param_assign_operator,
      {
        encodeURIComponent: (str: string) => str,
      },
    );
    const url = `${urls.performanceframework}/?${filterString}&${params}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const mappedData = mapper(resp.data) as never[];
        if (mappedData.length === 0) {
          return {
            data: {
              nodes: [],
              links: [],
            },
            periods: [],
            timeframes: [],
          };
        }
        const timeframes = getTimeframeGroups(mappedData);

        const timeframeIndexParam = this.req.query.timeframeIndex
          ? parseInt(this.req.query.timeframeIndex.toString(), 10)
          : 0;
        let selectedTimeframes = [];

        if (
          timeframeIndexParam < 0 ||
          timeframeIndexParam > timeframes.length - 1
        ) {
          selectedTimeframes = [
            {
              raw: timeframes[0].start,
              formatted: timeframes[0].startFormatted,
              number: new Date(timeframes[0].start).getTime(),
            },
            {
              raw: timeframes[0].end,
              formatted: timeframes[0].endFormatted,
              number: new Date(timeframes[0].end).getTime(),
            },
          ];
        } else {
          selectedTimeframes = [
            {
              raw: timeframes[timeframeIndexParam].start,
              formatted: timeframes[timeframeIndexParam].startFormatted,
              number: new Date(timeframes[timeframeIndexParam].start).getTime(),
            },
            {
              raw: timeframes[timeframeIndexParam].end,
              formatted: timeframes[timeframeIndexParam].endFormatted,
              number: new Date(timeframes[timeframeIndexParam].end).getTime(),
            },
          ];
        }

        const data = formatPFData(mappedData, selectedTimeframes);

        const periods: string[][] = timeframes.map((group: any) => [
          group.startFormatted,
          group.endFormatted,
        ]);

        return {
          data,
          periods,
          timeframes,
        };
      })
      .catch(handleDataApiError);
  }

  @get('/performance-framework/expand')
  @response(200, PERFORMANCE_FRAMEWORK_RESPONSE)
  performanceratingexpand(): object {
    if (
      !this.req.query.indicatorSet ||
      !this.req.query.moduleName ||
      !this.req.query.grantId ||
      !this.req.query.IPnumber
    ) {
      return {
        data: [],
        message: 'Invalid parameters',
      };
    }
    const filterString = getFilterString(
      this.req.query,
      `${performanceframeworkMappingUtilsExpand.defaultSelect}${performanceframeworkMappingUtilsExpand.defaultExpand}${performanceframeworkMappingUtilsExpand.defaultFilter}`,
    );
    const mapper = mapTransform(performanceframeworkExpandMap);
    const params = querystring.stringify(
      {},
      '&',
      filtering.param_assign_operator,
      {
        encodeURIComponent: (str: string) => str,
      },
    );
    const url = `${urls.performanceframework}/?${filterString}&${params}`;

    return axios
      .get(url)
      .then((resp: AxiosResponse) => {
        const mappedData = mapper(resp.data) as never[];

        const groupedByIndicatorName = _.groupBy(mappedData, 'indicatorName');

        const indicators: PFIndicator[] = [];
        const interventions: PFIndicatorResultIntervention[] = [];
        Object.keys(groupedByIndicatorName).forEach((indicatorName: string) => {
          const instance = groupedByIndicatorName[indicatorName];
          const groupedByStartDate = _.groupBy(instance, 'startDate');
          const results: PFIndicatorResult[] = [];
          const sortedDates = _.filter(
            Object.keys(groupedByStartDate),
            (date: string) => date !== 'undefined' && date !== 'null',
          )
            .sort(
              (a: string, b: string) =>
                moment(a).valueOf() - moment(b).valueOf(),
            )
            .reverse();
          sortedDates.forEach((startDate: string) => {
            if (startDate !== 'undefined' && startDate !== 'null') {
              const dateInstance = groupedByStartDate[startDate];

              const baselineInstance: any =
                _.find(instance, {
                  valueType: 'Baseline',
                }) ?? {};
              const targetInstance: any =
                _.find(dateInstance, {valueType: 'Target'}) ?? {};
              const resultInstance: any =
                _.find(dateInstance, {valueType: 'Result'}) ?? {};

              const disaggregations: PFIndicatorResultDisaggregationGroup[] =
                baselineInstance.disaggregationGroup
                  ? [
                      {
                        name: baselineInstance.disaggregationGroup,
                        values: [
                          {
                            category: baselineInstance.disaggregationValue,
                            baseline: {
                              numerator: baselineInstance.valueNumerator,
                              denominator: baselineInstance.valueDenominator,
                              percentage: baselineInstance.valuePercentage,
                            },
                            reported: {
                              numerator: resultInstance.valueNumerator,
                              denominator: resultInstance.valueDenominator,
                              percentage: resultInstance.valuePercentage,
                            },
                          },
                        ],
                      },
                    ]
                  : [];
              const achievementRate =
                this.req.query.moduleName === 'Process indicator / WPTM'
                  ? resultInstance.valueNumerator ||
                    targetInstance.valueNumerator
                  : resultInstance.valueAchievementRate ||
                    targetInstance.valueAchievementRate;

              results.push({
                type: 'Percentage',
                baseline: !_.isEmpty(baselineInstance)
                  ? baselineInstance.valuePercentage
                    ? `${baselineInstance.valuePercentage}%`
                    : null
                  : null,
                target: !_.isEmpty(targetInstance)
                  ? targetInstance.valuePercentage
                    ? `${targetInstance.valuePercentage}%`
                    : null
                  : null,
                result: !_.isEmpty(resultInstance)
                  ? resultInstance.valuePercentage
                    ? `${resultInstance.valuePercentage}%`
                    : null
                  : null,
                achievementRate,
                color: getColorBasedOnValue(
                  achievementRate,
                  getAchievementRateLegendValues(),
                  resultInstance.isIndicatorReversed ||
                    targetInstance.isIndicatorReversed,
                  this.req.query.moduleName === 'Process indicator / WPTM',
                  resultInstance,
                ),
                period: `${(
                  resultInstance.startDate || targetInstance.startDate
                ).slice(0, 10)}:${(
                  resultInstance.endDate || targetInstance.endDate
                ).slice(0, 10)}`,
                isReversed:
                  resultInstance.isIndicatorReversed ||
                  targetInstance.isIndicatorReversed
                    ? 'Yes'
                    : 'No',
                aggregationType:
                  resultInstance.indicatorAggregationTypeName ||
                  targetInstance.indicatorAggregationTypeName,
                coverage:
                  resultInstance.geographicCoverage ||
                  targetInstance.geographicCoverage,
                disaggregations,
              });
            }
          });
          indicators.push({
            name: indicatorName,
            results,
          });
          const instanceInterventions = _.filter(
            instance,
            (item: any) => item.intervention && item.valueText,
          );
          if (instanceInterventions.length > 0) {
            interventions.push({
              name: indicatorName,
              values: _.uniqBy(
                instanceInterventions.map((item: any) => ({
                  name: item.intervention,
                  achievementRate: item.valueAchievementRate,
                  valueText: item.valueText,
                })),
                (item: PFIndicatorResultInterventionValue) =>
                  `${item.name}-${item.achievementRate}-${item.valueText}`,
              ),
            });
          }
        });

        return {
          indicators,
          interventions,
        };
      })
      .catch(handleDataApiError);
  }
}
