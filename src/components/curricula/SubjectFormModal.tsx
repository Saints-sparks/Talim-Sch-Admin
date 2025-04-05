'use client';
import React, { useState, useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (subject: { name: string; code: string }) => void;
  initialData?: { name: string; code: string };
  mode: 'add' | 'edit';
}

const SubjectFormModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, initialData, mode }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setCode(initialData.code);
    } else {
      setName('');
      setCode('');
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (name.trim() && code.trim()) {
      onSubmit({ name, code });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white p-6 rounded-md w-[90%] max-w-md text-gray-600">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          {mode === 'add' ? 'Add Subject' : 'Edit Subject'}
        </h2>
        <input
          className="w-full mb-4 border rounded px-3 py-2 "
          type="text"
          placeholder="Subject Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="w-full mb-4 border rounded px-3 py-2"
          type="text"
          placeholder="Subject Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
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

export default SubjectFormModal;
// This component is a modal form for adding or editing subjects in a curriculum management system. It takes in props to control its visibility, handle form submission, and manage initial data for editing. The modal contains input fields for the subject name and code, and buttons to cancel or submit the form. The modal is styled with Tailwind CSS classes for a clean and modern look.