import React from 'react';
import { useParams } from 'react-router-dom';

const SubjectDetailPage = () => {
  const { subjectId } = useParams();
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Subject Details</h1>
      <p className="text-gray-600">Subject ID: {subjectId}</p>
      <p className="text-gray-600">This page is under construction. Please check back later.</p>
    </div>
  );
};

export default SubjectDetailPage; 