"use client"

import Header from '@/components/Header'
import UpcomingClasses from '@/components/UpcomingClasses';
import React from 'react'

const page: React.FC = () => {
    const greeting = "Class Creation Reminder";
  const tent = "Don't Forget to Set Up Your Next Class!";
  return (
    <div className="p-6 space-y-1 bg-[F8F8F8]">
        <Header user={greeting} tent={tent} />
        <UpcomingClasses/>
    </div>
  )
}

export default page