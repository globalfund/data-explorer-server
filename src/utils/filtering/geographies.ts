import _ from 'lodash';
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
    const fRegion = _.find(geos, (g: string) => g === region.name);
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
        const fItem = _.find(geos, (g: string) => g === item.name);
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
