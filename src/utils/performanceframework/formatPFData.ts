import _ from 'lodash';
import performanceframeworkMappingUtils from '../../config/mapping/performanceframework/utils.json';

const rateColors = performanceframeworkMappingUtils.valueAchievementRateColors;

const indicatorSetOrder = performanceframeworkMappingUtils.indicatorSetOrder;

export function getColorBasedOnValue(
  value: number,
  rates: {value: number; color: string}[],
  isReversed: boolean,
  isWPTM: boolean,
  result: any,
) {
  if (value === null && !result) return '#fff';
  if (isWPTM) {
    if (value === 1) return !isReversed ? rateColors[0] : rateColors[4];
    if (value === 2) return rateColors[2];
    if (value === 3) return !isReversed ? rateColors[4] : rateColors[0];
    return '#E2E2E2';
  }
  if (rates.length === 6) {
    if (
      (rates[0].value < value || rates[0].value === value) &&
      rates[1].value > value
    ) {
      return !isReversed ? rates[0].color : rates[4].color;
    }
    if (
      (rates[1].value < value || rates[1].value === value) &&
      rates[2].value > value
    ) {
      return !isReversed ? rates[1].color : rates[3].color;
    }
    if (
      (rates[2].value < value || rates[2].value === value) &&
      rates[3].value > value
    ) {
      return rates[2].color;
    }
    if (
      (rates[3].value < value || rates[3].value === value) &&
      rates[4].value > value
    ) {
      return !isReversed ? rates[3].color : rates[1].color;
    }
    if (
      (rates[4].value < value || rates[4].value === value) &&
      rates[5].value > value
    ) {
      return !isReversed ? rates[4].color : rates[1].color;
    }
    if (
      (rates[5].value < value || rates[5].value === value) &&
      rates[6].value > value
    ) {
      return !isReversed ? rates[5].color : rates[1].color;
    }
    if (
      (rates[6].value < value || rates[6].value === value) &&
      (rates[7].value > value || rates[7].value === value)
    ) {
      return !isReversed ? rates[6].color : rates[1].color;
    }
  }
  return '#E2E2E2';
}

function getAchievementRateLegendValues() {
  return [
    {
      value: 0,
      color: rateColors[0],
    },
    {
      value: 0.2,
      color: rateColors[1],
    },
    {
      value: 0.4,
      color: rateColors[2],
    },
    {
      value: 0.6,
      color: rateColors[3],
    },
    {
      value: 0.8,
      color: rateColors[4],
    },
    {
      value: 1,
      color: rateColors[5],
    },
    {
      value: 1.2,
      color: rateColors[6],
    },
    {
      value: 1.4,
      color: rateColors[7],
    },
  ];
}

