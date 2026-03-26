import { ReactNode } from "react";

export type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout(props: AuthLayoutProps) {
  const { children } = props;
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 transition-colors duration-200">
      <div className="flex items-center justify-center bg-white p-6">
        {children}
      </div>
      <div className="hidden md:block bg-primary"></div>
    </div>
  );
}
