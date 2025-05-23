/**
 * Módulo 7: Comentarios y Sugerencias - Controlador principal
 * 
 * Este archivo maneja la lógica principal del módulo 7 de la encuesta,
 * incluyendo la carga de datos, inicialización del formulario,
 * validación y almacenamiento de datos.
 */

// Referencias a elementos del DOM
const formulario = document.getElementById('form-modulo7');
const loadingModule = document.getElementById('loading-module');
const loadingOverlay = document.getElementById('loading-overlay');
const errorContainer = document.getElementById('error-container');
const btnGuardar = document.getElementById('btn-guardar-modulo7');
const thanksOverlay = document.getElementById('thanks-overlay');
const btnReturnDashboard = document.getElementById('btn-return-dashboard');

// Variables globales
let currentUser = null;
let encuestaActual = null;
let moduloCompletado = false;
let respuestasAnteriores = null;

/**
 * Inicializa el módulo cuando el DOM está listo
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Inicializando Módulo 7: Comentarios y Sugerencias');
    
    // Verificar autenticación mediante localStorage
    const userSession = localStorage.getItem('userSession');
    
    if (userSession) {
        try {
            const userData = JSON.parse(userSession);
            
            // Verificar que la sesión sea de un alumno
            if (userData.rolUser !== 'alumno') {
                alert('No tienes permiso para acceder a esta sección.');
                window.location.href = '/public/auth/login.html';
                return;
            }
            
            currentUser = userData;
            
            // Actualizar nombre de usuario en la interfaz
            document.getElementById('nombre-usuario').textContent = userData.nombre || userData.usuario;
            
            // Evento de cierre de sesión
            document.getElementById('btn-cerrar-sesion').addEventListener('click', () => {
                localStorage.removeItem('userSession');
                window.location.href = '/public/auth/login.html';
            });
            
            try {
                // Verificar si los módulos anteriores fueron completados
                const verificacionPrevia = await verificarModulosAnteriores();
                
                if (!verificacionPrevia.modulosCompletados) {
                    alert('Debes completar los módulos anteriores antes de continuar. Serás redirigido.');
                    window.location.href = '/public/alumnos/dashboard.html';
                    return;
                }
                
                // Cargar datos y verificar si el módulo ya fue completado
                await cargarDatos();
                
                // Si el módulo ya fue completado, habilitar modo solo visualización
                if (moduloCompletado) {
                    console.log('Este módulo ya fue completado anteriormente');
                    // Bloquear todos los campos del formulario
                    habilitarModoSoloVisualizacion();
                    // Cambiar el texto del botón
                    if (btnGuardar) {
                        btnGuardar.textContent = 'Ir al dashboard';
                    }
                }
                
                // Configurar eventos del formulario
                configurarEventos();
                
                // Mostrar formulario
                loadingModule.style.display = 'none';
                formulario.style.display = 'block';
            } catch (error) {
                console.error('Error al inicializar el módulo 7:', error);
                mostrarError('Error al cargar el formulario. Por favor, recarga la página.');
            }
        } catch (error) {
            console.error('Error al procesar la sesión:', error);
            localStorage.removeItem('userSession');
            window.location.href = '/public/auth/login.html';
        }
    } else {
        // Usuario no autenticado, redirigir al login
        alert('Debes iniciar sesión para acceder a esta sección.');
        window.location.href = '/public/auth/login.html';
    }
});

/**
 * Verifica si los módulos anteriores han sido completados
 * @returns {Promise<Object>} - Objeto con estado de módulos
 */
