#!/usr/bin/env node
import program from 'commander';
import info from '../../package.json';
import loadPage from '..';

program
  .arguments('<page>')
  .description(info.description)
  .version(info.version)
  .option('-o, --output [path]', 'Output path', process.cwd())
  .action(page => loadPage(page, program.output)
    .then(filepath => console.log(`Page loaded in ${filepath}`))
    .catch(console.log))
  .parse(process.argv);
