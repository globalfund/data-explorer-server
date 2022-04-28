function formatDateString(item: string) {
  if (
    typeof item === 'string' &&
    new Date(item).toString() !== 'Invalid Date'
  ) {
    return item.split('T')[0];
  }
  return item;
}

export function formatRawData(item: any) {
  const keys = Object.keys(item);
  let parsedItem = {};
  keys.forEach((key: string) => {
    parsedItem = {
      ...parsedItem,
      [key]:
        item[key] === undefined || item[key] === null
          ? ''
          : formatDateString(item[key]),
    };
  });
  return parsedItem;
}
