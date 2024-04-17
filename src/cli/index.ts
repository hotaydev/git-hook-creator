import * as p from '@clack/prompts';
import path from 'node:path';
import { readFile, writeFile, access, mkdir } from 'node:fs/promises';

export default class MainCli {
  private packageJsonPath = path.join(path.dirname(''), 'package.json');
  private hooksFolderPath = path.join(path.dirname(''), '.hooks');

  public async prompt(): Promise<void> {
    p.intro('Welcome to the git hook creator!');

    p.log.info('We will create a .hooks folder and edit your prepare script.');
    const response = await p.confirm({
      message: 'Are you okay with this? Want to continue?'
    });

    if (!response) {
      p.outro('Okay, we will not touch your file system ;)');
      process.exit(0);
    }

    this.createDotHooksFolder();
    this.createPrepareScript();

    // TODO: ask the user to create a a hook, presenting the options.
    // TODO: each of the options will have the option to execute the package.json scripts

    p.outro('Your hooks were created in .hooks folder.');
  }

  private async getPackageJsonContent() {
    const file = await readFile(this.packageJsonPath, {
      encoding: 'utf-8'
    });

    if (!file) {
      p.log.error('Was not possible to read package.json.\nCheck if you are in a Node.js project folder.');
      process.exit(1);
    }

    return JSON.parse(file);
  }

  private async createDotHooksFolder() {
    try {
      await access(this.hooksFolderPath);
    } catch (_) {
      await mkdir(this.hooksFolderPath);
    }
  }

  private async createPrepareScript() {
    let needToWriteFile = false;
    let packageJson = await this.getPackageJsonContent();
    const scripts = packageJson.scripts;

    if (!scripts) {
      packageJson.scripts = {};
    }

    if (!packageJson.scripts.prepare) {
      needToWriteFile = true;
      packageJson.scripts.prepare = 'git config --local core.hooksPath .hooks/';
    } else if (!packageJson.scripts.prepare.includes('git config --local core.hooksPath .hooks/')) {
      needToWriteFile = true;
      packageJson.scripts.prepare = packageJson.scripts.prepare + ' && git config --local core.hooksPath .hooks/';
    }

    if (needToWriteFile) await writeFile(this.packageJsonPath, JSON.stringify(packageJson, null, 2));
    // TODO: adjust this writeFile to match the user's identation instead of assuming it's 2
  }
}
