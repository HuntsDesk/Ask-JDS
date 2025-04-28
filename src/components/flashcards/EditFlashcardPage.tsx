import React from 'react';
import { useParams } from 'react-router-dom';

const EditFlashcardPage = () => {
  const { id } = useParams();
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Edit Flashcard</h1>
      <p className="text-gray-600">Flashcard ID: {id}</p>
      <p className="text-gray-600">This page is under construction. Please check back later.</p>
    </div>
  );
};

export default EditFlashcardPage; 