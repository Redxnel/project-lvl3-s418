#!/usr/bin/env node
import program from 'commander';
import info from '../../package.json';
import chalk from 'chalk';
import loadPage from '..';

program
  .arguments('<page>')
  .description(info.description)
  .version(info.version)
  .option('-o, --output [path]', 'Output path', process.cwd())
  .action(page => loadPage(page, program.output)
    .catch((err) => {
      console.error(chalk.red(err.message));
      process.exit(1);
    }))
  .parse(process.argv);
