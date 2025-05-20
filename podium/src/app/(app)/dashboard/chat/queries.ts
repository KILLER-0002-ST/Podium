import { apiClient } from '~/lib/client'

// Use the same chatbot API function as in the existing implementation
export const sendChatPrompt = async (input_text: string, resume_slug: string): Promise<string> => {
  try {
    const { data } = await apiClient.post('/channels/prompt/', {
      input_text,
      resume_slug
    });
    return data.output;
  } catch (error) {
    console.error('Error sending message to chatbot:', error);
    throw error;
  }
}; 