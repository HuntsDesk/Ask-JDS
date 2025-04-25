import React from 'react';
import { useParams } from 'react-router-dom';

const StudyResultsPage = () => {
  const { sessionId } = useParams();
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Study Results</h1>
      {sessionId && <p className="text-gray-600">Session ID: {sessionId}</p>}
      <p className="text-gray-600">This page is under construction. Please check back later.</p>
    </div>
  );
};

export default StudyResultsPage; 