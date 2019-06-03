import * as defaults from './defaults';
import { ParameterizedContext } from 'koa';
import fetch, { Headers } from 'node-fetch';
import rawBody from 'raw-body';

export interface KoaCustomContext {
  reqBody: Buffer;
}

type KoaContext = ParameterizedContext<undefined & {}, KoaCustomContext>;

export interface Options {
  /**
   * The URL to proxy the requests to.
   */
  url: string;
  /**
   * The port to listen on.
   */
  port?: number;
  /**
   * If given, will listen on this port with a HTTPS server as well.
   */
  httpsPort?: number;
  /**
   * If using HTTPS, this is the file of the private certificate.
   */
  fileKey?: string;
  /**
   * If using HTTPS, this is the file of the public certificate.
   */
  fileCrt?: string;
  /**
   * The host to listen on.
   */
  host?: string;
  /**
   * Headers to strip out when sending the request to the target URL.
   */
  excludedHeaders?: string[];
  /**
   * A callback to use for when a proxy call has finished.
   */
  proxyListener?: () => void;
}

export async function bodyParser(ctx: KoaContext, next: () => Promise<any>): Promise<any> {
  const body = await rawBody(ctx.req);
  ctx.reqBody = body;
  await next();
}

export function cors({ request, response }: KoaContext): any {
  response.set('Access-Control-Allow-Origin', request.get('Origin') || '*');
  response.set('Access-Control-Allow-Credentials', 'true');

  const corsMethods = request.get('Access-Control-Request-Method');
  if (corsMethods) {
    response.set('Access-Control-Allow-Methods', corsMethods);
  } else {
    response.set('Access-Control-Allow-Methods', request.method.toUpperCase());
  }

  const corsHeaders = request.get('Access-Control-Request-Headers');
  if (corsHeaders) {
    response.set('Access-Control-Allow-Headers', corsHeaders);
  } else {
    response.set('Access-Control-Allow-Headers', '*');
  }
}

export function options(ctx: KoaContext, next: () => Promise<any>): any {
  if (ctx.request.method.toUpperCase() === 'OPTIONS') {
    cors(ctx);
    ctx.response.status = 204;
    ctx.response.type = 'plain';
    ctx.response.body = 'OK';
  } else {
    return next();
  }
}

export async function proxy(opts: Options, ctx: KoaContext): Promise<any> {
  const headers = new Headers();

  const excludedHeaders = new Set(
    opts.excludedHeaders
      ? [...opts.excludedHeaders, ...defaults.headerExclude]
      : defaults.headerExclude,
  );
  for (const [header, value] of Object.entries<string>(ctx.request.headers)) {
    if (!excludedHeaders.has(header) && value) {
      headers.set(header, value);
    }
  }

  const resp = await fetch(`${opts.url}${ctx.request.url}`, {
    method: ctx.request.method,
    headers,
    body: ['HEAD', 'GET'].includes(ctx.request.method.toUpperCase()) ? undefined : ctx.reqBody,
  });

  for (const [header, value] of resp.headers) {
    // Servers that send this header do so because the content was compressed
    // in some way, but we already decompress the body, so sending the header
    // causes the browser to fail to decode it.
    if (header !== 'content-encoding') {
      ctx.response.set(header, value);
    }
  }

  cors(ctx);

  ctx.response.body = resp.body;

  if (opts.proxyListener) {
    resp.body.on('finish', opts.proxyListener);
  }
}
