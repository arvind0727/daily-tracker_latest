import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, writeBatch } from 'firebase/firestore';

// Your Firebase configuration
// REPLACE THESE WITH YOUR ACTUAL FIREBASE CONFIG VALUES
const firebaseConfig = {
  apiKey: "AIzaSyDPpr65cz7TGdESufKxqmvbilVs6h9EY5w",
  authDomain: "lifeplanner-2aef4.firebaseapp.com",
  projectId: "lifeplanner-2aef4",
  storageBucket: "lifeplanner-2aef4.firebasestorage.app",
  messagingSenderId: "33725858041",
  appId: "1:33725858041:web:c05ab8f8ae5ad582e32228"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const db = getFirestore(app);

// Auth functions
export const signUpUser = async (email, password) => {
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const loginUser = async (email, password) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Habit functions
export const addHabit = async (userId, habitData) => {
  try {
    const docRef = await addDoc(collection(db, 'habits'), {
      userId,
      ...habitData,
      completedDates: habitData.completedDates || [],
      createdAt: new Date().toISOString()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding habit:', error);
    return { success: false, error: error.message };
  }
};

export const getHabits = async (userId) => {
  try {
    const q = query(collection(db, 'habits'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting habits:', error);
    return [];
  }
};

export const updateHabit = async (habitId, updates) => {
  try {
    const habitRef = doc(db, 'habits', habitId);
    await updateDoc(habitRef, updates);
    return { success: true };
  } catch (error) {
    console.error('Error updating habit:', error);
    return { success: false, error: error.message };
  }
};

export const deleteHabit = async (habitId) => {
  try {
    await deleteDoc(doc(db, 'habits', habitId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting habit:', error);
    return { success: false, error: error.message };
  }
};

// Meal functions
export const addMeal = async (userId, mealData) => {
  try {
    const docRef = await addDoc(collection(db, 'meals'), {
      userId,
      ...mealData
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding meal:', error);
    return { success: false, error: error.message };
  }
};

export const getMeals = async (userId) => {
  try {
    const q = query(collection(db, 'meals'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.error('Error getting meals:', error);
    return [];
  }
};

// Expense functions
export const addExpense = async (userId, expenseData) => {
  try {
    const docRef = await addDoc(collection(db, 'expenses'), {
      userId,
      ...expenseData
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding expense:', error);
    return { success: false, error: error.message };
  }
};

export const getExpenses = async (userId) => {
  try {
    const q = query(collection(db, 'expenses'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.error('Error getting expenses:', error);
    return [];
  }
};

// Burned calories functions
export const addBurned = async (userId, burnedData) => {
  try {
    const docRef = await addDoc(collection(db, 'burned'), {
      userId,
      ...burnedData
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding burned:', error);
    return { success: false, error: error.message };
  }
};

export const getBurned = async (userId) => {
  try {
    const q = query(collection(db, 'burned'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.error('Error getting burned:', error);
    return [];
  }
};

// Weight functions
export const addWeight = async (userId, weightData) => {
  try {
    const docRef = await addDoc(collection(db, 'weights'), {
      userId,
      ...weightData
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding weight:', error);
    return { success: false, error: error.message };
  }
};

export const getWeights = async (userId) => {
  try {
    const q = query(collection(db, 'weights'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).sort((a, b) => new Date(a.date) - new Date(b.date));
  } catch (error) {
    console.error('Error getting weights:', error);
    return [];
  }
};

export const deleteWeight = async (weightId) => {
  try {
    await deleteDoc(doc(db, 'weights', weightId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting weight:', error);
    return { success: false, error: error.message };
  }
};

// Delete all user data
export const deleteAllUserData = async (userId) => {
  try {
    const batch = writeBatch(db);
    
    // Delete all habits
    const habitsQuery = query(collection(db, 'habits'), where('userId', '==', userId));
    const habitsSnapshot = await getDocs(habitsQuery);
    habitsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    
    // Delete all meals
    const mealsQuery = query(collection(db, 'meals'), where('userId', '==', userId));
    const mealsSnapshot = await getDocs(mealsQuery);
    mealsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    
    // Delete all expenses
    const expensesQuery = query(collection(db, 'expenses'), where('userId', '==', userId));
    const expensesSnapshot = await getDocs(expensesQuery);
    expensesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    
    // Delete all burned
    const burnedQuery = query(collection(db, 'burned'), where('userId', '==', userId));
    const burnedSnapshot = await getDocs(burnedQuery);
    burnedSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    
    // Delete all weights
    const weightsQuery = query(collection(db, 'weights'), where('userId', '==', userId));
    const weightsSnapshot = await getDocs(weightsQuery);
    weightsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Error deleting all user data:', error);
    return { success: false, error: error.message };
  }
};