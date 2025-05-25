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
                    // Solo es necesario cargar el script adicional porque el HTML ya se cargó
                    // automáticamente en el código del event listener arriba
                    
                    // Configurar inicialización después de cargar la página
                    setTimeout(() => {
                        // Verificar e inicializar los gestores
                        if (window.gestorEncuestas && typeof window.gestorEncuestas.inicializar === 'function') {
                            window.gestorEncuestas.inicializar();
                            console.log('Gestor de encuestas inicializado correctamente');
                        } else {
                            console.error('El gestor de encuestas no está disponible');
                        }
                        
                        if (window.gestorModulos && typeof window.gestorModulos.inicializar === 'function') {
                            window.gestorModulos.inicializar();
                            console.log('Gestor de módulos inicializado correctamente');
                        } else {
                            console.error('El gestor de módulos no está disponible');
                        }
                        
                        if (window.gestorPreguntas && typeof window.gestorPreguntas.inicializar === 'function') {
                            window.gestorPreguntas.inicializar();
                            console.log('Gestor de preguntas inicializado correctamente');
                        } else {
                            console.error('El gestor de preguntas no está disponible');
                        }
                        
                        if (window.gestorPreguntasCondicionales && typeof window.gestorPreguntasCondicionales.inicializar === 'function') {
                            window.gestorPreguntasCondicionales.inicializar();
                            console.log('Gestor de preguntas condicionales inicializado correctamente');
                        } else {
                            console.error('El gestor de preguntas condicionales no está disponible');
                        }
                    }, 500); // Dar tiempo suficiente para que se carguen todos los scripts
                    
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
