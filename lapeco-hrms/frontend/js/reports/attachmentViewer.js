import { leaveAPI } from '../services/api';

/**
 * Fetch the real attachment blob for the given leave.
 * @param {any} doc - Unused jsPDF instance for consistency with other generators
 * @param {{ leaveId: number, documentName?: string }} params
 * @returns {Promise<Blob>} Blob representing the attachment payload
 */
export const viewAttachment = async (doc, params) => {
  try {
    if (!params?.leaveId) {
      throw new Error('Missing leaveId to fetch attachment.');
    }
    const response = await leaveAPI.downloadAttachment(params.leaveId);
    const blob = response?.data;

    // If server returned HTML (e.g., SPA fallback on 404), detect and error
    if (blob && blob.type && blob.type.includes('text/html')) {
      throw new Error('Attachment not found or server returned HTML instead of a file.');
    }
    return blob;
  } catch (error) {
    console.error('Error fetching attachment for viewing:', error);
    throw error;
  }
};