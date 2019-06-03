import * as defaults from './defaults';
import { KoaCustomContext, Options, bodyParser, options, proxy } from './middleware';
import Koa from 'koa';

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
      server.listen(
        {
          port,
          host,
        },
        listeningListener && (() => listeningListener(port, host)),
      );
    },
  };
}
