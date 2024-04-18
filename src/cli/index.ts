import * as p from '@clack/prompts';
import path from 'node:path';
import { readFile, writeFile, access, mkdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';

export default class MainCli {
  private packageJsonPath = path.join(path.dirname(''), 'package.json');
  private hooksFolderPath = path.join(path.dirname(''), '.hooks');
  private preCommitPath = path.join(path.dirname(''), '.hooks', 'pre-commit');

  public async prompt(): Promise<void> {
    p.intro('Welcome to the git hook creator!');

    p.log.info('We will create a .hooks folder and edit your prepare script.');
    // seria legal perguntar isso só a primeira vez que rodasse
    const response = await p.confirm({
      message: 'Are you okay with this? Want to continue?',
    });

    if (!response) {
      p.outro('Okay, we will not touch your file system ;)');
      process.exit(0);
    }

    this.createDotHooksFolder();
    this.createPrepareScript();

    const { scripts }: Record<string, string> =
      await this.getPackageJsonContent();

    if (!scripts) {
      p.outro(
        'Could not find a declared scripts section in your package.json. :('
      );
      process.exit(0);
    }

    const selectedScript = await p.select({
      message: 'Select the script you want to add as a hook...',
      options: Object.entries(scripts).map(([key, value]) => ({
        label: key,
        value,
      })),
    });

    const selectedScriptKey = Object.entries(scripts).find(
      ([, value]) => value === selectedScript
    )?.[0];

    if (!selectedScriptKey) {
      p.outro('Could not find execute the selected script!');
      process.exit(0);
    }

    await this.addScriptToPreCommit(selectedScriptKey);

    p.outro('Your hooks were added in .hooks folder.');
  }

  private async getPackageJsonContent() {
    const file = await readFile(this.packageJsonPath, {
      encoding: 'utf-8',
    });

    if (!file) {
      p.log.error(
        'Was not possible to read package.json.\nCheck if you are in a Node.js project folder.'
      );
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
    } else if (
      !packageJson.scripts.prepare.includes(
        'git config --local core.hooksPath .hooks/'
      )
    ) {
      needToWriteFile = true;
      packageJson.scripts.prepare =
        packageJson.scripts.prepare +
        ' && git config --local core.hooksPath .hooks/';
    }

    if (needToWriteFile)
      await writeFile(
        this.packageJsonPath,
        JSON.stringify(packageJson, null, 2)
      );
    // TODO: adjust this writeFile to match the user's identation instead of assuming it's 2
  }

  private async addScriptToPreCommit(selectedScriptKey: string) {
    const file = await readFile(this.preCommitPath, {
      encoding: 'utf-8',
    });

    if (!file) {
      p.log.error(
        'Could not read pre-commit file.\nCheck if .hooks/pre-commit file was created.'
      );
      process.exit(1);
    }

    // Split the file content by lines
    const lines = file.split('\n');

    // Check if git add . already exists in the script
    const gitAddIndex = lines.findIndex(line =>
      line.trim().startsWith('git add .')
    );

    // If git add . exists, remove it from the script
    if (gitAddIndex !== -1) {
      lines.splice(gitAddIndex, 1);
    }

    // Append the new script command
    lines.push(`npm run ${selectedScriptKey}`);

    // Add git add . at the end of the script
    lines.push('\ngit add .');

    // Join the lines back into a single string
    const newFile = lines.join('\n');

    // Write the updated script content back to the file
    await writeFile(this.preCommitPath, newFile);
  }
}
