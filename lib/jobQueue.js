/**
 * Background Job Queue System
 * Using BullMQ patterns with Redis fallback to in-memory
 * 
 * @module lib/jobQueue
 */

// Job statuses
export const JOB_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  FAILED: 'failed',
  DELAYED: 'delayed',
  PAUSED: 'paused',
};

// Job types
export const JOB_TYPES = {
  EMAIL_SEND: 'email:send',
  EMAIL_BULK: 'email:bulk',
  NOTIFICATION_PUSH: 'notification:push',
  NOTIFICATION_BULK: 'notification:bulk',
  INDEX_CONTENT: 'index:content',
  INDEX_SEARCH: 'index:search',
  CACHE_WARM: 'cache:warm',
  CACHE_INVALIDATE: 'cache:invalidate',
  IMAGE_PROCESS: 'image:process',
  REPORT_GENERATE: 'report:generate',
  DATA_EXPORT: 'data:export',
  DATA_CLEANUP: 'data:cleanup',
  RETENTION_ENFORCE: 'retention:enforce',
};

// In-memory queue (use Redis + BullMQ in production)
let jobQueue = [];
let completedJobs = [];
let failedJobs = [];
let jobIdCounter = 0;

// Job processors
const processors = new Map();

/**
 * Add a job to the queue
 * @param {string} type - Job type
 * @param {Object} data - Job data
 * @param {Object} options - Job options
 * @returns {Object} Created job
 */
export async function addJob(type, data, options = {}) {
  const job = {
    id: `job_${++jobIdCounter}_${Date.now()}`,
    type,
    data,
    options: {
      priority: options.priority || 0,
      attempts: options.attempts || 3,
      delay: options.delay || 0,
      backoff: options.backoff || { type: 'exponential', delay: 1000 },
      removeOnComplete: options.removeOnComplete !== false,
      removeOnFail: options.removeOnFail || false,
    },
    status: options.delay > 0 ? JOB_STATUS.DELAYED : JOB_STATUS.PENDING,
    createdAt: new Date().toISOString(),
    attemptsMade: 0,
    processAfter: options.delay > 0 ? Date.now() + options.delay : Date.now(),
  };
  
  // Add to queue sorted by priority and processAfter
  jobQueue.push(job);
  jobQueue.sort((a, b) => {
    if (a.options.priority !== b.options.priority) {
      return b.options.priority - a.options.priority;
    }
    return a.processAfter - b.processAfter;
  });
  
  // Trigger processing
  processNextJob();
  
  return job;
}

/**
 * Add multiple jobs at once
 * @param {Array} jobs - Array of {type, data, options}
 * @returns {Array} Created jobs
 */
export async function addBulkJobs(jobs) {
  return Promise.all(jobs.map(j => addJob(j.type, j.data, j.options)));
}

/**
 * Register a job processor
 * @param {string} type - Job type
 * @param {Function} processor - Processor function
 */
export function registerProcessor(type, processor) {
  processors.set(type, processor);
}

/**
 * Process the next job in queue
 */
async function processNextJob() {
  const now = Date.now();
  
  // Find next pending job that's ready to process
  const jobIndex = jobQueue.findIndex(
    j => j.status === JOB_STATUS.PENDING && j.processAfter <= now
  );
  
  if (jobIndex === -1) return;
  
  const job = jobQueue[jobIndex];
  job.status = JOB_STATUS.ACTIVE;
  job.startedAt = new Date().toISOString();
  job.attemptsMade++;
  
  const processor = processors.get(job.type);
  
  if (!processor) {
    console.error(`No processor registered for job type: ${job.type}`);
    job.status = JOB_STATUS.FAILED;
    job.error = 'No processor registered';
    job.failedAt = new Date().toISOString();
    moveToFailed(job);
    return;
  }
  
  try {
    const result = await processor(job);
    
    job.status = JOB_STATUS.COMPLETED;
    job.completedAt = new Date().toISOString();
    job.result = result;
    
    // Remove from active queue
    jobQueue.splice(jobIndex, 1);
    
    if (!job.options.removeOnComplete) {
      completedJobs.push(job);
      if (completedJobs.length > 1000) {
        completedJobs = completedJobs.slice(-500);
      }
    }
    
    console.log(`Job ${job.id} completed successfully`);
  } catch (error) {
    console.error(`Job ${job.id} failed:`, error);
    
    if (job.attemptsMade < job.options.attempts) {
      // Retry with backoff
      const delay = job.options.backoff.type === 'exponential'
        ? job.options.backoff.delay * Math.pow(2, job.attemptsMade - 1)
        : job.options.backoff.delay;
      
      job.status = JOB_STATUS.DELAYED;
      job.processAfter = Date.now() + delay;
      job.lastError = error.message;
      
      console.log(`Job ${job.id} will retry in ${delay}ms (attempt ${job.attemptsMade}/${job.options.attempts})`);
      
      // Schedule retry
      setTimeout(() => {
        job.status = JOB_STATUS.PENDING;
        processNextJob();
      }, delay);
    } else {
      job.status = JOB_STATUS.FAILED;
      job.error = error.message;
      job.failedAt = new Date().toISOString();
      moveToFailed(job);
    }
  }
  
  // Process next job
  setTimeout(processNextJob, 100);
}

