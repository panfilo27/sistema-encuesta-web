// Funciones de autenticación

// Función para iniciar sesión
function iniciarSesion(email, password) {
  return auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Usuario ha iniciado sesión exitosamente
      const user = userCredential.user;
      console.log("Usuario ha iniciado sesión:", user.email);
      return user;
    })
    .catch((error) => {
      // Manejo de errores
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error("Error al iniciar sesión:", errorCode, errorMessage);
      throw error;
    });
}

// Función para cerrar sesión
function cerrarSesion() {
  return auth.signOut()
    .then(() => {
      console.log("Usuario ha cerrado sesión");
      // Redirigir a la página de inicio después de cerrar sesión
      window.location.href = '../index.html';
    })
    .catch((error) => {
      console.error("Error al cerrar sesión:", error);
    });
}

// Función para verificar estado de autenticación
function verificarAutenticacion(callback) {
  return auth.onAuthStateChanged((user) => {
    if (user) {
      // Usuario está autenticado
      console.log("Usuario autenticado:", user.email);
      // Obtener información adicional del usuario desde Firestore
      db.collection('usuario').doc(user.uid)
        .get()
        .then((doc) => {
          if (doc.exists) {
            const userData = doc.data();
            const rol = userData.rol || 'alumno'; // Rol por defecto: alumno
            callback(user, rol);
          } else {
            console.log("No se encontró información adicional del usuario");
            callback(user, 'alumno');
          }
        })
        .catch((error) => {
          console.error("Error al obtener información del usuario:", error);
          callback(user, 'alumno');
        });
    } else {
      // Usuario no está autenticado
      console.log("Usuario no autenticado");
      callback(null);
    }
  });
}

// Función para registrar un nuevo usuario (para uso administrativo)
function registrarUsuario(email, password, nombre, rol) {
  return auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Usuario registrado exitosamente
      const user = userCredential.user;
      
      // Guardar información adicional en Firestore
      return db.collection('usuario').doc(user.uid).set({
        nombre: nombre,
        email: email,
        rol: rol,
        fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
      })
      .then(() => {
        console.log("Usuario registrado con éxito:", user.email);
        return user;
      });
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error("Error al registrar usuario:", errorCode, errorMessage);
      throw error;
    });
}

// Función para redirigir según el rol del usuario
function redirigirSegunRol(rol) {
  switch(rol) {
    case 'admin':
      window.location.href = '../admin/dashboard.html';
      break;
    case 'jefedepartamento':
      window.location.href = '../jefes/dashboard.html';
      break;
    case 'alumno':
    default:
      window.location.href = '../alumnos/dashboard.html';
      break;
  }
}
