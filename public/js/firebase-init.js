// Configuración e inicialización de Firebase
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDZx-Nw1Ixm1DAd8YXHt_t_L-GbD-m9w2c",
  authDomain: "sistema-encuesta-b0c4e.firebaseapp.com",
  projectId: "sistema-encuesta-b0c4e",
  storageBucket: "sistema-encuesta-b0c4e.firebasestorage.app",
  messagingSenderId: "1028375320627",
  appId: "1:1028375320627:web:392e6645a34c44f6c92b46",
  measurementId: "G-PL46BFDBL0"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Inicializar Analytics solo si está disponible
try {
    if (firebase.analytics) {
        firebase.analytics();
    }
} catch (error) {
    console.log('Firebase Analytics no está disponible:', error);
}

// Referencias a servicios de Firebase para uso en toda la aplicación
// Eliminamos la referencia a auth ya que no estamos usando Authentication
const db = firebase.firestore();

// Verificar si Storage está disponible antes de usarlo
let storage = null;
try {
    if (firebase.storage) {
        storage = firebase.storage();
    }
} catch (error) {
    console.log('Firebase Storage no está disponible:', error);
}

console.log('Firebase inicializado con Firestore');
