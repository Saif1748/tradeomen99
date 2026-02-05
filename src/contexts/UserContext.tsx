import { createContext, useContext, useState, ReactNode } from 'react';

export type UserPlan = 'free' | 'pro' | 'premium';
export type UserRole = 'user' | 'tester' | 'founder';

interface UserContextType {
  plan: UserPlan;
  role: UserRole;
  name: string;
  email: string;
  setPlan: (plan: UserPlan) => void;
  setRole: (role: UserRole) => void;
  setName: (name: string) => void;
  setEmail: (email: string) => void;
  isPremiumFeature: (requiredPlan: UserPlan) => boolean;
}

const planHierarchy: Record<UserPlan, number> = {
  free: 0,
  pro: 1,
  premium: 2,
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<UserPlan>('free');
  const [role, setRole] = useState<UserRole>('user');
  const [name, setName] = useState('John Trader');
  const [email, setEmail] = useState('john@tradeomen.com');

  const isPremiumFeature = (requiredPlan: UserPlan): boolean => {
    return planHierarchy[plan] >= planHierarchy[requiredPlan];
  };

  return (
    <UserContext.Provider
      value={{
        plan,
        role,
        name,
        email,
        setPlan,
        setRole,
        setName,
        setEmail,
        isPremiumFeature,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