/**
 * Move job to failed queue
 */
function moveToFailed(job) {
  const index = jobQueue.findIndex(j => j.id === job.id);
  if (index !== -1) {
    jobQueue.splice(index, 1);
  }
  
  if (!job.options.removeOnFail) {
    failedJobs.push(job);
    if (failedJobs.length > 500) {
      failedJobs = failedJobs.slice(-250);
    }
  }
}

/**
 * Get job by ID
 * @param {string} jobId - Job ID
 * @returns {Object|null} Job
 */
export function getJob(jobId) {
  return jobQueue.find(j => j.id === jobId)
    || completedJobs.find(j => j.id === jobId)
    || failedJobs.find(j => j.id === jobId)
    || null;
}

/**
 * Get queue statistics
 * @returns {Object} Queue stats
 */
export function getQueueStats() {
  return {
    pending: jobQueue.filter(j => j.status === JOB_STATUS.PENDING).length,
    active: jobQueue.filter(j => j.status === JOB_STATUS.ACTIVE).length,
    delayed: jobQueue.filter(j => j.status === JOB_STATUS.DELAYED).length,
    completed: completedJobs.length,
    failed: failedJobs.length,
    total: jobQueue.length + completedJobs.length + failedJobs.length,
  };
}

/**
 * Get jobs by status
 * @param {string} status - Job status
 * @param {Object} options - Query options
 * @returns {Array} Jobs
 */
export function getJobsByStatus(status, options = {}) {
  const { limit = 50, offset = 0 } = options;
  
  let jobs;
  switch (status) {
    case JOB_STATUS.COMPLETED:
      jobs = completedJobs;
      break;
    case JOB_STATUS.FAILED:
      jobs = failedJobs;
      break;
    default:
      jobs = jobQueue.filter(j => j.status === status);
  }
  
  return jobs.slice(offset, offset + limit);
}

/**
 * Retry a failed job
 * @param {string} jobId - Job ID
 * @returns {Object|null} Retried job
 */
export function retryJob(jobId) {
  const index = failedJobs.findIndex(j => j.id === jobId);
  if (index === -1) return null;
  
  const job = failedJobs.splice(index, 1)[0];
  job.status = JOB_STATUS.PENDING;
  job.attemptsMade = 0;
  job.processAfter = Date.now();
  delete job.error;
  delete job.failedAt;
  
  jobQueue.push(job);
  processNextJob();
  
  return job;
}

/**
 * Remove a job
 * @param {string} jobId - Job ID
 * @returns {boolean} Success
 */
export function removeJob(jobId) {
  let index = jobQueue.findIndex(j => j.id === jobId);
  if (index !== -1) {
    jobQueue.splice(index, 1);
    return true;
  }
  
  index = completedJobs.findIndex(j => j.id === jobId);
  if (index !== -1) {
    completedJobs.splice(index, 1);
    return true;
  }
  
  index = failedJobs.findIndex(j => j.id === jobId);
  if (index !== -1) {
    failedJobs.splice(index, 1);
    return true;
  }
  
  return false;
}

// Register default processors
registerProcessor(JOB_TYPES.EMAIL_SEND, async (job) => {
  console.log(`Sending email to ${job.data.to}`);
  // Simulate email sending
  await new Promise(resolve => setTimeout(resolve, 100));
  return { sent: true, to: job.data.to };
});

registerProcessor(JOB_TYPES.NOTIFICATION_PUSH, async (job) => {
  console.log(`Sending notification to user ${job.data.userId}`);
  await new Promise(resolve => setTimeout(resolve, 50));
  return { sent: true, userId: job.data.userId };
});

registerProcessor(JOB_TYPES.CACHE_INVALIDATE, async (job) => {
  console.log(`Invalidating cache: ${job.data.key}`);
  await new Promise(resolve => setTimeout(resolve, 10));
  return { invalidated: true, key: job.data.key };
});

export default {
  JOB_STATUS,
  JOB_TYPES,
  addJob,
  addBulkJobs,
  registerProcessor,
  getJob,
  getQueueStats,
  getJobsByStatus,
  retryJob,
  removeJob,
};
