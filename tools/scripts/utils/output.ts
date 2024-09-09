import chalk, { ColorName } from 'chalk';

const colors = [
  { instance: chalk.green, spinnerColor: 'green' },
  { instance: chalk.greenBright, spinnerColor: 'green' },
  { instance: chalk.red, spinnerColor: 'red' },
  { instance: chalk.redBright, spinnerColor: 'red' },
  { instance: chalk.cyan, spinnerColor: 'cyan' },
  { instance: chalk.cyanBright, spinnerColor: 'cyan' },
  { instance: chalk.yellow, spinnerColor: 'yellow' },
  { instance: chalk.yellowBright, spinnerColor: 'yellow' },
  { instance: chalk.magenta, spinnerColor: 'magenta' },
  { instance: chalk.magentaBright, spinnerColor: 'magenta' },
] as const;

function getColor(projectName: string) {
  let code = 0;
  for (let i = 0; i < projectName.length; ++i) {
    code += projectName.charCodeAt(i);
  }
  const colorIndex = code % colors.length;

  return colors[colorIndex];
}

export function colorProjectName(name: string): string {
  return getColor(name).instance.bold(name);
}

export async function suppressOutput<T>(fn: () => T): Promise<T> {
  const originalProcessStdoutWrite = process.stdout.write;
  const originalProcessStderrWrite = process.stderr.write;

  process.stdout.write = () => {
    return false;
  };
  process.stderr.write = () => {
    return false;
  };

  const result = await fn();

  process.stdout.write = originalProcessStdoutWrite;
  process.stderr.write = originalProcessStderrWrite;

  return result;
}

export function printHeader(title: string, color: ColorName): string {
  return chalk.reset.inverse.bold[color](` ${title.toUpperCase()} `);
}
