// original: https://github.com/stegano/next-http-proxy-middleware/blob/master/src/index.ts
// modified
//  - add location rewrite feature
//  - replace status code when it's 30x

import { NextApiResponse, NextApiRequest } from "next";
import httpProxy, { ServerOptions } from "http-proxy";
import https from 'https'
import { URL } from "url";

export interface NextHttpProxyMiddlewareOptions extends ServerOptions {
  pathRewrite?: { [key: string]: string } 
  | { patternStr: string, replaceStr: string }[];
  onProxyInit?: (httpProxy: httpProxy) => void
}

/**
 * Please refer to the following links for the specification document for HTTP.
 * @see https://tools.ietf.org/html/rfc7231
 * @see https://en.wikipedia.org/wiki/Hypertext_Transfer_Protocol
 */
  const hasRequestBodyMethods: string[] = ["HEAD",  "POST", "PUT", "DELETE", "CONNECT", "OPTIONS", "PATCH"];

/**
 * If pattern information matching the input url information is found in the `pathRewrite` array, 
 * the url value is partially replaced with the `pathRewrite.replaceStr` value.
 * @param url
 * @param pathRewrite
 */
export const rewritePath = (
  url: string,
  pathRewrite: NextHttpProxyMiddlewareOptions['pathRewrite']
) => {
  if(Array.isArray(pathRewrite)){
    for (const item of pathRewrite) {
      const {
        patternStr,
        replaceStr
      } = item;
      const pattern = RegExp(patternStr);
      if (pattern.test(url as string)) {
        return url.replace(pattern, replaceStr);
      }
    }
  } else {
    console.warn('[next-http-proxy-middleware] Use array instead of object for \`pathRewrite\` value '
    + '(related issue: https://github.com/stegano/next-http-proxy-middleware/issues/39)');
      for (const patternStr in pathRewrite) {
        const pattern = RegExp(patternStr);
        const path = pathRewrite[patternStr];
        if (pattern.test(url as string)) {
          return url.replace(pattern, path);
        }
      }
  }
  return url;
};

/**
 * Next.js HTTP Proxy Middleware
 * @see https://nextjs.org/docs/api-routes/api-middlewares
 * @param {NextApiRequest} req
 * @param {NextApiResponse} res
 * @param {NextHttpProxyMiddlewareOptions} httpProxyOptions
 */
const httpProxyMiddleware = async (
  req: NextApiRequest,
  res: NextApiResponse,
  httpProxyOptions: NextHttpProxyMiddlewareOptions & { locationRewrite?: NextHttpProxyMiddlewareOptions['pathRewrite'] } = {},
): Promise<any> =>
  new Promise((resolve, reject) => {
    const { pathRewrite, locationRewrite, onProxyInit, ...serverOptions } = httpProxyOptions;

    /**
     * @see https://www.npmjs.com/package/http-proxy
     */
    const proxy: httpProxy = httpProxy.createProxy();

    if(typeof onProxyInit === 'function') {
      onProxyInit(proxy);
    }

    if (pathRewrite) {
      req.url = rewritePath(req.url as string, pathRewrite);
    }

    if (hasRequestBodyMethods.indexOf(req.method as string) >= 0 && typeof req.body === "object") {
      req.body = JSON.stringify(req.body);
    }
    proxy
      .once("proxyReq", ((proxyReq: any, req: any): void => {
        if (hasRequestBodyMethods.indexOf(req.method as string) >= 0 && typeof req.body === "string") {
          proxyReq.write(req.body);
          proxyReq.end();
        }
      }) as any)
      .once("proxyRes", ((proxyRes: any, req: any, res: any): void => {
        if (proxyRes.headers['location'] && locationRewrite) {
            const location = proxyRes.headers['location'].toLowerCase();
            proxyRes.headers['location'] = rewritePath(location, locationRewrite);
            const dst = new URL(location, 'http://localhost/').pathname;
            const src = new URL(proxyRes.req.path, 'http://localhost/').pathname;
            if (proxyRes.req.path.toLowerCase() !== location && !/purchase\/\d+$/i.test(dst) && !/site\/logout$/i.test(src)) {
              if (proxyRes.statusCode === 302 || proxyRes.statusCode === 303 || proxyRes.statusCode === 307) {
                proxyRes.headers['cache-control'] = 'no-store'
              }
              proxyRes.statusCode = 202;
            }
        }
        if (proxyRes.headers['set-cookie'] && proxyRes.headers['set-cookie'].length > 0) {
          proxyRes.headers['set-cookie'] = proxyRes.headers['set-cookie'].map(cookie => {
            if (cookie.startsWith(`${process.env.CBPAAS_AUTH_COOKIE_NAME}=;`)) {
              return `${process.env.CBPAAS_AUTH_COOKIE_NAME}=; max-age=0; path=/; secure; httponly; samesite=lax`;
            }
            return cookie;
          })
        }
        delete proxyRes.headers['content-length'];
        resolve(proxyRes);
      }) as any)
      .once("error", reject)
      .web(req, res, {
        changeOrigin: true,
        ...serverOptions
      });
  });

function commerbleHttpProxyMiddleware(req: NextApiRequest, res: NextApiResponse) {
  const headers = {};
  if (process.env.CBPAAS_AUTHZ) {
    headers['Authorization'] = process.env.CBPAAS_AUTHZ;
  }
  if (process.env.CBPAAS_TEMPLATE_SUFFIX) {
    headers['X-Template-Suffix'] = process.env.CBPAAS_TEMPLATE_SUFFIX;
  }
  return httpProxyMiddleware(req, res, {
    target: process.env.CBPAAS_EP,
    changeOrigin: true,
    headers,
    pathRewrite: [
      {
        patternStr: '^' + process.env.BFF_API_PATH,
        replaceStr: ''
      }
    ],
    locationRewrite: [
      {
        patternStr: '^' + process.env.CBPAAS_EP,
        replaceStr: process.env.BFF_API_PATH
      },
      {
        patternStr: '^' + new URL(process.env.CBPAAS_EP).pathname,
        replaceStr: process.env.BFF_API_PATH
      }
    ],
    agent:new https.Agent({
      rejectUnauthorized: false
    }),
  } as any)
}
  
export default commerbleHttpProxyMiddleware;