async function verificarModulosAnteriores() {
    try {
        // 1. Obtener encuesta activa
        const fechaActual = new Date();
        
        const encuestasSnapshot = await firebase.firestore().collection('encuestas').get();
        
        const encuestasEnRango = encuestasSnapshot.docs
            .map(doc => {
                const encuesta = { id: doc.id, ...doc.data() };
                
                // Convertir Timestamps a Date si existen
                if (encuesta.fechaInicio && typeof encuesta.fechaInicio.toDate === 'function') {
                    encuesta.fechaInicio = encuesta.fechaInicio.toDate();
                }
                
                if (encuesta.fechaFin && typeof encuesta.fechaFin.toDate === 'function') {
                    encuesta.fechaFin = encuesta.fechaFin.toDate();
                }
                
                return encuesta;
            })
            .filter(encuesta => {
                // Verificar que la encuesta está en el rango de fechas válido
                const fechaInicioValida = !encuesta.fechaInicio || encuesta.fechaInicio <= fechaActual;
                const fechaFinValida = !encuesta.fechaFin || encuesta.fechaFin >= fechaActual;
                return fechaInicioValida && fechaFinValida;
            });
        
        if (encuestasEnRango.length === 0) {
            throw new Error('No hay encuestas activas en este momento.');
        }
        
        encuestaActual = encuestasEnRango[0];
        // El ID ya está incluido en el objeto encuesta
        
        console.log('Verificando si el usuario ha completado los módulos anteriores...');
        console.log('ID Usuario:', currentUser.id);
        console.log('ID Encuesta:', encuestaActual.id);
        
        // 2. Verificar si el usuario completó los módulos anteriores usando la nueva estructura
        const historialEncuestaDoc = await firebase.firestore()
            .collection('usuario')
            .doc(currentUser.id)
            .collection('historial_encuestas')
            .doc(encuestaActual.id)
            .get();
        
        console.log('Documento encontrado:', historialEncuestaDoc.exists);
        
        if (historialEncuestaDoc.exists) {
            const datosEncuesta = historialEncuestaDoc.data();
            console.log('Datos de encuesta:', datosEncuesta);
            
            // Verificar si existen los módulos 1, 2, 3 y 6 y están completados
            const modulo1Completado = datosEncuesta.modulo1 && datosEncuesta.modulo1.completado === true;
            const modulo2Completado = datosEncuesta.modulo2 && datosEncuesta.modulo2.completado === true;
            const modulo3Completado = datosEncuesta.modulo3 && datosEncuesta.modulo3.completado === true;
            const modulo6Completado = datosEncuesta.modulo6 && datosEncuesta.modulo6.completado === true;
            
            console.log('Módulo 1 completado:', modulo1Completado);
            console.log('Módulo 2 completado:', modulo2Completado);
            console.log('Módulo 3 completado:', modulo3Completado);
            console.log('Módulo 6 completado:', modulo6Completado);
            
            // Si el usuario trabaja, debemos verificar si también completó los módulos 4 y 5
            if (modulo3Completado && datosEncuesta.modulo3.datos) {
                const actividadActual = datosEncuesta.modulo3.datos.actividad_actual;
                const trabajaOEstudiaTrabaja = actividadActual === 'trabaja' || actividadActual === 'trabaja_estudia';
                
                if (trabajaOEstudiaTrabaja) {
                    const modulo4Completado = datosEncuesta.modulo4 && datosEncuesta.modulo4.completado === true;
                    const modulo5Completado = datosEncuesta.modulo5 && datosEncuesta.modulo5.completado === true;
                    
                    console.log('El usuario trabaja o estudia y trabaja');
                    console.log('Módulo 4 completado:', modulo4Completado);
                    console.log('Módulo 5 completado:', modulo5Completado);
                    
                    return {
                        modulosCompletados: modulo1Completado && modulo2Completado && modulo3Completado && 
                                         modulo4Completado && modulo5Completado && modulo6Completado
                    };
                }
            }
            
            // Si el usuario no trabaja, solo verificamos los módulos 1, 2, 3 y 6
            return {
                modulosCompletados: modulo1Completado && modulo2Completado && modulo3Completado && modulo6Completado
            };
        }
        
        console.log('No se encontró historial de esta encuesta para el usuario');
        return {
            modulosCompletados: false
        };
    } catch (error) {
        console.error('Error al verificar módulos anteriores:', error);
        throw error;
    }
}

/**
 * Carga los datos necesarios para el formulario
 */
async function cargarDatos() {
    try {
        // Verificar si el usuario ya completó este módulo para esta encuesta
        const historialEncuestaDoc = await firebase.firestore()
            .collection('usuario')
            .doc(currentUser.id)
            .collection('historial_encuestas')
            .doc(encuestaActual.id)
            .get();
        
        if (historialEncuestaDoc.exists) {
            const datosEncuesta = historialEncuestaDoc.data();
            
            // Verificar si existe el módulo 7 y está completado
            moduloCompletado = datosEncuesta.modulo7 && datosEncuesta.modulo7.completado === true;
            
            // Si hay respuestas anteriores, cargarlas
            if (moduloCompletado && datosEncuesta.modulo7.datos) {
                respuestasAnteriores = datosEncuesta.modulo7.datos;
                
                // Pre-llenar el formulario con las respuestas anteriores
                preLlenarFormulario();
            }
        } else {
            moduloCompletado = false;
        }
    } catch (error) {
        console.error('Error al cargar datos:', error);
        throw error;
    }
}

/**
 * Pre-llena el formulario con las respuestas anteriores
 */
function preLlenarFormulario() {
    if (!respuestasAnteriores) return;
    
    // Comentario
    if (respuestasAnteriores.comentario) {
        document.getElementById('comentario').value = respuestasAnteriores.comentario;
    }
}

