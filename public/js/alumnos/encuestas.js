/**
 * Gestor de encuestas para el dashboard de alumnos
 * 
 * Este archivo se encarga de cargar y mostrar las encuestas disponibles,
 * calcular el progreso del usuario y proporcionar enlaces para continuar
 * con las encuestas pendientes.
 */

// Contenedor principal de encuestas
const encuestasContainer = document.getElementById('encuestas-container');

// Templates
const templateEncuestaActiva = document.getElementById('template-encuesta-activa');
const templateEncuestaCompletada = document.getElementById('template-encuesta-completada');
const templateSinEncuestas = document.getElementById('template-sin-encuestas');

// Variables globales
let currentUser = null;
let encuestasActivas = [];
let respuestasUsuario = [];

/**
 * Inicializa el gestor de encuestas
 */
function inicializarGestorEncuestas() {
    console.log('Inicializando gestor de encuestas...');

    // Verificar si Firebase está disponible
    if (typeof firebase === 'undefined') {
        console.error('Firebase no está inicializado');
        mostrarErrorEncuestas('No se pudo cargar Firebase. Por favor, recarga la página.');
        return;
    }

    // Verificar autenticación mediante localStorage
    try {
        const userSession = localStorage.getItem('userSession');
        
        if (userSession) {
            const userData = JSON.parse(userSession);
            
            // Verificar que la sesión sea de un alumno
            if (userData.rolUser === 'alumno') {
                currentUser = userData;
                cargarEncuestas();
            } else {
                mostrarErrorEncuestas('No tienes permiso para ver encuestas');
            }
        } else {
            // Si no hay usuario autenticado, mostrar mensaje
            mostrarNoEncuestas('Debes iniciar sesión para ver tus encuestas');
            setTimeout(() => {
                window.location.href = '../../auth/login.html';
            }, 2000);
        }
    } catch (error) {
        console.error('Error al verificar sesión:', error);
        mostrarErrorEncuestas('Error al verificar la sesión. Por favor, recarga la página.');
    }
}

/**
 * Carga las encuestas activas y el progreso del usuario
 */
