const commitAnalyzerOptions = {
  preset: 'conventionalcommits',
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
};

function createSemanticReleaseConfig(appName, folder = 'packages/') {
  return {
    name: `${appName}`,
    pkgRoot: `dist/${folder}${appName}`,
    tagFormat: `${appName}-v$\{version}`,
    commitPaths: [`${folder}${appName}/*`, 'package.json', 'nx.json'],
    extends: '../../release.config.js',
    plugins: [
      ['@semantic-release/commit-analyzer', commitAnalyzerOptions],
      [
        '@semantic-release/release-notes-generator',
        {
          ...commitAnalyzerOptions,
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
        },
      ],
      ['@semantic-release/changelog', { changelogFile: `./${folder}${appName}/CHANGELOG.md` }],
      [
        '@semantic-release/npm',
        {
          npmPublish: false,
          pkgRoot: `./dist/${folder}${appName}`,
        },
      ],
      [
        '@semantic-release/git',
        {
          assets: [`./${folder}${appName}/CHANGELOG.md`, `./${folder}${appName}/package.json`],
          message: `chore(release): Release ${appName} v$\{nextRelease.version} [skip ci]`,
        },
      ],
      '@semantic-release/github',
    ],
  };
}

module.exports = {
  createSemanticReleaseConfig,
};
