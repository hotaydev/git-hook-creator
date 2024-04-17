import * as p from '@clack/prompts';

export default class MainCli {
  public async prompt(): Promise<void> {
    p.intro('Welcome to the git hook creator!');

    p.outro('Your hooks were created in .hooks folder.');
  }
}
