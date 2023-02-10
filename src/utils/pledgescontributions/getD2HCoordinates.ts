import _ from 'lodash';

export function getD2HCoordinates(name: string, coordinates: any) {
  const result = [];
  const countries = name.split('-').map(c => c.trim());
  const country1 = _.find(
    coordinates,
    c => _.get(c, 'spatialShape.description', '').indexOf(countries[1]) > -1,
  );
  const country2 = _.find(
    coordinates,
    c => _.get(c, 'spatialShape.description', '').indexOf(countries[2]) > -1,
  );
  if (country1 && country2) {
    result.push([
      parseFloat(country1.spatialShape.latitude),
      parseFloat(country1.spatialShape.longitude),
    ]);
    result.push([
      parseFloat(country2.spatialShape.latitude),
      parseFloat(country2.spatialShape.longitude),
    ]);
  }
  return result;
}
