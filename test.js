import { execSync } from 'child_process';
execSync(`node ./src/utils/renderChart/dist/index.cjs new`, {
  timeout: 0,
  stdio: 'pipe',
});
