module.exports = {
  repositoryUrl: 'git@github.com:minwork/react.git',
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
};
