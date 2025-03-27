import { API_ENDPOINTS } from '../lib/api/config';

interface Complaint {
  ticket: string;
  userId: string;
  subject: string;
  description: string;
  status: string;
  attachment?: string;
}

interface CreateComplaintInput {
  subject: string;
  description: string;
  attachment?: string;
}

const getLocalStorageItem = (key: string) => {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : null;
};

export const complaintService = {
  async createComplaint(complaint: CreateComplaintInput): Promise<Complaint> {
    const userId = getLocalStorageItem('user')?.userId;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      // Generate ticket ID with format TCKT-{4 random numbers}
      const ticketId = `TCKT-${Math.floor(1000 + Math.random() * 9000)}`;
      
      const response = await fetch(API_ENDPOINTS.CREATE_COMPLAINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          ...complaint,
          ticket: ticketId,
          status: 'Pending'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create complaint');
      }

      const data: Complaint = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },

  async getComplaints(): Promise<Complaint[]> {
    const userId = getLocalStorageItem('user')?.userId;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch(API_ENDPOINTS.GET_COMPLAINTS, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch complaints');
      }

      const data: Complaint[] = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },

  async getComplaintByTicket(ticket: string): Promise<Complaint> {
    const userId = getLocalStorageItem('user')?.userId;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch(
        API_ENDPOINTS.GET_COMPLAINT_BY_TICKET.replace(':ticket', ticket),
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch complaint');
      }

      const data: Complaint = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }
};
