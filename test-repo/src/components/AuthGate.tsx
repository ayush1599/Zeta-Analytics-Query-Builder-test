import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SignInForm } from '@/components/auth/SignInForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { Loader2 } from 'lucide-react';

interface AuthGateProps {
  children: React.ReactNode;
}

const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex items-center justify-center">
          <Loader2 className="animate-spin h-16 w-16 text-purple-600" />
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div>
        {/* Logout button will be rendered in PageHeader for alignment */}
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      {isSignUp ? <SignUpForm onSwitchToSignIn={() => setIsSignUp(false)} /> : <SignInForm onSwitchToSignUp={() => setIsSignUp(true)} />}
    </div>
  );
};

export default AuthGate;

export const LogoutButton = ({ onClick, className }: { onClick: () => void; className?: string }) => (
  <button
    onClick={onClick}
    className={`${className} bg-transparent text-purple-600 hover:text-purple-700 font-medium`}
  >
    Logout
  </button>
); 