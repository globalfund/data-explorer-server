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
    } else if (result.indexOf('&') > -1) {
      let tmpRes = '';
      const subKeys = result.replace('<', '').replace('>', '').split('&');
      if (subKeys.length > 0) {
        subKeys.forEach((subKey: string) => {
          if (keysValues[subKey]) {
            tmpRes += `${tmpRes ? ' | ' : ''}${result.replace(
              result,
              keysValues[subKey],
            )}`;
          }
        });
        result = tmpRes;
      }
    } else {
      result = result.replace(`<${key}>`, keysValues[key]);
    }
  });

  return result.replace(/null/g, '');
}
