const { Command } = require('commander');
const { run, isDev, isProd, promptForTs } = require('../util');

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  const { APP_PACKAGE_ROOT } = process.env;
  cli
    .allowUnknownOption()
    .option('-h, --help')
    .option('--ts-node-dev')
    .action((options) => {
      if (isDev()) {
        promptForTs();
        run('tsx', [
          '--tsconfig',
          './tsconfig.server.json',
          '-r',
          'tsconfig-paths/register',
          `${APP_PACKAGE_ROOT}/src/index.ts`,
          ...process.argv.slice(2),
        ]);
      } else if (isProd()) {
        run('node', [`${APP_PACKAGE_ROOT}/lib/index.js`, ...process.argv.slice(2)]);
      }
    });
};
