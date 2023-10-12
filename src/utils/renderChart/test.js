import { execSync } from 'child_process';
// console.log('test')
execSync(`node ./src/utils/renderChart/dist/index.cjs new`, {
  timeout: 0,
  stdio: 'pipe',
});