async function cargarEncuestas() {
    try {
        // Mostrar indicador de carga
        encuestasContainer.innerHTML = `
            <div class="loading-encuestas">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Cargando encuestas...</p>
            </div>
        `;

        // 1. Cargar encuestas activas
        // Como no podemos usar operadores de desigualdad en dos campos diferentes,
        // primero obtenemos las encuestas activas y luego filtramos manualmente
        const fechaActual = new Date();
        const encuestasSnapshot = await firebase.firestore()
            .collection('encuestas')
            .where('activa', '==', true)
            .get();

        // Filtrar manualmente por fechas
        encuestasActivas = encuestasSnapshot.docs
            .map(doc => {
                const encuesta = { id: doc.id, ...doc.data() };
                
                // Convertir fechas de Firestore a objetos Date
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

        // 2. Cargar respuestas del usuario para estas encuestas desde la nueva estructura
        if (encuestasActivas.length > 0) {
            try {
                // Obtenemos todas las encuestas en el historial del usuario
                const historialEncuestasSnapshot = await firebase.firestore()
                    .collection('usuario')
                    .doc(currentUser.id)
                    .collection('historial_encuestas')
                    .get();
                
                // Procesamos las respuestas del usuario
                respuestasUsuario = [];
                
                historialEncuestasSnapshot.forEach(doc => {
                    const datosEncuesta = doc.data();
                    
                    // Para cada módulo en la encuesta, agregamos una entrada en respuestasUsuario
                    if (datosEncuesta.modulo1) {
                        respuestasUsuario.push({
                            id: `${doc.id}_modulo1`,
                            encuestaId: doc.id,
                            moduloId: 'modulo1',
                            completado: datosEncuesta.modulo1.completado || false,
                            fechaCompletado: datosEncuesta.modulo1.fechaCompletado || null,
                            datos: datosEncuesta.modulo1.datos || {}
                        });
                    }
                    
                    if (datosEncuesta.modulo2) {
                        respuestasUsuario.push({
                            id: `${doc.id}_modulo2`,
                            encuestaId: doc.id,
                            moduloId: 'modulo2',
                            completado: datosEncuesta.modulo2.completado || false,
                            fechaCompletado: datosEncuesta.modulo2.fechaCompletado || null,
                            datos: datosEncuesta.modulo2.datos || {}
                        });
                    }
                    
                    // Añadir más módulos cuando se implementen
                    if (datosEncuesta.modulo3) {
                        respuestasUsuario.push({
                            id: `${doc.id}_modulo3`,
                            encuestaId: doc.id,
                            moduloId: 'modulo3',
                            completado: datosEncuesta.modulo3.completado || false,
                            fechaCompletado: datosEncuesta.modulo3.fechaCompletado || null,
                            datos: datosEncuesta.modulo3.datos || {}
                        });
                    }
                    
                    if (datosEncuesta.modulo4) {
                        respuestasUsuario.push({
                            id: `${doc.id}_modulo4`,
                            encuestaId: doc.id,
                            moduloId: 'modulo4',
                            completado: datosEncuesta.modulo4.completado || false,
                            fechaCompletado: datosEncuesta.modulo4.fechaCompletado || null,
                            datos: datosEncuesta.modulo4.datos || {}
                        });
                    }
                    
                    if (datosEncuesta.modulo5) {
                        respuestasUsuario.push({
                            id: `${doc.id}_modulo5`,
                            encuestaId: doc.id,
                            moduloId: 'modulo5',
                            completado: datosEncuesta.modulo5.completado || false,
                            fechaCompletado: datosEncuesta.modulo5.fechaCompletado || null,
                            datos: datosEncuesta.modulo5.datos || {}
                        });
                    }
                    
                    // Módulo 6 - Expectativas
                    if (datosEncuesta.modulo6) {
                        respuestasUsuario.push({
                            id: `${doc.id}_modulo6`,
                            encuestaId: doc.id,
                            moduloId: 'modulo6',
                            completado: datosEncuesta.modulo6.completado || false,
                            fechaCompletado: datosEncuesta.modulo6.fechaCompletado || null,
                            datos: datosEncuesta.modulo6.datos || {}
                        });
                    }
                    
                    // Módulo 7 - Comentarios y sugerencias
                    if (datosEncuesta.modulo7) {
                        respuestasUsuario.push({
                            id: `${doc.id}_modulo7`,
                            encuestaId: doc.id,
                            moduloId: 'modulo7',
                            completado: datosEncuesta.modulo7.completado || false,
                            fechaCompletado: datosEncuesta.modulo7.fechaCompletado || null,
                            datos: datosEncuesta.modulo7.datos || {}
                        });
                    }
                });
                
                console.log('Respuestas del usuario cargadas desde historial:', respuestasUsuario);
            } catch (error) {
                console.error('Error al cargar respuestas desde historial:', error);
            }
        }

        // 3. Mostrar encuestas
        mostrarEncuestas();
    } catch (error) {
        console.error('Error al cargar encuestas:', error);
        mostrarErrorEncuestas(error.message);
    }
}

/**
 * Muestra las encuestas en la interfaz
 */
function mostrarEncuestas() {
    if (!encuestasContainer) {
        console.error('Contenedor de encuestas no encontrado');
        return;
    }
    
    // Limpiar el contenedor
    encuestasContainer.innerHTML = '';
    
    if (encuestasActivas.length === 0) {
        mostrarNoEncuestas();
        return;
    }
    
    // Mostrar cada encuesta activa
    encuestasActivas.forEach(encuesta => {
        // Calcular progreso
        const progreso = calcularProgresoEncuesta(encuesta.id);
        
        // Si la encuesta está completada, usar template de completada
        if (progreso.porcentaje === 100) {
            const encuestaElement = document.importNode(templateEncuestaCompletada.content, true);
            
            // Establecer datos
            encuestaElement.querySelector('.encuesta-titulo').textContent = encuesta.titulo;
            encuestaElement.querySelector('.encuesta-descripcion').textContent = encuesta.descripcion;
            
            // Formatear fecha de completado
            if (progreso.fechaCompletado) {
                let fechaFormateada = 'Fecha desconocida';
                try {
                    // Verificar si es timestamp de Firestore o Date
                    if (typeof progreso.fechaCompletado.toDate === 'function') {
                        fechaFormateada = formatearFecha(progreso.fechaCompletado.toDate());
                    } else if (progreso.fechaCompletado instanceof Date) {
                        fechaFormateada = formatearFecha(progreso.fechaCompletado);
                    }
                } catch (error) {
                    console.warn('Error al formatear fecha:', error);
                }
                encuestaElement.querySelector('.fecha-completado').textContent = fechaFormateada;
            }
            
            // Crear botones de navegación para módulos completados
            const modulosNavContainer = encuestaElement.querySelector('.modulos-nav');
            const modulosCompletados = progreso.modulosCompletados || [];
            
            if (modulosCompletados.length > 0) {
                // Crear un botón para cada módulo completado
                modulosCompletados.forEach(moduloId => {
                    const moduloBtn = document.createElement('a');
                    moduloBtn.href = '#';
                    moduloBtn.classList.add('modulo-link', 'completed');
                    
                    // Determinar el nombre y número del módulo
                    let moduloNombre = 'Desconocido';
                    let moduloNumero = '';
                    
                    switch(moduloId) {
                        case 'modulo1':
                            moduloNombre = 'Datos Personales';
                            moduloNumero = '1';
                            break;
                        case 'modulo2':
                            moduloNombre = 'Formación Académica';
                            moduloNumero = '2';
                            break;
                        case 'modulo3':
                            moduloNombre = 'Datos de Ubicación';
                            moduloNumero = '3';
                            break;
                        case 'modulo4':
                            moduloNombre = 'Datos de Empleo';
                            moduloNumero = '4';
                            break;
                        case 'modulo5':
                            moduloNombre = 'Desempeño Profesional';
                            moduloNumero = '5';
                            break;
                        case 'modulo6':
                            moduloNombre = 'Expectativas';
                            moduloNumero = '6';
                            break;
                        case 'modulo7':
                            moduloNombre = 'Comentarios';
                            moduloNumero = '7';
                            break;
                    }
                    
                    moduloBtn.textContent = `Módulo ${moduloNumero}`;
                    moduloBtn.title = moduloNombre;
                    
                    // Agregar evento para ver este módulo específico
                    moduloBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        verRespuestasModulo(encuesta.id, moduloId);
                    });
                    
                    modulosNavContainer.appendChild(moduloBtn);
                });
            } else {
                modulosNavContainer.innerHTML = '<p>No hay módulos completados.</p>';
            }
            
            // Agregar evento de ver respuestas
            encuestaElement.querySelector('.btn-ver-respuestas').addEventListener('click', () => {
                // Ver respuestas del primer módulo completado
                if (modulosCompletados.length > 0) {
                    verRespuestasModulo(encuesta.id, modulosCompletados[0]);
                } else {
                    alert('No hay respuestas para mostrar.');
                }
            });
            
            encuestasContainer.appendChild(encuestaElement);
        } else {
            // Encuesta activa/pendiente
            const encuestaElement = document.importNode(templateEncuestaActiva.content, true);
            
            // Establecer datos
            encuestaElement.querySelector('.encuesta-titulo').textContent = encuesta.titulo;
            encuestaElement.querySelector('.encuesta-descripcion').textContent = encuesta.descripcion;
            
            // Formatear fecha de fin
            if (encuesta.fechaFin) {
                encuestaElement.querySelector('.fecha-fin').textContent = formatearFecha(encuesta.fechaFin);
            } else {
                encuestaElement.querySelector('.fecha-fin').textContent = 'Sin límite';
            }
            
            // Actualizar barra de progreso
            encuestaElement.querySelector('.progreso-porcentaje').textContent = `${progreso.porcentaje}%`;
            encuestaElement.querySelector('.progreso-completado').style.width = `${progreso.porcentaje}%`;
            
            // Seleccionar qué botón mostrar basado en el progreso
            const btnComenzar = encuestaElement.querySelector('.btn-comenzar-encuesta');
            const btnContinuar = encuestaElement.querySelector('.btn-continuar-encuesta');
            
            if (progreso.porcentaje === 0) {
                // No se ha comenzado la encuesta
                btnComenzar.style.display = 'block';
                btnContinuar.style.display = 'none';
                
                btnComenzar.addEventListener('click', () => {
                    continuarEncuesta(encuesta.id, 'modulo1');
                });
            } else {
                // Se ha comenzado pero no completado
                btnComenzar.style.display = 'none';
                btnContinuar.style.display = 'block';
                
                btnContinuar.addEventListener('click', () => {
                    continuarEncuesta(encuesta.id, progreso.siguienteModulo);
                });
            }
            
            encuestasContainer.appendChild(encuestaElement);
        }
    });
}

