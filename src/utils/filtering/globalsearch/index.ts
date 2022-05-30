import filteringUtils from '../../../config/filtering/index.json';

export function buildGlobalSearchFilterString(
  fields: string[],
  template: string,
  keywords: string[],
): string {
  const strArray: string[] = [];

  keywords.forEach((keyword: string) => {
    const fieldStrArray: string[] = fields.map((field: string) =>
      template.replace('<field>', field).replace('<value>', `'${keyword}'`),
    );
    strArray.push(`(${fieldStrArray.join(` ${filteringUtils.or_operator} `)})`);
  });

  return strArray.join(` ${filteringUtils.and_operator} `);
}
