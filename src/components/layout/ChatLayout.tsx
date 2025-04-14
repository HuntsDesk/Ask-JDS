import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalState } from '../../contexts/GlobalStateContext';

// Define handlers for sidebar actions in the chat context
const handleNewChat = async () => {
  try {
    console.log('ChatLayout: Creating new thread');
    const thread = await createThread();
    if (thread) {
      console.log('ChatLayout: Thread created, ID:', thread.id);
      // Set the thread ID in global state
      setGlobalSelectedThreadId(thread.id);
      // Use React Router navigation instead of direct location change
      navigate(`/chat/${thread.id}`, { replace: true });
    }
  } catch (error) {
    console.error('Failed to create thread:', error);
  }
};

const ChatLayout = () => {
  const navigate = useNavigate();
  const { setGlobalSelectedThreadId } = useGlobalState();

  const handleNewChatCallback = useCallback(handleNewChat, [navigate, setGlobalSelectedThreadId]);

  return (
    <div>
      {/* Rest of the component code */}
    </div>
  );
};

export default ChatLayout; 