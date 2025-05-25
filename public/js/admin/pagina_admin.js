const mainPanel = document.querySelector('.main_panel');
const contenidoInicial = mainPanel.innerHTML;

document.getElementById("logo-itver").addEventListener("click", () => {
    mainPanel.innerHTML = contenidoInicial;
});

const rutas = {
    'btn-carreras': "opciones_admin/carreras.html",
    'btn-personal': "opciones_admin/personal.html",
    'btn-alumnos': "opciones_admin/alumnos.html",
    'btn-resultados': "opciones_admin/resultados.html",
    'btn-avisos': "opciones_admin/avisos.html",
    'btn-crear-encuestas': "opciones_admin/crear_encuestas/crear_encuestas.html"
};

Object.keys(rutas).forEach(id => {
    const btn = document.getElementById(id);
    btn.addEventListener('click', async () => {
        try {
            const respuesta = await fetch(rutas[id]);
            if (!respuesta.ok) {
                throw new Error(`Error al cargar ${rutas[id]}: ${respuesta.statusText}`);
            }
            mainPanel.innerHTML = await respuesta.text();

            const script = document.createElement("script");

            switch (id) {
                case 'btn-alumnos':
                    // Cargar primero el script principal de alumnos
                    script.src = "../js/admin/opciones_admin/alumnos.js";
                    script.onload = () => {
                        // Cargar scripts adicionales
                        const scriptHistorial = document.createElement('script');
                        scriptHistorial.src = "../js/admin/opciones_admin/alumnos/historial.js";
                        document.body.appendChild(scriptHistorial);
                        
                        const scriptEncuesta = document.createElement('script');
                        scriptEncuesta.src = "../js/admin/opciones_admin/alumnos/encuesta.js";
                        document.body.appendChild(scriptEncuesta);
                        
                        // Cargar el script del filtro de encuestas
                        const scriptFiltroEncuesta = document.createElement('script');
                        scriptFiltroEncuesta.src = "../js/admin/opciones_admin/alumnos/filtro_encuesta.js";
                        document.body.appendChild(scriptFiltroEncuesta);
                        
                        // Cargar script de exportación
                        const scriptExportacion = document.createElement('script');
                        scriptExportacion.src = "../js/admin/opciones_admin/alumnos/exportar.js";
                        scriptExportacion.onload = () => {
                            console.log('Scripts de alumnos cargados');
                            if (typeof inicializarGestorAlumnos === 'function') {
                                inicializarGestorAlumnos();
                            }
                            // Inicializar exportación después de cargar los demás datos
                            setTimeout(() => {
                                if (typeof inicializarExportacion === 'function') {
                                    inicializarExportacion();
                                }
                            }, 1000);
                        };
                        document.body.appendChild(scriptExportacion);
                    };
                    break;

                case 'btn-personal':
                    script.src = "../js/admin/opciones_admin/personal.js";
                    script.onload = () => {
                        console.log('Script de gestión de personal cargado');
                        // Inicializar la gestión de personal mediante la función global
                        if (typeof inicializarGestionPersonal === 'function') {
                            setTimeout(inicializarGestionPersonal, 100); // Agregamos un pequeño retraso para asegurar que el DOM se cargue
                        } else {
                            console.error('No se encontró la función inicializarGestionPersonal');
                        }
                    };
                    break;

                case 'btn-carreras':
                    script.src = "../js/admin/opciones_admin/carreras.js";
                    script.onload = () => {
                        console.log('Script de gestión de carreras cargado');
                        // Inicializar la gestión de carreras mediante la función global
                        if (typeof inicializarGestionCarreras === 'function') {
                            setTimeout(inicializarGestionCarreras, 100); // Pequeño retraso para asegurar que el DOM se cargue
                        } else {
                            console.error('No se encontró la función inicializarGestionCarreras');
                        }
                    };
                    break;

                case 'btn-resultados':
                    script.src = "../js/admin/opciones_admin/resultados.js";
                    script.onload = () => {
                        console.log('Script de resultados de encuestas cargado');
                    };
                    break;

                case 'btn-avisos':
                    script.src = "../js/admin/opciones_admin/avisos.js";
                    script.onload = () => {
                        console.log('Script de gestión de avisos cargado');
                        // Inicializar la gestión de avisos mediante la función global
                        if (typeof inicializarGestionAvisos === 'function') {
                            setTimeout(inicializarGestionAvisos, 100); // Pequeño retraso para asegurar que el DOM se cargue
                        } else {
                            console.error('No se encontró la función inicializarGestionAvisos');
                        }
                    };
                    break;
                    
                case 'btn-crear-encuestas':
                    // Cargar directamente el HTML de crear encuestas
                    fetchFileContent.then(content => {
                        // Reemplazar el contenido principal con el HTML cargado
                        document.getElementById('main-content').innerHTML = content;
                        
                        console.log('Contenido de crear encuestas cargado');
                        
                        // Verificar si ya hay scripts cargados para evitar duplicaciones
                        const scriptsLoaded = {
                            firebase: document.querySelector('script[src*="firebase-app.js"]'),
                            firestore: document.querySelector('script[src*="firebase-firestore.js"]'),
                            config: document.querySelector('script[src*="firebase-config.js"]')
                        };
                        
                        // Cargar Firebase si no está cargado
                        if (!scriptsLoaded.firebase) {
                            const firebaseScript = document.createElement('script');
                            firebaseScript.src = "https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js";
                            document.body.appendChild(firebaseScript);
                            
                            firebaseScript.onload = () => {
                                if (!scriptsLoaded.firestore) {
                                    const firestoreScript = document.createElement('script');
                                    firestoreScript.src = "https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js";
                                    document.body.appendChild(firestoreScript);
                                    
                                    firestoreScript.onload = () => {
                                        if (!scriptsLoaded.config) {
                                            const configScript = document.createElement('script');
                                            configScript.src = "../js/firebase-config.js";
                                            document.body.appendChild(configScript);
                                        }
                                    };
                                }
                            };
                        }
                        
                        // Inicializar los gestores una vez que el DOM esté completamente cargado
                        setTimeout(() => {
                            if (window.gestorEncuestas && typeof window.gestorEncuestas.inicializar === 'function') {
                                window.gestorEncuestas.inicializar();
                                console.log('Gestor de encuestas inicializado correctamente');
                            }
                            
                            if (window.gestorModulos && typeof window.gestorModulos.inicializar === 'function') {
                                window.gestorModulos.inicializar();
                                console.log('Gestor de módulos inicializado correctamente');
                            }
                            
                            if (window.gestorPreguntas && typeof window.gestorPreguntas.inicializar === 'function') {
                                window.gestorPreguntas.inicializar();
                                console.log('Gestor de preguntas inicializado correctamente');
                            }
                            
                            if (window.gestorPreguntasCondicionales && typeof window.gestorPreguntasCondicionales.inicializar === 'function') {
                                window.gestorPreguntasCondicionales.inicializar();
                                console.log('Gestor de preguntas condicionales inicializado correctamente');
                            }
                        }, 500);
                    });
                    
                    return false; // Para evitar que se agregue el script principal abajo
                    break;

                default:
                    return;
            }

            if (script.src) {
                document.body.appendChild(script);
            }
        } catch (error) {
            console.error(error);
            mainPanel.innerHTML = `<div class="error-message">
                <h2>Error al cargar la página</h2>
                <p>${error.message}</p>
                <button onclick="mainPanel.innerHTML = contenidoInicial">Volver</button>
            </div>`;
        }
    });
});

