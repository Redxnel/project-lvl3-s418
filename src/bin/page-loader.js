#!/usr/bin/env node
import program from 'commander';
import info from '../../package.json';
import load from '../load';

program
  .arguments('<page>')
  .description(info.description)
  .version(info.version)
  .option('-o, --output [path]', 'Output path')
  .action(page => load(page, program.output)
    .then(msg => console.log(msg))
    .catch(err => console.log(err)))
  .parse(process.argv);
