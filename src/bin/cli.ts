import { createCorsProxy } from '../lib';
import yargs from 'yargs';

function main(): void {
  const opts = yargs
    .scriptName('cors-proxy')
    .option('url', {
      desc: 'The URL to proxy the requests to',
      type: 'string',
    })
    .demandOption('url')
    .option('port', {
      desc: 'The port to listen on',
      type: 'number',
    })
    .option('host', {
      desc: 'The host to listen on',
      type: 'string',
    })
    .option('excluded-headers', {
      desc: 'Headers to strip out when sending the request to the target URL',
      type: 'array',
    })
    .strict()
    .parse();

  createCorsProxy({
    url: opts.url,
    port: opts.port,
    host: opts.host,
    excludedHeaders: opts['excluded-headers'] && opts['excluded-headers'].map(ex => String(ex)),
  }).start((port, host) => console.log(`Proxying requests from ${host}:${port} to ${opts.url}`));
}

main();
