export function stringReplaceKeyValue(
  str: string,
  keysValues: {[key: string]: string},
): string {
  let result = str;

  Object.keys(keysValues).forEach((key: string) => {
    result = result.replace(`<${key}>`, keysValues[key]);
  });

  return result.replace(/null/g, '');
}
