"use client";

import React from "react";
import Navbar from "../Navbar";
import Sidebar from "../Sidebar";


interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Navbar user={""} title={""} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
