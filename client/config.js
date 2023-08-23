// Azure Static WebAppsではprocess.env.NEXT_PUBLICプレフィックスに現時点では対応していないため、
// webpackを使用してビルド時点で置換する

export const CBPAAS_ENDPOINT = __CBPAAS_EP__.replace(/\/+$/, '');
export const CBPAAS_PREFIX = new URL(__CBPAAS_EP__).pathname.replace(/\/+$/, '');
export const BFF_PREFIX = __BFF_API_PATH__.replace(/\/+$/, '');