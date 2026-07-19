import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyDKkBhebMWeHG8LFSLOiKni_EPFLmTBl1w',
  authDomain: 'neutron-social.firebaseapp.com',
  projectId: 'neutron-social',
  storageBucket: 'neutron-social.firebasestorage.app',
  messagingSenderId: '485377163672',
  appId: '1:485377163672:web:68fc1a64f0c62287daebed',
  measurementId: 'G-4WDYVZQ87D',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export default app
