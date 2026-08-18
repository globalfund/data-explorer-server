import {Queue} from 'bullmq';
import {redisConnection} from './redis.connection';
import {PuppeteerAuth} from '../utils/puppeteerAuth';

export const reportQueue = new Queue('report-queue', {
  connection: redisConnection,
});

export const queueReportThumbnailGeneration = async (
  reportId: string,
  auth: PuppeteerAuth = {},
) => {
  const jobId = `report-thumbnail-${reportId}`;

  const existingJob = await reportQueue.getJob(jobId);

  if (existingJob) {
    const state = await existingJob.getState();

    if (state !== 'active') {
      await existingJob.remove();
    }
  }

  return reportQueue.add(
    'screenshot-report',
    {
      reportId,
      ...auth,
      requestedAt: new Date().toISOString(),
    },
    {
      jobId,
      delay: 500,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  );
};

export const queueAssetThumbnailGeneration = async (
  assetId: string,
  auth: PuppeteerAuth = {},
) => {
  const jobId = `asset-thumbnail-${assetId}`;

  const existingJob = await reportQueue.getJob(jobId);

  if (existingJob) {
    const state = await existingJob.getState();

    if (state !== 'active') {
      await existingJob.remove();
    }
  }

  return reportQueue.add(
    'screenshot-asset',
    {
      assetId,
      ...auth,
      requestedAt: new Date().toISOString(),
    },
    {
      jobId,
      delay: 500,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  );
};
