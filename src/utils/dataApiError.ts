import {AxiosError} from 'axios';

export function handleDataApiError(error: AxiosError) {
  console.error({
    message: error.message,
    config: error.config.url,
  });
}