// Autenticación con localStorage
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si el usuario está autenticado usando localStorage
    const userSession = localStorage.getItem('userSession');
    
    if (userSession) {
        try {
            const userData = JSON.parse(userSession);
            console.log('Sesión de usuario recuperada:', userData);
            
            // Verificar si el usuario es admin
            if (userData.rolUser !== 'admin') {
                alert('No tienes permisos para acceder a esta página');
                window.location.href = '../auth/login.html';
                return;
            }
            
            // Mostrar nombre del usuario si está disponible
            const adminLabel = document.querySelector('.first-panel label:nth-child(3)');
            if (adminLabel) {
                adminLabel.textContent = userData.nombre || 'Admin';
            }
        } catch (error) {
            console.error('Error al procesar la sesión del usuario:', error);
            localStorage.removeItem('userSession'); // Limpiar sesión corrupta
            window.location.href = '../auth/login.html';
        }
    } else {
        // No hay sesión de usuario, redirigir al login
        console.log('No se encontró sesión de usuario');
        window.location.href = '../auth/login.html';
    }
});

// Manejar cierre de sesión
document.getElementById('btn-cerrar-sesion').addEventListener('click', function() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        // Eliminar la sesión del localStorage
        localStorage.removeItem('userSession');
        console.log('Sesión cerrada');
        // Redirigir al login
        window.location.href = '../auth/login.html';
    }
});

// Control de menú
const btnToggle = document.getElementById('toggle-menu');
const iconoFlecha = document.getElementById('icono-flecha');
const menu = document.querySelector('.menu');
const panel = document.querySelector('.main_panel');

let menuOculto = false;

btnToggle.addEventListener('click', () => {
    menuOculto = !menuOculto;

    if (menuOculto) {
        // Contraer el menú
        menu.classList.add('oculto');
        panel.classList.add('expandido');
        iconoFlecha.src = "../assets/images/flecha-derecha.png";
        iconoFlecha.alt = "Expandir";
    } else {
        // Expandir el menú
        menu.classList.remove('oculto');
        panel.classList.remove('expandido');
        iconoFlecha.src = "../assets/images/flecha-izquierda.png";
        iconoFlecha.alt = "Contraer";
    }
});
