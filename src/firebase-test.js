import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

export const testFirebase = async () => {
  try {
    const docRef = await addDoc(collection(db, 'test'), {
      message: 'Hello Firebase!',
      timestamp: new Date()
    });
    console.log('✅ Firebase working! Document ID:', docRef.id);
    alert('Firebase connected successfully!');
  } catch (error) {
    console.error('❌ Firebase error:', error);
    alert('Firebase error: ' + error.message);
  }
};