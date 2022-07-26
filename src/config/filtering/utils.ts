export function getPage(type: string, pageNumber: number, pageSize: number) {
  switch (type) {
    case 'function-skip':
      if (isNaN(pageNumber)) {
        return {
          $skip: 0,
        };
      }
      return {
        $skip: (pageNumber > 0 ? pageNumber - 1 : 0) * pageSize,
      };
    default:
      return {
        [type]: pageSize,
      };
  }
}
