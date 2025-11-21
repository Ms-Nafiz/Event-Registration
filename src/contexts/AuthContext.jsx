import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Loader from "../components/common/Loader";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);

      if (currentUser) {
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setUser(currentUser);
            setUserData(data);
          } else {
            setUser(null);
            setUserData(null);
          }
        } catch (error) {
          console.error("Auth fetch error:", error);
          setUser(null);
          setUserData(null);
        }
      } else {
        setUser(null);
        setUserData(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- রেজিস্ট্রেশন ---
  const register = async (name, email, password, mobile, groupId) => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const newUser = userCredential.user;
    await updateProfile(newUser, { displayName: name });

    await setDoc(doc(db, "users", newUser.uid), {
      uid: newUser.uid,
      name: name,
      email: email,
      mobile: mobile,
      groupId: groupId,
      role: "user",
      status: "pending", // Status remains pending in DB for record, but doesn't block login
      createdAt: new Date().toISOString(),
    });

    return newUser;
  };

  // --- লগইন ---
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // --- লগআউট ---
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserData(null);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  // Show loader while initializing
  if (loading) {
    return <Loader />;
  }

  return (
    <AuthContext.Provider
      value={{ user, userData, login, register, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  return useContext(AuthContext);
};
