"use client";

import React from "react";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return <main className="min-h-screen w-full">{children}</main>;
};

export default AuthLayout;
