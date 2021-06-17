export function getFilterString(params: any, aggregationString: string) {
  return aggregationString
    .replace('<grantId>', `'${params.grantId}'`)
    .replace('<IPnumber>', params.IPnumber)
    .replace('<indicatorSet>', `'${params.indicatorSet}'`)
    .replace('<moduleName>', `'${params.moduleName}'`);
}
