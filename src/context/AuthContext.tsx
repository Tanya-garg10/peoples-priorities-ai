import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  signInAnonymously
} from 'firebase/auth';
import { doc, getDoc, setDoc, db } from '../firebase';
import { UserProfile } from '../types';
import { auth, googleProvider } from '../firebase';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithDemo: (role: 'citizen' | 'admin') => Promise<void>;
  logout: () => Promise<void>;
  updateProfileScore: (points: number, badge?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load profile from Firestore or create default
  const fetchOrCreateProfile = async (firebaseUser: FirebaseUser, defaultRole: 'citizen' | 'admin' = 'citizen') => {
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        setProfile(userDoc.data() as UserProfile);
      } else {
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Anonymous',
          photoURL: firebaseUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${firebaseUser.uid}`,
          role: defaultRole,
          contributionScore: 100,
          badges: ['Civic Recruit'],
          createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, newProfile);
        setProfile(newProfile);
      }
    } catch (e) {
      console.error("Error loading user profile:", e);
      // Fallback local profile if Firestore fails
      setProfile({
        uid: firebaseUser.uid,
        email: firebaseUser.email || 'guest@peoplepriorities.org',
        displayName: firebaseUser.displayName || 'Guest Citizen',
        photoURL: firebaseUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=fallback`,
        role: defaultRole,
        contributionScore: 100,
        badges: ['Civic Recruit'],
        createdAt: new Date().toISOString()
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchOrCreateProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await fetchOrCreateProfile(result.user);
      }
    } catch (error) {
      console.error("Google Auth error", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithDemo = async (role: 'citizen' | 'admin') => {
    setLoading(true);
    try {
      // Attempt anonymous Firebase sign-in to get a valid real Firebase Auth token for Firestore security rules
      const userCredential = await signInAnonymously(auth);
      const firebaseUser = userCredential.user;
      
      const mockName = role === 'admin' ? 'Officer Neha Sharma' : 'Rajesh Kumar';
      const mockEmail = role === 'admin' ? 'admin@peoplepriorities.gov' : 'citizen@peoplepriorities.org';
      
      // Assign custom details to the profile in firestore
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      let updatedProfile: UserProfile;
      if (userDoc.exists()) {
        const existingData = userDoc.data() as UserProfile;
        updatedProfile = {
          ...existingData,
          role: role // keep correct role
        };
      } else {
        updatedProfile = {
          uid: firebaseUser.uid,
          email: mockEmail,
          displayName: mockName,
          photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
          role: role,
          contributionScore: 100,
          badges: ['Civic Recruit'],
          createdAt: new Date().toISOString()
        };
      }
      
      await setDoc(userDocRef, updatedProfile);
      setUser(firebaseUser);
      setProfile(updatedProfile);
    } catch (e) {
      console.warn("Real anonymous sign in failed, falling back to fully mock state:", e);
      // Fallback to fully mock local user if anonymous sign in is disabled or offline
      const mockUid = role === 'admin' ? 'demo_admin_id_999' : 'demo_citizen_id_111';
      const mockEmail = role === 'admin' ? 'admin@peoplepriorities.gov' : 'citizen@peoplepriorities.org';
      const mockName = role === 'admin' ? 'Officer Neha Sharma' : 'Rajesh Kumar';
      
      const mockUser = {
        uid: mockUid,
        email: mockEmail,
        displayName: mockName,
        photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${mockUid}`,
        emailVerified: true,
        isAnonymous: false,
        metadata: {},
        providerData: [],
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => 'demo-token',
        getIdTokenResult: async () => ({} as any),
        reload: async () => {},
        toJSON: () => ({})
      } as unknown as FirebaseUser;

      setUser(mockUser);
      await fetchOrCreateProfile(mockUser, role);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfileScore = async (points: number, badge?: string) => {
    if (!user || !profile) return;
    try {
      const updatedScore = profile.contributionScore + points;
      const updatedBadges = [...profile.badges];
      if (badge && !updatedBadges.includes(badge)) {
        updatedBadges.push(badge);
      }

      const updatedProfile = {
        ...profile,
        contributionScore: updatedScore,
        badges: updatedBadges
      };

      setProfile(updatedProfile);

      // Save to firestore
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, updatedProfile, { merge: true });
    } catch (e) {
      console.error("Failed to update profile score:", e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, loginWithGoogle, loginWithDemo, logout, updateProfileScore }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
