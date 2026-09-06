import { MessageResponse, NewMessage } from '../../../types/Chat';
import { apiClient } from '../../../utils/handlers';

export const sendMessage = async (
  newMessage: NewMessage,
): Promise<MessageResponse> => {
  return (await apiClient('/api/v2/Chat', {
    method: 'POST',
    body: JSON.stringify(newMessage),
  })) as MessageResponse;
};
