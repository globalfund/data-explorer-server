export function getPage(type: string, pageNumber: number, pageSize: number) {
  switch (type) {
    case 'start':
      if (isNaN(pageNumber)) {
        return {
          start: 0,
        };
      }
      return {
        start: (pageNumber > 0 ? pageNumber - 1 : 0) * pageSize,
      };
    default:
      return {
        [type]: pageSize,
      };
  }
}
