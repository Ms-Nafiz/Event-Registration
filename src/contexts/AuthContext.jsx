import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase'; // আপনার firebase.js ফাইল থেকে
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile 
} from 'firebase/auth';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ইউজার লগইন আছে কিনা তা চেক করা
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // ১. রেজিস্ট্রেশন ফাংশন (নাম সহ)
  const register = async (name, email, password) => {
    try {
      // ফায়ারবেসে ইউজার তৈরি
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // ইউজারের ডিসপ্লে নেম (Display Name) আপডেট করা
      await updateProfile(userCredential.user, {
        displayName: name
      });

      // লোকাল স্টেট আপডেট (তাৎক্ষণিক নাম দেখানোর জন্য)
      setUser({ ...userCredential.user, displayName: name });
      
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  };

  // ২. লগইন ফাংশন
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // ৩. লগআউট ফাংশন
  const logout = () => {
    return signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};