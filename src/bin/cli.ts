import * as defaults from '../lib/defaults';
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
    .option('https-port', {
      desc: 'If given, will listen on this port with a HTTPS server as well',
      type: 'number',
    })
    .option('file-key', {
      desc: 'If using HTTPS, this is the file of the private certificate',
      type: 'string',
      default: defaults.fileKey,
    })
    .option('file-crt', {
      desc: 'If using HTTPS, this is the file of the public certificate',
      type: 'string',
      default: defaults.fileCrt,
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
    httpsPort: opts['https-port'],
    fileKey: opts['file-key'],
    fileCrt: opts['file-crt'],
    excludedHeaders: opts['excluded-headers'] && opts['excluded-headers'].map(ex => String(ex)),
  }).start((port, host) => console.log(`Proxying requests from ${host}:${port} to ${opts.url}`));
}

main();
