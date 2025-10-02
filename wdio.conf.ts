import type { Options } from '@wdio/types';

export const config: Options.Testrunner = {
  runner: 'local',
  specs: ['./test/e2e/**/*.e2e.ts'],
  maxInstances: 1,
  baseUrl: 'http://localhost:9000',
  capabilities: [{
    browserName: 'chrome',
    'goog:chromeOptions': {
      args: ['--headless=new', '--disable-gpu', '--window-size=1280,800'],
    },
  }],
  logLevel: 'info',
  framework: 'mocha',
  mochaOpts: { ui: 'bdd', timeout: 60000 },
  autoCompileOpts: {
    autoCompile: true,
    tsNodeOpts: {
      transpileOnly: true,
      project: './tsconfig.json',
      files: ['./test/e2e/wdio-globals.d.ts'],
    },
  },
} as Options.Testrunner;




