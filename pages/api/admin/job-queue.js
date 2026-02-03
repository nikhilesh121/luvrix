/**
 * Admin Job Queue API
 * View and manage background job queue
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { 
  getQueueStats, 
  getJobsByStatus, 
  getJob, 
  retryJob, 
  removeJob,
  JOB_STATUS 
} from '../../../lib/jobQueue';

export default async function handler(req, res) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Check admin role
  if (session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }
  
  if (req.method === 'GET') {
    try {
      const { status, jobId, stats } = req.query;
      
      // Get queue statistics
      if (stats === 'true') {
        return res.status(200).json(getQueueStats());
      }
      
      // Get specific job
      if (jobId) {
        const job = getJob(jobId);
        if (!job) {
          return res.status(404).json({ error: 'Job not found' });
        }
        return res.status(200).json(job);
      }
      
      // Get jobs by status
      if (status && Object.values(JOB_STATUS).includes(status)) {
        const jobs = getJobsByStatus(status);
        return res.status(200).json({ jobs, count: jobs.length });
      }
      
      // Default: return stats
      return res.status(200).json(getQueueStats());
    } catch (error) {
      console.error('Error fetching job queue:', error);
      return res.status(500).json({ error: 'Failed to fetch job queue' });
    }
  }
  
  if (req.method === 'POST') {
    try {
      const { action, jobId } = req.body;
      
      if (action === 'retry' && jobId) {
        const job = retryJob(jobId);
        if (!job) {
          return res.status(404).json({ error: 'Job not found or not failed' });
        }
        return res.status(200).json({ success: true, job });
      }
      
      return res.status(400).json({ error: 'Invalid action' });
    } catch (error) {
      console.error('Error processing job action:', error);
      return res.status(500).json({ error: 'Failed to process action' });
    }
  }
  
  if (req.method === 'DELETE') {
    try {
      const { jobId } = req.query;
      
      if (!jobId) {
        return res.status(400).json({ error: 'Job ID required' });
      }
      
      const success = removeJob(jobId);
      if (!success) {
        return res.status(404).json({ error: 'Job not found' });
      }
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error removing job:', error);
      return res.status(500).json({ error: 'Failed to remove job' });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
