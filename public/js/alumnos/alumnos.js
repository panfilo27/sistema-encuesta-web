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

    // Agregar event listeners (verificando primero que los elementos existan)
    const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', cerrarSesion);
    } else {
        console.warn('Elemento #btn-cerrar-sesion no encontrado');
    }
    
    const btnHistorial = document.getElementById('btn-historial');
    if (btnHistorial) {
        btnHistorial.addEventListener('click', function(e) {
            e.preventDefault();
            alert('La sección de historial de encuestas está en desarrollo.');
        });
    } else {
        console.warn('Elemento #btn-historial no encontrado (esto es normal si no está en la página actual)');
    }
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
        console.log('Limpiando datos de sesión y encuestas...');
        
        // 1. LIMPIAR LOCALSTORAGE COMPLETAMENTE
        console.log(`Limpiando todo el localStorage (${localStorage.length} elementos)`);
        localStorage.clear(); // Limpia todo el localStorage de una vez
        
        // 2. LIMPIAR SESSIONSTORAGE POR SI ACASO
        if (sessionStorage.length > 0) {
            console.log(`Limpiando sessionStorage (${sessionStorage.length} elementos)`);
            sessionStorage.clear();
        }
        
        // 3. LIMPIAR COOKIES RELACIONADAS (si las hay)
        document.cookie.split(';').forEach(cookie => {
            const [name] = cookie.trim().split('=');
            if (name) {
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                console.log(`Cookie eliminada: ${name}`);
            }
        });
        
        // 4. LIMPIAR DATOS ESPECÍFICOS DE ENCUESTAS (por si quedaron)
        try {
            // Limpiar datos específicos de encuestas
            if (window.encuestasDatos) window.encuestasDatos = null;
            if (window.historialEncuestas) window.historialEncuestas = null;
            if (window.encuestaActual) window.encuestaActual = null;
            if (window.currentUser) window.currentUser = null;
            console.log('Variables globales de encuestas limpiadas');
        } catch (e) {
            console.log('No se encontraron variables globales para limpiar:', e);
        }
        
        // 5. CERRAR SESIÓN EN FIREBASE AUTH
        firebase.auth().signOut()
            .then(() => {
                console.log('Sesión cerrada correctamente en Firebase Auth');
                alert('Sesión cerrada y todos los datos eliminados correctamente.');
                // Redirigir a la página de login
                window.location.href = '../auth/login.html';
            })
            .catch((error) => {
                console.error('Error al cerrar sesión en Firebase Auth:', error);
                // Redirigir de todas formas
                alert('Sesión cerrada pero hubo un error con Firebase. Todos los datos locales fueron eliminados.');
                window.location.href = '../auth/login.html';
            });
    }
}
