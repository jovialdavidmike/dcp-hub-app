import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';

export const SUPER_ADMINS = ['jovialdavidmike@gmail.com', 'yomieliezer@gmail.com'];

export function calculateRank(impacts: number = 0, comments: number = 0, isSuperAdmin: boolean = false): { score: number, rank: string } {
  const score = impacts + comments;
  if (isSuperAdmin) return { score, rank: 'The Pioneer' };
  
  let rank = 'Tech Apprentice';
  if (score >= 151) rank = 'Tech Legend';
  else if (score >= 51) rank = 'Hub Master';
  else if (score >= 11) rank = 'Tech Specialist';
  return { score, rank };
}

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  role: 'member' | 'admin' | 'banned';
  teams: string[];
  photoURL?: string;
  fcmToken?: string;
  bio?: string;
  lastUsernameChange?: string;
  impactsReceived?: number;
  commentsPosted?: number;
  reputationScore?: number;
  rank?: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  showMasterAdminWelcome: boolean;
  setShowMasterAdminWelcome: (show: boolean) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMasterAdminWelcome, setShowMasterAdminWelcome] = useState(false);

  const isSuperAdmin = user?.email ? SUPER_ADMINS.includes(user.email) : false;
  const isAdmin = isSuperAdmin || userData?.role === 'admin';

  useEffect(() => {
    let unsubscribeDoc: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        let fcmToken = '';
        try {
          if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
              fcmToken = `placeholder-fcm-token-${currentUser.uid}-${Date.now()}`;
            }
          }
        } catch (e) {
          console.error("Error requesting notification permission", e);
        }

        unsubscribeDoc = onSnapshot(userDocRef, async (userDoc) => {
          if (userDoc.exists()) {
            const data = userDoc.data() as UserData;
            const isAdmin = currentUser.email ? SUPER_ADMINS.includes(currentUser.email) : false;
            const { score, rank } = calculateRank(data.impactsReceived || 0, data.commentsPosted || 0, isAdmin);
            setUserData({ ...data, reputationScore: score, rank });
            setLoading(false);
            
            if (fcmToken && data.fcmToken !== fcmToken) {
              await updateDoc(userDocRef, { fcmToken });
            }
          } else {
            const isAdmin = currentUser.email ? SUPER_ADMINS.includes(currentUser.email) : false;
            
            if (isAdmin) {
              setShowMasterAdminWelcome(true);
            }

            const newUserData: UserData = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || '',
              role: isAdmin ? 'admin' : 'member',
              teams: [],
              photoURL: currentUser.photoURL || '',
              fcmToken: fcmToken,
              bio: '',
              lastUsernameChange: '',
              impactsReceived: 0,
              commentsPosted: 0
            };
            await setDoc(userDocRef, {
              ...newUserData,
              createdAt: new Date().toISOString()
            });
          }
        });
      } else {
        if (unsubscribeDoc) unsubscribeDoc();
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, isSuperAdmin, isAdmin, showMasterAdminWelcome, setShowMasterAdminWelcome, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
