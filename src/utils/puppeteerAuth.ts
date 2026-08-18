import {Page} from 'puppeteer';

export type PuppeteerAuth = {
  authorization?: string;
  apiOrigin?: string;
};

const getAuthorization = (authorization?: string) => {
  const value = authorization?.trim();
  return value && /^Bearer\s+\S+$/i.test(value) ? value : undefined;
};

/**
 * Puppeteer does not share the user's browser storage or Auth0 session.
 * Forward the current request token only to the API origin used by the page.
 */
export const attachPuppeteerAuthorization = async (
  page: Page,
  auth: PuppeteerAuth = {},
) => {
  const authorization = getAuthorization(auth.authorization);
  if (!authorization) {
    throw new Error(
      'Cannot render report screenshot: missing authenticated request token',
    );
  }
  if (!auth.apiOrigin) {
    throw new Error(
      'Cannot render report screenshot: missing authenticated API origin',
    );
  }

  const apiOrigin = new URL(auth.apiOrigin).origin;
  await page.setRequestInterception(true);

  page.on('request', request => {
    const headers = request.headers();

    try {
      if (new URL(request.url()).origin === apiOrigin) {
        headers.authorization = authorization;
      }
    } catch {
      // Let Puppeteer handle non-HTTP URLs without trying to parse them.
    }

    void request.continue({headers}).catch(() => undefined);
  });
};
