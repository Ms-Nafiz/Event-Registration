import React, { createContext, useContext, useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [data, setData] = useState({
    donations: [],
    registrations: [],
    groups: [],
    members: [],
    users: [],
  });

  const [loading, setLoading] = useState({
    donations: true,
    registrations: true,
    groups: true,
    members: true,
    users: true,
  });

  useEffect(() => {
    // 1. Listen to Donations
    const qDonations = query(
      collection(db, "donations"),
      orderBy("date", "desc"),
    );
    const unsubDonations = onSnapshot(
      qDonations,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
          firebaseDocId: doc.id,
        }));
        setData((prev) => ({ ...prev, donations: list }));
        setLoading((prev) => ({ ...prev, donations: false }));
      },
      (error) => {
        console.error("Donations listener error:", error);
        setLoading((prev) => ({ ...prev, donations: false }));
      },
    );

    // 2. Listen to Registrations
    const qRegistrations = query(
      collection(db, "registrations"),
      orderBy("createdAt", "desc"),
    );
    const unsubRegistrations = onSnapshot(
      qRegistrations,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
          firebaseDocId: doc.id,
        }));
        setData((prev) => ({ ...prev, registrations: list }));
        setLoading((prev) => ({ ...prev, registrations: false }));
      },
      (error) => {
        console.error("Registrations listener error:", error);
        setLoading((prev) => ({ ...prev, registrations: false }));
      },
    );

    // 3. Listen to Groups
    const unsubGroups = onSnapshot(
      collection(db, "groups"),
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
          firebaseDocId: doc.id,
        }));
        setData((prev) => ({ ...prev, groups: list }));
        setLoading((prev) => ({ ...prev, groups: false }));
      },
      (error) => {
        console.error("Groups listener error:", error);
        setLoading((prev) => ({ ...prev, groups: false }));
      },
    );

    // 4. Listen to Members
    const unsubMembers = onSnapshot(
      collection(db, "members"),
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
          firebaseDocId: doc.id,
        }));
        setData((prev) => ({ ...prev, members: list }));
        setLoading((prev) => ({ ...prev, members: false }));
      },
      (error) => {
        console.error("Members listener error:", error);
        setLoading((prev) => ({ ...prev, members: false }));
      },
    );

    // 5. Listen to Users
    const unsubUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setData((prev) => ({ ...prev, users: list }));
        setLoading((prev) => ({ ...prev, users: false }));
      },
      (error) => {
        console.error("Users listener error:", error);
        setLoading((prev) => ({ ...prev, users: false }));
      },
    );

    return () => {
      unsubDonations();
      unsubRegistrations();
      unsubGroups();
      unsubMembers();
      unsubUsers();
    };
  }, []);

  const isInitialLoadComplete =
    !loading.donations && !loading.registrations && !loading.groups;

  const value = {
    ...data,
    loading,
    isInitialLoadComplete,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
