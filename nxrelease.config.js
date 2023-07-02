module.exports = {
  changelog: true,
  git: true,
  npm: true,
  github: true,
  repositoryUrl: 'https://github.com/minwork/react',
  buildTarget: 'build',
  outputPath: 'dist/packages/${PROJECT_NAME}',
  tagFormat: '${PROJECT_NAME}-v${VERSION}',
  branches: [
    {
      name: 'main',
      channel: 'latest',
    },
    {
      name: 'next',
      channel: 'next',
      prerelease: 'rc',
    },
    {
      name: 'develop',
      channel: 'alpha',
      prerelease: 'alpha',
    },
  ],
  parserOpts: {
    mergePattern: /^Merged in (.*) \(pull request #(\d+)\)$/,
    mergeCorrespondence: ['branch', 'id'],
  },
  releaseRules: [
    { breaking: true, release: 'major' },
    { type: 'docs', release: 'patch' },
    { type: 'refactor', release: 'patch' },
    { type: 'style', release: 'patch' },
    { type: 'perf', release: 'patch' },
    { type: 'build', release: 'patch' },
  ],
  presetConfig: {
    types: [
      { type: 'feat', section: 'Features' },
      { type: 'fix', section: 'Bug Fixes' },
      { type: 'chore', hidden: true },
      { type: 'docs', section: 'Documentation' },
      { type: 'style', hidden: true },
      { type: 'refactor', section: 'Refactors' },
      { type: 'build', section: 'Build config' },
      { type: 'perf', hidden: true },
      { type: 'test', hidden: true },
    ],
  },
};
