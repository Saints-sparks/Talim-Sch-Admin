'use client';
import React, { useState, useEffect } from 'react';

interface CourseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (course: { title: string; description: string }) => void;
  initialData?: { title: string; description: string };
  mode: 'add' | 'edit';
}

const CourseFormModal: React.FC<CourseFormModalProps> = ({ isOpen, onClose, onSubmit, initialData, mode }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description);
    } else {
      setTitle('');
      setDescription('');
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (title.trim() && description.trim()) {
      onSubmit({ title, description });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white p-6 rounded-md w-[90%] max-w-md text-gray-600">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          {mode === 'add' ? 'Add Course' : 'Edit Course'}
        </h2>
        <input
          className="w-full mb-4 border rounded px-3 py-2"
          type="text"
          placeholder="Course Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="w-full mb-4 border rounded px-3 py-2"
          placeholder="Course Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="flex justify-end space-x-3">
          <button className="text-gray-600" onClick={onClose}>
            Cancel
          </button>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={handleSubmit}
          >
            {mode === 'add' ? 'Add' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseFormModal;
