import { ProjectGraph } from 'nx/src/config/project-graph';
import chalk from 'chalk';
import { colorProjectName } from '../utils/output';
import { $ } from 'execa';
import * as path from 'node:path';

export function syncPackageJson(projectsList: string[], graph: ProjectGraph) {
  console.log(
    chalk.bgCyan(chalk.black(' SYNC ')),
    `Copy "package.json" files to projects output to sync package version\n`
  );
  const projects = projectsList.map((projectName) => graph.nodes[projectName]);

  const file = 'package.json';
  projects.forEach((project) => {
    const projectRoot = `${project.data.root}`;
    const outputRoot = project.data.targets?.['build']?.options?.outputPath ?? `dist/${project.data.root}`;
    console.log(
      colorProjectName(project.name),
      '📄',
      `Copy ${chalk.yellow('package.json')} from ${chalk.grey(projectRoot)} to ${chalk.green(outputRoot)}`
    );
    $`cp ${path.join(projectRoot, file)} ${path.join(outputRoot, file)}`;
  });
}
