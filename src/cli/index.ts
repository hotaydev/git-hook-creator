import * as p from '@clack/prompts';
import path from 'node:path';
import { readFile, writeFile, access, mkdir } from 'node:fs/promises';
import { GitHooks } from '../models/git_hooks';

export default class MainCli {
  private gitHooksScript = 'git config --local core.hooksPath .hooks/';
  private packageJsonPath = path.join(path.dirname(''), 'package.json');
  private hooksFolderPath = path.join(path.dirname(''), '.hooks');

  public async prompt(): Promise<void> {
    p.intro('Welcome to the git hook creator!');

    const hook: string = (await p.select({
      message: 'What hook do you want to create?',
      options: GitHooks.map(hook => {
        return {
          value: hook.hook,
          label: hook.hook,
          hint: hook.link,
        };
      }),
      maxItems: 8,
    })) as string;

    const packageJson = await this.getPackageJson();
    const { scripts } = await this.getPackageJsonContent(packageJson);
    let scriptsChoosed: string[] = [];

    if (!scripts) {
      p.log.info(
        'We couldn\'t find any script in your package.json.\nEnsure you have a script there so we cna include it into your git hook.'
      );
    } else {
      scriptsChoosed = (await p.multiselect({
        message: `Which scripts you want to execute on the ${hook} hook?`,
        options: Object.keys(scripts).map(key => ({
          label: key,
          value: key,
        })),
      })) as string[];
    }

    // TODO: In the future we can choose which of these points need to be shown, based on the current user configuration.
    p.log.info(
      `For it to be done we will:\n- Create a .hooks folder if it doesn't already exist\n- Edit your prepare script in package.json\n- Create the .hooks/${hook} file`
    );

    const okayToContinue = await p.confirm({
      message: 'Do you want to apply changes now?',
    });

    if (!okayToContinue) {
      p.outro('Okay, we will not touch your file system ;)');
      process.exit(0);
    }

    this.createDotHooksFolder();
    this.createPrepareScript();
    this.createHookFile(hook, scriptsChoosed);

    p.outro('Your hooks were added in .hooks folder.');
  }

  private async getPackageJsonContent(
    packageJson: string
  ): Promise<Record<string, any>> {
    return JSON.parse(packageJson);
  }

  private async getPackageJson(): Promise<string> {
    const file = await readFile(this.packageJsonPath, {
      encoding: 'utf-8',
    });

    if (!file) {
      p.log.error(
        'Was not possible to read package.json.\nCheck if you are in a Node.js project folder.'
      );
      process.exit(1);
    }
    return file;
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
    const packageJson = await this.getPackageJson();
    let packageJsonContent = await this.getPackageJsonContent(packageJson);
    const scripts = packageJsonContent.scripts;

    if (!scripts) {
      packageJsonContent.scripts = {};
    }

    if (!packageJsonContent.scripts.prepare) {
      needToWriteFile = true;
      packageJsonContent.scripts.prepare = this.gitHooksScript;
    } else if (
      !packageJsonContent.scripts.prepare.includes(this.gitHooksScript)
    ) {
      needToWriteFile = true;
      packageJsonContent.scripts.prepare =
        packageJsonContent.scripts.prepare + ' && ' + this.gitHooksScript;
    }

    if (needToWriteFile)
      await writeFile(
        this.packageJsonPath,
        JSON.stringify(
          packageJsonContent,
          null,
          this.getIndentation(packageJson)
        )
      );
  }

  private getIndentation(packageJson: string) {
    // capturing the first line break followed by empty spaces
    const match = /\n(\s+)/.exec(packageJson);
    // return either the captured emptyspaces or default
    return match ? match[1] : '  ';
  }

  private async createHookFile(hook: string, scripts: string[]) {
    const firstline = '#!/usr/bin/env sh';
    const lastline = 'git add .';

    const hookPath = path.join(path.dirname(''), '.hooks', hook);
    let file: string;

    try {
      file = await readFile(hookPath, {
        encoding: 'utf-8',
      });

      // TODO: add options to choose what to add/remove from the original hook file
      const willContinue = await p.confirm({
        message: `The file .hooks/${hook} already exists. Do you want to overwrite it?`,
      });

      if (!willContinue) {
        p.outro('Okay, we will not touch your file system ;)');
        process.exit(0);
      }
    } catch (error) {
      file = '';
    }

    const lines: string[] = [];
    if (file)
      lines.push(
        ...file
          .split('\n')
          .filter(
            line => line !== firstline && line !== lastline && line !== ''
          )
      );

    scripts.forEach(script => {
      lines.push(`npm run ${script}`);
    });

    const finalFile = [
      firstline,
      '', // space
      ...lines,
      '', // space
      lastline,
    ];

    await writeFile(hookPath, finalFile.join('\n'));
  }
}
