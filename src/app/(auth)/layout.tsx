import AppLogo from "@/components/shared/AppLogo";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import { ReactNode } from "react";

export type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout(props: AuthLayoutProps) {
  const { children } = props;
  return (
    <div className="h-screen grid grid-cols-1 md:grid-cols-2 transition-colors duration-200">
      <div className="bg-background flex flex-col h-full overflow-y-auto text-foreground">
        <header className="flex items-center justify-between py-6 px-4">
          <AppLogo iconSize={32} md={true} />
          <LanguageSwitcher />
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          {children}
        </div>
      </div>

      <div className="hidden md:block bg-brand-primary"></div>
    </div>
  );
}
