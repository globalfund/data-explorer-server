export function stringReplaceKeyValue(
  str: string,
  keysValues: {[key: string]: string},
): string {
  let result = str;

  Object.keys(keysValues).forEach((key: string) => {
    if (key === 'organizationName') {
      if (keysValues[key]) {
        result = result.replace(
          '<geographicAreaName> <organizationName>',
          keysValues[key],
        );
      } else {
        result = result.replace('<organizationName>', '');
      }
    } else {
      result = result.replace(`<${key}>`, keysValues[key]);
    }
  });

  return result.replace(/null/g, '');
}