/**
 * Configura los eventos del formulario
 */
function configurarEventos() {
    // Evento de envío del formulario
    btnGuardar.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // Si el módulo ya está completado, solo navegar al dashboard
        if (moduloCompletado) {
            window.location.href = '/public/alumnos/dashboard.html';
            return;
        }
        
        // Validar el formulario
        const validacion = validarFormulario();
        
        if (!validacion.valido) {
            mostrarErrores(validacion.errores);
            return;
        }
        
        // Mostrar overlay de carga
        loadingOverlay.style.display = 'flex';
        
        try {
            // Crear objeto con los datos del formulario
            const datosModulo7 = window.crearModulo7DesdeFormulario(formulario);
            
            // Guardar respuestas en Firestore
            await guardarRespuestas(datosModulo7);
            
            alert('¡Felicidades! Has completado toda la encuesta. Serás redirigido al dashboard.');
            
            // Redirigir al dashboard (es el último módulo)
            window.location.href = '/public/alumnos/dashboard.html';
        } catch (error) {
            console.error('Error al guardar el formulario:', error);
            mostrarError('Error al guardar la información. Por favor, intenta nuevamente.');
            loadingOverlay.style.display = 'none';
        }
    });
    
    // Evento para volver al dashboard desde el overlay de agradecimiento
    btnReturnDashboard.addEventListener('click', () => {
        window.location.href = '/public/alumnos/dashboard.html';
    });
}

/**
 * Guarda las respuestas del módulo en Firestore
 * @param {Object} datos - Datos del módulo 7
 */
async function guardarRespuestas(datos) {
    try {
        const db = firebase.firestore();
        const usuarioRef = db.collection('usuario').doc(currentUser.id);
        
        // Referencia al documento de la encuesta en la subcolección historial_encuestas
        const encuestaRef = usuarioRef.collection('historial_encuestas').doc(encuestaActual.id);
        
        // Obtener el documento para ver si ya existe
        const encuestaDoc = await encuestaRef.get();
        
        if (encuestaDoc.exists) {
            // La encuesta ya existe, actualizamos solo el módulo 7
            await encuestaRef.update({
                'modulo7': {
                    datos: datos,
                    completado: true,
                    fechaCompletado: new Date()
                },
                encuestaCompletada: true,
                fechaCompletado: new Date(),
                ultimaModificacion: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            // Crear nuevo documento para esta encuesta
            await encuestaRef.set({
                encuestaId: encuestaActual.id,
                titulo: encuestaActual.titulo || 'Encuesta sin título',
                fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
                ultimaModificacion: firebase.firestore.FieldValue.serverTimestamp(),
                fechaCompletado: new Date(),
                encuestaCompletada: true,
                modulo7: {
                    datos: datos,
                    completado: true,
                    fechaCompletado: new Date()
                }
            });
        }
        
        // Actualizar variable global
        moduloCompletado = true;
        
    } catch (error) {
        console.error('Error al guardar respuestas:', error);
        throw error;
    }
}

/**
 * Muestra un mensaje de error general
 * @param {string} mensaje - Mensaje de error
 */
function mostrarError(mensaje) {
    errorContainer.innerHTML = `<p class="error-message">${mensaje}</p>`;
    errorContainer.style.display = 'block';
    errorContainer.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Habilita el modo solo visualización bloqueando todos los campos del formulario
 */
function habilitarModoSoloVisualizacion() {
    console.log('Habilitando modo solo visualización');
    
    // Añadir un aviso en la parte superior del formulario
    const avisoElement = document.createElement('div');
    avisoElement.className = 'aviso-solo-visualizacion';
    avisoElement.innerHTML = `
        <div class="aviso-icono"><i class="fas fa-info-circle"></i></div>
        <div class="aviso-texto">
            <h4>Modo solo visualización</h4>
            <p>Esta encuesta ya ha sido completada. Los campos no pueden ser editados.</p>
        </div>
    `;
    
    // Insertar el aviso al inicio del formulario
    formulario.insertBefore(avisoElement, formulario.firstChild);
    
    // Seleccionar todos los elementos de entrada en el formulario
    const inputs = formulario.querySelectorAll('input, select, textarea');
    
    // Desactivar cada elemento
    inputs.forEach(input => {
        input.disabled = true;
        input.classList.add('disabled');
    });
    
    // Cambiar estilo del formulario para indicar modo visualización
    formulario.classList.add('form-readonly');
    
    // Mostrar mensaje informativo en consola
    console.log('Formulario en modo solo visualización - todos los campos bloqueados');
}