export function formatPFData(
  rawData: {
    indicatorSet: string;
    indicatorName: string;
    startDate: string;
    endDate: string;
    disaggregationGroup: string | null;
    disaggregationValue: string | number | null;
    valueType: string;
    valueAchievementRate: string | number | null;
    module: string;
    intervention?: string;
  }[],
  selectedTimeframe: {
    raw: string;
    formatted: string;
    number: number;
  }[],
) {
  const nodes: {id: string; [key: string]: any}[] = [];
  const links: {source: string; target: string; [key: string]: any}[] = [];

  let data: any[] = [];
  let filteredRawData = rawData;

  if (selectedTimeframe) {
    nodes.push({
      id: `${selectedTimeframe[0].formatted} - ${selectedTimeframe[1].formatted}`,
      radius: 12,
      depth: 0,
      color: '#262C34',
      borderColor: '#ADB5BD',
    });
    filteredRawData = _.filter(rawData, dataIns => {
      if (dataIns.disaggregationValue && dataIns.disaggregationGroup)
        return false;
      if (dataIns.valueType === 'Baseline') return true;
      const date1 = new Date(dataIns.startDate).getTime();
      const date2 = new Date(dataIns.endDate).getTime();
      if (
        (date1 === selectedTimeframe[0].number ||
          date1 < selectedTimeframe[0].number) &&
        (date2 === selectedTimeframe[1].number ||
          date2 > selectedTimeframe[1].number)
      ) {
        return true;
      }
      return false;
    });
  }

  const groupedByIndicatorSet = _.groupBy(filteredRawData, 'indicatorSet');
  Object.keys(groupedByIndicatorSet).forEach(indicatorSetKey => {
    const instance = groupedByIndicatorSet[indicatorSetKey];
    const groupedByActivityAreaModule = _.groupBy(instance, 'module');
    const children: any[] = [];
    Object.keys(groupedByActivityAreaModule).forEach(activityAreaModuleKey => {
      // indicator names
      const grandChildren: any[] = [];
      const groupedByIndicatorName = _.groupBy(
        groupedByActivityAreaModule[activityAreaModuleKey],
        'indicatorName',
      );
      Object.keys(groupedByIndicatorName).forEach(indicatorNameKey => {
        const targetInstance = _.find(
          groupedByIndicatorName[indicatorNameKey],
          {
            valueType: 'Target',
          },
        );
        const resultInstance = _.find(
          groupedByIndicatorName[indicatorNameKey],
          {
            valueType: 'Result',
          },
        );
        const baselineInstance = _.find(
          groupedByIndicatorName[indicatorNameKey],
          {
            valueType: 'Baseline',
          },
        );
        const targetAchievementRate = _.get(
          targetInstance,
          'valueAchievementRate',
          null,
        );
        const resultAchievementRate = _.get(
          resultInstance,
          'valueAchievementRate',
          null,
        );
        const baselineAchievementRate = _.get(
          baselineInstance,
          'valueAchievementRate',
          null,
        );
        grandChildren.push({
          name: indicatorNameKey,
          target: {
            instance: targetInstance,
            achievementRate: targetAchievementRate,
          },
          result: {
            instance: resultInstance,
            achievementRate: resultAchievementRate,
          },
          baseline: {
            instance: baselineInstance,
            achievementRate: baselineAchievementRate,
          },
        });
      });
      // interventions
      const groupedByActivityAreaIntervention = _.groupBy(
        instance,
        'activityAreaIntervention.activityAreaName',
      );
      const interventions: any[] = [];
      Object.keys(groupedByActivityAreaIntervention).forEach(
        interventionKey => {
          if (interventionKey !== 'undefined') {
            const groupedByIndicatorName2 = _.groupBy(
              groupedByActivityAreaIntervention[interventionKey],
              'indicatorName',
            );
            Object.keys(groupedByIndicatorName2).forEach(indicatorNameKey => {
              interventions.push({
                name: interventionKey,
                indicator: indicatorNameKey,
              });
            });
          }
        },
      );
      children.push({
        name:
          activityAreaModuleKey !== 'undefined'
            ? activityAreaModuleKey
            : 'Other',
        count: groupedByActivityAreaModule[activityAreaModuleKey].length,
        children: _.sortBy(grandChildren, 'name'),
        interventions: _.sortBy(interventions, 'name'),
      });
    });

    data.push({
      name: indicatorSetKey,
      count: instance.length,
      children: _.sortBy(children, 'name'),
    });
  });

  const achievementRatesLegendValues = getAchievementRateLegendValues();
  data = data
    .sort(
      (a, b) =>
        _.get(indicatorSetOrder, a.name, 0) -
        _.get(indicatorSetOrder, b.name, 0),
    )
    .map(set => ({
      ...set,
      children: set.children.map((aaModule: any) => ({
        ...aaModule,
        children: aaModule.children.map((indicator: any) => ({
          ...indicator,
          color: getColorBasedOnValue(
            aaModule.name === 'Process indicator / WPTM'
              ? indicator.result.valueNumerator ||
                  indicator.target.valueNumerator
              : indicator.result.achievementRate ||
                  indicator.target.achievementRate,
            achievementRatesLegendValues,
            _.get(indicator.result, 'instance.isIndicatorReversed', false) ||
              _.get(indicator.target, 'instance.isIndicatorReversed', false),
            aaModule.name === 'Process indicator / WPTM',
            indicator.result.instance,
          ),
          target: {
            ...indicator.target,
            color: getColorBasedOnValue(
              aaModule.name === 'Process indicator / WPTM'
                ? indicator.target.valueNumerator
                : indicator.target.achievementRate,
              achievementRatesLegendValues,
              _.get(indicator.target, 'instance.isIndicatorReversed', false),
              aaModule.name === 'Process indicator / WPTM',
              indicator.target.instance,
            ),
          },
          result: {
            ...indicator.result,
            color: getColorBasedOnValue(
              aaModule.name === 'Process indicator / WPTM'
                ? indicator.result.valueNumerator
                : indicator.result.achievementRate,
              achievementRatesLegendValues,
              _.get(indicator.result, 'instance.isIndicatorReversed', false),
              aaModule.name === 'Process indicator / WPTM',
              indicator.result.instance,
            ),
          },
          baseline: {
            ...indicator.baseline,
            color: getColorBasedOnValue(
              aaModule.name === 'Process indicator / WPTM'
                ? indicator.baseline.valueNumerator
                : indicator.baseline.achievementRate,
              achievementRatesLegendValues,
              _.get(indicator.baseline, 'instance.isIndicatorReversed', false),
              aaModule.name === 'Process indicator / WPTM',
              indicator.baseline.instance,
            ),
          },
        })),
      })),
    }));

  data.forEach((indicatorSet: any) => {
    nodes.push({
      id: indicatorSet.name,
      radius: 12,
      depth: 1,
      color: '#ADB5BD',
      borderColor: '#262C34',
    });
    links.push({
      source: nodes[0].id,
      target: indicatorSet.name,
      distance: 10,
    });
    indicatorSet.children.forEach((module: any) => {
      const moduleId = `${module.name}|${indicatorSet.name}`;
      nodes.push({
        id: moduleId,
        radius: 12,
        depth: 2,
        color: '#fff',
        borderColor: '#262C34',
      });
      links.push({
        source: indicatorSet.name,
        target: moduleId,
        distance: 60,
      });
      module.children.forEach((indicator: any) => {
        nodes.push({
          id: indicator.name,
          radius: 12,
          depth: 3,
          color: indicator.color,
          borderColor: '#262C34',
        });
        links.push({
          source: moduleId,
          target: indicator.name,
          distance: 70,
        });
      });
    });
  });

  return {
    nodes: _.orderBy(_.uniqBy(nodes, 'id'), 'depth', 'asc'),
    links,
    // achievementRatesLegends: achievementRatesLegendValues,
  };
}
