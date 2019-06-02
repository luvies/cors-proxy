import { createCorsProxy } from '../lib';

createCorsProxy({
  url: 'https://plenty.home.t3s.uk',
  port: 8081,
}).start(() => console.log('listening'));
