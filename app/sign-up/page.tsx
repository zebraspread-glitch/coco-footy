"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/login"
      />
    </main>
  );
}