#!/usr/bin/env node
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import open from './utils/open_url';
import MainCli from './cli';

const yargsParameters = hideBin(process.argv);

yargs(yargsParameters)
  .scriptName('create-hook')
  .usage('$0')
  .usage('npx $0')
  .wrap(yargs(yargsParameters).terminalWidth())
  .command('changelog', 'Open the tool changelog', () => {}, () => {
    open('https://github.com/hotaydev/git-hook-creator');
  })
  .command('*', 'Create a new git hook', () => {}, () => {
    new MainCli().prompt();
  })
  .help()
  .version()
  .alias('h', 'help')
  .alias('v', 'version')
  .parse();