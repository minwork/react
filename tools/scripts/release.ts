import { releaseChangelog, releasePublish, releaseVersion } from 'nx/release';
import * as yargs from 'yargs';
import * as process from 'node:process';
import { $, execaSync } from 'execa';
import chalk from 'chalk';
import { parseCSV } from 'nx/src/command-line/yargs-utils/shared-options';
import { getProjectRoots } from 'nx/src/utils/command-line-utils';
import { createProjectGraphAsync } from 'nx/src/project-graph/project-graph';
import { getProjects } from 'nx/src/generators/utils/project-configuration';
import { createTree } from 'nx/src/generators/testing-utils/create-tree';
import * as path from 'node:path';
import { ProjectGraph } from 'nx/src/config/project-graph';

(async () => {
  const options = await parseOptions();
  const graph = await createProjectGraphAsync({ exitOnError: true });

  // Get current branch
  const { stdout: branch } = execaSync('git', ['branch', '--show-current']);

  // Determine options based on specifier
  const specifier: string | undefined = options.version ?? (branch === 'main' ? undefined : 'prerelease');
  const isPrerelease = specifier === 'prerelease';
  const preid: string | undefined = isPrerelease ? 'preview' : undefined;
  const tag: string = isPrerelease ? 'preview' : 'latest';

  // Output which branch is used
  console.log(`${chalk.bgBlueBright(chalk.black(' BRANCH '))}  Detecting current git branch\n`);
  console.log(`${chalk.blueBright(branch)} 🔀 Using ${chalk.yellow(preid ?? '[empty]')} preid\n`);

  let projectsList: string[] = options.projects ?? [];

  // Create new version and update changelog if not only publishing
  if (options.publishOnly) {
    console.log(`${chalk.bgCyanBright(chalk.black(' MODE '))}  Publish only, skipping version and changelog\n`);
  } else {
    const { workspaceVersion, projectsVersionData } = await releaseVersion({
      // specifier,
      preid,
      dryRun: options.dryRun,
      verbose: options.verbose,
      projects: options.projects,
    });

    // Filter projects that have new version
    projectsList = Object.entries(projectsVersionData)
      .filter(([project, entry]) => entry.newVersion !== null)
      .map(([project]) => project);

    // If there is no package with new version
    if (projectsList.length === 0) {
      console.log(
        `${chalk.bgYellowBright(
          chalk.black(' VERSION ')
        )}  No changes detected across any package, skipping changelog and publish step altogether\n`
      );
      process.exit(0);
    }

    await releaseChangelog({
      versionData: projectsVersionData,
      version: workspaceVersion,
      dryRun: options.dryRun,
      verbose: options.verbose,
      projects: options.projects,
    });
  }

  // Sync package.json files before release
  syncPackageJson(projectsList, graph);

  // The returned number value from releasePublish will be zero if all projects are published successfully, non-zero if not
  const publishStatus = await releasePublish({
    dryRun: options.dryRun,
    verbose: options.verbose,
    projects: projectsList,
    tag,
    registry: 'https://registry.npmjs.org/',
    otp: options.otp,
  });

  process.exit(publishStatus);
})();

function parseOptions() {
  return yargs
    .version(false) // don't use the default meaning of version in yargs
    .option('version', {
      description: 'Explicit version specifier to use, if overriding conventional commits',
      type: 'string',
    })
    .option('dryRun', {
      alias: 'd',
      description: 'Whether or not to perform a dry-run of the release process, defaults to true',
      type: 'boolean',
      default: true,
    })
    .option('verbose', {
      description: 'Whether or not to enable verbose logging, defaults to false',
      type: 'boolean',
      default: false,
    })
    .options('publishOnly', {
      description: 'Whether or not to only execute publishing step',
      type: 'boolean',
      default: false,
    })
    .option('otp', {
      description: 'One time password for publishing',
      type: 'number',
    })
    .option('projects', {
      type: 'string',
      alias: 'p',
      coerce: parseCSV,
      describe: 'Projects to run. (comma/space delimited project names and/or patterns)',
    })
    .parseAsync();
}

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

function syncPackageJson(projectsList: string[], graph: ProjectGraph) {
  console.log(
    chalk.bgCyan(chalk.black(' SYNC ')),
    `Copy "package.json" files to projects output to sync package version\n`
  );
  const projects = projectsList.map((projectName) => graph.nodes[projectName]);

  const file = 'package.json';
  projects.forEach((project) => {
    const projectRoot = `${project.data.root}`;
    const outputRoot = project.data.targets['build']?.options?.outputPath ?? `dist/${project.data.root}`;
    const color = getColor(project.name);
    console.log(
      color.instance.bold(project.name),
      '📄',
      `Copy ${chalk.yellow('package.json')} from ${chalk.grey(projectRoot)} to ${chalk.green(outputRoot)}`
    );
    $`cp ${path.join(projectRoot, file)} ${path.join(outputRoot, file)}`;
  });
}
