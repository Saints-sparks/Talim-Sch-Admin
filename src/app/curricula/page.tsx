'use client';
import React, { useState } from 'react';
import { classList } from '@/data/classes';
import { curriculumData } from '@/data/curriculum';

import FloatingHeader from '@/components/curricula/FloatingHeader';
import SubjectsTable from '@/components/curricula/SubjectsTable';
import SubjectFormModal from '@/components/curricula/SubjectFormModal';
import CourseFormModal from '@/components/curricula/CourseFormModal';

const CurriculumPage = () => {
  type CurriculumKeys = keyof typeof curriculumData;
  const [selectedClass, setSelectedClass] = useState<CurriculumKeys | ''>('');
  const [subjects, setSubjects] = useState(curriculumData[selectedClass as CurriculumKeys] || []);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [selectedSubject, setSelectedSubject] = useState<any | null>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
const [courseMode, setCourseMode] = useState<'add' | 'edit'>('add');
const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
const [selectedCourse, setSelectedCourse] = useState<any | null>(null);


  const openAddModal = () => {
    setFormMode('add');
    setSelectedSubject(null);
    setShowFormModal(true);
  };

  const openEditModal = (subject: any) => {
    setFormMode('edit');
    setSelectedSubject(subject);
    setShowFormModal(true);
  };

  const handleAddOrEdit = (data: { name: string; code: string }) => {
    if (formMode === 'add') {
      const newSubject = {
        id: Date.now().toString(),
        ...data,
        courses: [],
      };
      setSubjects((prev) => [...prev, newSubject]);
    } else if (formMode === 'edit' && selectedSubject) {
      setSubjects((prev) =>
        prev.map((subj) =>
          subj.id === selectedSubject.id ? { ...subj, ...data } : subj
        )
      );
    }
  };

  const handleDeleteSubject = (subjectId: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== subjectId));
  };

  const handleAddCourse = (subjectId: string) => {
    setCourseMode('add');
    setSelectedCourse(null);
    setActiveSubjectId(subjectId);
    setShowCourseModal(true);
  };
  
  const handleEditCourse = (subjectId: string, course: { id: string; title: string; description: string }) => {
    setCourseMode('edit');
    setSelectedCourse(course);
    setActiveSubjectId(subjectId);
    setShowCourseModal(true);
  };
  
  const handleSubmitCourse = (courseData: { title: string; description: string }) => {
    if (!activeSubjectId) return;
  
    setSubjects(prevSubjects =>
      prevSubjects.map(subject => {
        if (subject.id !== activeSubjectId) return subject;
  
        if (courseMode === 'add') {
          const newCourse = {
            id: Date.now().toString(),
            ...courseData,
          };
          return { ...subject, courses: [...subject.courses, newCourse] };
        }
  
        if (courseMode === 'edit' && selectedCourse) {
          const updatedCourses = subject.courses.map(c =>
            c.id === selectedCourse.id ? { ...c, ...courseData } : c
          );
          return { ...subject, courses: updatedCourses };
        }
  
        return subject;
      })
    );
  
    setShowCourseModal(false);
    setSelectedCourse(null);
    setActiveSubjectId(null);
  };
  
  const handleDeleteCourse = (subjectId: string, courseId: string) => {
    setSubjects(prevSubjects =>
      prevSubjects.map(subject => {
        if (subject.id !== subjectId) return subject;
  
        const filteredCourses = subject.courses.filter(course => course.id !== courseId);
        return { ...subject, courses: filteredCourses };
      })
    );
  };
  

  return (
    <div>
      <FloatingHeader
        classes={classList}
        selectedClass={selectedClass}
        onSelectClass={(selected) => {
          setSelectedClass(selected as CurriculumKeys);
          setSubjects(curriculumData[selected as CurriculumKeys] || []);
        }}
      />

      <div className="p-6">
        {!selectedClass ? (
          <p className="text-gray-500 text-center mt-20">
            Please select a class to view its curriculum.
          </p>
        ) : (
          <>
            <div className="mb-4 flex justify-end">
              <button
                onClick={openAddModal}
                className="bg-[#154473] hover:bg-blue-900  text-white px-4 py-2 rounded"
              >
                + Add Subject
              </button>
            </div>

            <SubjectsTable
                subjects={subjects}
                onEdit={openEditModal}
                onDelete={handleDeleteSubject}
                onEditCourse={handleEditCourse} 
                onAddCourse={handleAddCourse} 
                onDeleteCourse={handleDeleteCourse}  
                />

          </>
        )}
      </div>

      <SubjectFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSubmit={handleAddOrEdit}
        initialData={selectedSubject || undefined}
        mode={formMode}
      />
<CourseFormModal
  isOpen={showCourseModal}
  onClose={() => {
    setShowCourseModal(false);
    setSelectedCourse(null);
    setActiveSubjectId(null);
  }}
  onSubmit={handleSubmitCourse}
  initialData={selectedCourse || undefined}
  mode={courseMode}
/>

    </div>
  );
};

export default CurriculumPage;
