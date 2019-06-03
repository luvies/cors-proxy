import * as defaults from './defaults';
import { KoaCustomContext, Options, bodyParser, options, proxy } from './middleware';
import Koa from 'koa';
import fs from 'fs';
import http from 'http';
import https from 'https';
import path from 'path';

export function createCorsProxy(
  opts: Options,
): {
  server: Koa<undefined, KoaCustomContext>;
  start: (listeningListener?: (port: number, host: string) => void) => void;
} {
  const server = new Koa<undefined, KoaCustomContext>();

  server.use(options);
  server.use(bodyParser);
  server.use(ctx => proxy(opts, ctx));

  const port = opts.port || defaults.port;
  const host = opts.host || defaults.host;

  return {
    server,
    start(listeningListener) {
      http
        .createServer(server.callback())
        .listen({ port, host }, listeningListener && (() => listeningListener(port, host)));

      if (opts.httpsPort) {
        const { httpsPort } = opts;
        const key = fs.readFileSync(path.join(process.cwd(), opts.fileKey || defaults.fileKey));
        const cert = fs.readFileSync(path.join(process.cwd(), opts.fileCrt || defaults.fileCrt));

        https
          .createServer({ key, cert }, server.callback())
          .listen(
            { port: httpsPort, host },
            listeningListener && (() => listeningListener(httpsPort, host)),
          );
      }
    },
  };
}
