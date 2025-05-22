/**
 * Dashboard Alumnos - JavaScript Principal
 * 
 * Este archivo maneja la funcionalidad principal del dashboard de alumnos,
 * incluyendo autenticación, verificación de sesión y cierre de sesión.
 */

// Ejecutar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar la funcionalidad del dashboard
    initDashboard();
});

/**
 * Inicializa el dashboard de alumnos
 */
function initDashboard() {
    // Verificar la sesión del usuario
    verificarSesion();

    // Agregar event listeners
    document.getElementById('btn-cerrar-sesion').addEventListener('click', cerrarSesion);
    document.getElementById('btn-historial').addEventListener('click', function(e) {
        e.preventDefault();
        alert('La sección de historial de encuestas está en desarrollo.');
    });
}

/**
 * Verifica si el usuario tiene una sesión activa
 * y si es un alumno. En caso contrario, redirige a la página de login.
 */
function verificarSesion() {
    // Verificar si hay datos de sesión en localStorage
    const userSession = localStorage.getItem('userSession');
    
    if (!userSession) {
        console.log('No hay sesión activa, redirigiendo a login...');
        window.location.href = '../auth/login.html';
        return;
    }
    
    try {
        const userData = JSON.parse(userSession);
        
        // Verificar si el usuario es alumno
        if (userData.rolUser !== 'alumno') {
            console.error('El usuario no es un alumno, redirigiendo a login...');
            localStorage.removeItem('userSession');
            window.location.href = '../auth/login.html';
            return;
        }
        
        // Mostrar datos del usuario en la interfaz
        mostrarDatosUsuario(userData);
        
        // Verificar Firebase Auth solo para comprobar estado, sin redireccionar automáticamente
        try {
            firebase.auth().onAuthStateChanged(function(user) {
                if (!user) {
                    console.log('Firebase Auth: No hay sesión activa, pero se mantiene la sesión de localStorage');
                    // No eliminar userSession ni redirigir
                } else if (!user.emailVerified) {
                    console.log('Firebase Auth: Email no verificado, pero se mantiene la sesión de localStorage');
                    // No eliminar userSession ni redirigir
                } else {
                    console.log('Firebase Auth: Sesión verificada correctamente');
                }
            });
        } catch (error) {
            console.log('Error al verificar Firebase Auth:', error);
            // No redirigir ni eliminar la sesión por errores en Firebase Auth
        }
        
    } catch (error) {
        console.error('Error al verificar la sesión:', error);
        localStorage.removeItem('userSession');
        window.location.href = '../auth/login.html';
    }
}

/**
 * Muestra los datos del usuario en la interfaz
 * @param {Object} userData - Datos del usuario
 */
function mostrarDatosUsuario(userData) {
    // Mostrar nombre del usuario
    const nombreAlumnoElement = document.getElementById('nombre-alumno');
    const nombreBienvenidaElement = document.getElementById('nombre-bienvenida');
    
    if (nombreAlumnoElement && userData.nombre) {
        nombreAlumnoElement.textContent = userData.nombre;
    }
    
    if (nombreBienvenidaElement && userData.nombre) {
        nombreBienvenidaElement.textContent = userData.nombre;
    }
}

/**
 * Cierra la sesión del usuario y redirige a la página de login
 * @param {Event} e - Evento del click
 */
function cerrarSesion(e) {
    e.preventDefault();
    
    // Mostrar confirmación
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        // Limpiar datos de sesión en localStorage
        localStorage.removeItem('userSession');
        
        // Cerrar sesión en Firebase Auth
        firebase.auth().signOut()
            .then(() => {
                console.log('Sesión cerrada correctamente');
                window.location.href = '../auth/login.html';
            })
            .catch((error) => {
                console.error('Error al cerrar sesión:', error);
                // Redirigir de todas formas
                window.location.href = '../auth/login.html';
            });
    }
}