/**
 * Calcula el progreso del usuario en una encuesta específica
 * @param {string} encuestaId - ID de la encuesta
 * @returns {Object} Objeto con el porcentaje y siguiente módulo
 */
function calcularProgresoEncuesta(encuestaId) {
    // Filtrar respuestas para esta encuesta
    const respuestasEncuesta = respuestasUsuario.filter(
        respuesta => respuesta.encuestaId === encuestaId
    );
    
    // Total de módulos esperados (actualmente 7)
    const totalModulos = 7;
    
    // Verificar módulos completados
    const modulosCompletados = new Set();
    let fechaCompletado = null;
    
    respuestasEncuesta.forEach(respuesta => {
        if (respuesta.completado) {
            modulosCompletados.add(respuesta.moduloId);
            
            // Actualizar fecha de último módulo completado
            if (!fechaCompletado || (respuesta.fechaCompletado && respuesta.fechaCompletado > fechaCompletado)) {
                fechaCompletado = respuesta.fechaCompletado;
            }
        }
    });
    
    // Calcular porcentaje
    const porcentaje = Math.round((modulosCompletados.size / totalModulos) * 100);
    
    // Determinar siguiente módulo
    let siguienteModulo = 'modulo1';
    
    if (modulosCompletados.has('modulo1')) {
        siguienteModulo = 'modulo2';
        
        if (modulosCompletados.has('modulo2')) {
            siguienteModulo = 'modulo3';
            
            if (modulosCompletados.has('modulo3')) {
                siguienteModulo = 'modulo4';
                
                if (modulosCompletados.has('modulo4')) {
                    siguienteModulo = 'modulo5';
                    
                    if (modulosCompletados.has('modulo5')) {
                        siguienteModulo = 'modulo6';
                        
                        if (modulosCompletados.has('modulo6')) {
                            siguienteModulo = 'modulo7';
                            
                            if (modulosCompletados.has('modulo7')) {
                                siguienteModulo = null; // Todos los módulos completados
                            }
                        }
                    }
                }
            }
        }
    }
    
    return {
        porcentaje,
        siguienteModulo,
        modulosCompletados: Array.from(modulosCompletados),
        fechaCompletado
    };
}

