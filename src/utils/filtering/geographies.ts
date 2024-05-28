import _ from 'lodash';
import locations from '../../static-assets/locations.json';

export function getGeographyValues(geos: string[]) {
  const values: string[] = [];
  locations.forEach(region => {
    const fRegion = _.find(geos, (g: string) => g === region.name);
    if (fRegion) {
      region.items.forEach(item => {
        if (item.items) {
          item.items.forEach(subItem => {
            values.push(`'${subItem.value}'`);
          });
        }
      });
    } else {
      region.items.forEach(item => {
        const fItem = _.find(geos, (g: string) => g === item.name);
        if (fItem) {
          item.items.forEach(subItem => {
            values.push(`'${subItem.value}'`);
          });
        }
      });
    }
  });
  return values;
}
