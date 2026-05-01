import { useClerk } from "@clerk/react";
import type { UserProfile } from "@/types";

interface Props {
  user: UserProfile | null;
}

export function OnboardingPage({ user }: Props) {
  const { signOut } = useClerk();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="flex items-center gap-2.5 mb-10">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5">
            <rect x="3" y="4" width="14" height="10" rx="2"/>
            <path d="M7 8h6M7 11h4"/>
            <rect x="7" y="17" width="10" height="3" rx="1.5"/>
          </svg>
        </div>
        <div>
          <div className="font-serif font-semibold text-[16px] text-foreground">GatePass</div>
          <div className="text-[10.5px] text-muted-foreground leading-none">Visitor & Pass Management</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
        <div className="w-14 h-14 bg-orange-50 border border-orange-200 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg viewBox="0 0 24 24" fill="none" stroke="#c06b2c" strokeWidth="2" className="w-7 h-7">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
        </div>

        <h2 className="font-serif text-xl font-semibold text-foreground mb-2">
          Welcome, {user?.name?.split(" ")[0] ?? "there"}!
        </h2>
        <p className="text-[13.5px] text-muted-foreground mb-6 leading-relaxed">
          Your account has been created. You are not yet assigned to a company. Please contact your company's GatePass administrator to get access, or ask them to assign your account.
        </p>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-left mb-6">
          <p className="text-[12px] font-semibold text-primary mb-1">Your registered email:</p>
          <p className="text-[13px] text-foreground font-mono">{user?.email}</p>
          <p className="text-[11.5px] text-muted-foreground mt-2">
            Share this email with your admin so they can assign you to the correct company and office.
          </p>
        </div>

        <button
          onClick={() => signOut()}
          className="btn-ghost w-full justify-center text-[13px]"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