/**
 * Continúa la encuesta en el módulo correspondiente
 * @param {string} encuestaId - ID de la encuesta
 * @param {string} moduloId - ID del módulo a continuar
 */
function continuarEncuesta(encuestaId, moduloId) {
    // Si no hay módulo siguiente, la encuesta está completa
    if (!moduloId) {
        alert('Has completado todos los módulos de esta encuesta.');
        return;
    }
    
    // Almacenar en localStorage para referencia
    localStorage.setItem('encuestaActiva', encuestaId);
    
    // Redirigir al módulo correspondiente
    window.location.href = `modulos/${moduloId}.html`;
}

/**
 * Formatea una fecha a un formato legible
 * @param {Date} fecha - Objeto Date a formatear
 * @returns {string} Fecha formateada
 */
function formatearFecha(fecha) {
    if (!fecha || !(fecha instanceof Date) || isNaN(fecha.getTime())) {
        return 'Fecha desconocida';
    }
    
    const opciones = { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    };
    
    return fecha.toLocaleDateString('es-MX', opciones);
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', inicializarGestorEncuestas);

/**
 * Muestra un mensaje de error en el contenedor de encuestas
 * @param {string} mensaje - Mensaje de error a mostrar
 */
function mostrarErrorEncuestas(mensaje) {
    if (!encuestasContainer) return;
    
    encuestasContainer.innerHTML = `
        <div class="error-container">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Error al cargar encuestas: ${mensaje}</p>
        </div>
    `;
}

/**
 * Muestra un mensaje cuando no hay encuestas disponibles
 * @param {string} mensaje - Mensaje a mostrar (personalizable)
 */
function mostrarNoEncuestas(mensaje = 'No hay encuestas disponibles en este momento') {
    if (!encuestasContainer) return;
    
    encuestasContainer.innerHTML = `
        <div class="no-encuestas">
            <i class="fas fa-clipboard-check"></i>
            <p>${mensaje}</p>
        </div>
    `;
}

// Llamar a la inicialización cuando el documento esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado, inicializando gestor de encuestas...');
    setTimeout(inicializarGestorEncuestas, 500); // Pequeño retraso para asegurar que Firebase esté cargado
});

/**
 * Redirige al usuario para ver las respuestas de un módulo específico
 * @param {string} encuestaId - ID de la encuesta
 * @param {string} moduloId - ID del módulo a ver
 */
function verRespuestasModulo(encuestaId, moduloId) {
    // Almacenar IDs en localStorage para recuperarlos en la página de respuestas
    localStorage.setItem('verEncuestaId', encuestaId);
    localStorage.setItem('verModuloId', moduloId);
    
    // Redirigir a la página de respuestas (usaremos el mismo módulo pero en modo vista)
    window.location.href = `modulos/${moduloId}.html?modo=vista`;
}

// Exportar funciones para uso global
window.inicializarGestorEncuestas = inicializarGestorEncuestas;
window.verRespuestasModulo = verRespuestasModulo;
