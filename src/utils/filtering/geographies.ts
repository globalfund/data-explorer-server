import fs from 'fs';
import _ from 'lodash';
import path from 'path';
import filtering from '../../config/filtering/index.json';
import locationsBoardConstituencyView from '../../static-assets/locations-board-constituency-view.json';
import locationsPortfolioView from '../../static-assets/locations-portfolio-view.json';
import locationsStandardView from '../../static-assets/locations.json';

interface Item {
  name: string;
  value: string | null;
  items?: Item[];
}

export function getGeographyValues(geos: string[]) {
  const values: string[] = [];
  [
    ...locationsStandardView,
    ...locationsPortfolioView,
    ...locationsBoardConstituencyView,
  ].forEach((region: Item) => {
    const fRegion = _.find(
      geos,
      (g: string) => g === region.name || g === region.value,
    );
    if (fRegion) {
      region.items?.forEach(item => {
        if (item.items) {
          item.items.forEach(subItem => {
            values.push(`'${subItem.value}'`);
          });
        } else {
          values.push(`'${item.value}'`);
        }
      });
    } else {
      region.items?.forEach(item => {
        const fItem = _.find(
          geos,
          (g: string) => g === item.name || g === item.value,
        );
        if (fItem) {
          item.items?.forEach(subItem => {
            values.push(`'${subItem.value}'`);
          });
        }
      });
    }
  });
  return values;
}

export async function GeographyFiltering(
  str: string,
  values: string[],
  mapping: string | string[],
) {
  let LocationsFlat: {value: string; name: string}[] = [];

  const geos = _.filter(values, (o: string) => o.length > 0);

  if (geos.length > 0) {
    await new Promise(resolve => {
      fs.readFile(
        path.join(__dirname, '../../../public/locations-flat.json'),
        'utf8',
        (err, data) => {
          if (err) {
            console.error(err);
          }
          LocationsFlat = JSON.parse(data);
          resolve({});
        },
      );
    });
  }

  const geographies = geos.map((geography: string) => {
    if (geography.length === 3) {
      return geography;
    }
    const fGeography = _.find(
      LocationsFlat,
      o => o.name.toLowerCase() === geography.toLowerCase(),
    );
    if (fGeography) {
      return fGeography.value;
    }
    return geography;
  });

  const gvalues = [
    ...geographies.map((g: string) => `'${g.replace(/'/g, "''")}'`),
    ...getGeographyValues(geographies),
  ];

  if (gvalues.length > 0) {
    const geoMapping = mapping instanceof Array ? mapping : [mapping];
    str += `${str.length > 0 ? ' AND ' : ''}(${geoMapping
      .map(
        m =>
          `${m}${filtering.in}(${gvalues.join(
            filtering.multi_param_separator,
          )})`,
      )
      .join(' OR ')})`;
  }

  return str;
}
