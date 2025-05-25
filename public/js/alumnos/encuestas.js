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

        // 2. Cargar respuestas del usuario para estas encuestas
        if (encuestasActivas.length > 0) {
            const db = firebase.firestore();
            const usuarioRef = db.collection('usuario').doc(currentUser.id);
            
            // Cargar respuestas de historial_encuestas del usuario
            try {
                const historialEncuestasSnapshot = await usuarioRef.collection('historial_encuestas').get();
                
                respuestasUsuario = historialEncuestasSnapshot.docs.map(doc => {
                    const respuesta = { id: doc.id, ...doc.data() };
                    
                    // Convertir fechas de Firestore a objetos Date si existen
                    if (respuesta.fechaCreacion && typeof respuesta.fechaCreacion.toDate === 'function') {
                        respuesta.fechaCreacion = respuesta.fechaCreacion.toDate();
                    }
                    
                    return respuesta;
                });
                
                console.log('Respuestas de usuario cargadas:', respuestasUsuario);
            } catch (error) {
                console.error('Error al cargar respuestas del usuario:', error);
            }
        }

        // 3. Mostrar encuestas en la interfaz
        mostrarEncuestas();
    } catch (error) {
        console.error('Error al cargar encuestas:', error);
        mostrarErrorEncuestas(`Error al cargar encuestas: ${error.message}`);
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
                        case 'modulo1.1':
                            moduloNombre = 'Datos Generales (Química/Bioquímica)';
                            moduloNumero = '1.1';
                            break;
                        case 'modulo2':
                            moduloNombre = 'Formación Académica';
                            moduloNumero = '2';
                            break;
                        case 'modulo2.1':
                            moduloNombre = 'Situación Laboral (Química/Bioquímica)';
                            moduloNumero = '2.1';
                            break;
                        case 'modulo3':
                            moduloNombre = 'Datos de Ubicación';
                            moduloNumero = '3';
                            break;
                        case 'modulo3.1':
                            moduloNombre = 'Plan de Estudios (Química/Bioquímica)';
                            moduloNumero = '3.1';
                            break;
                        case 'modulo4':
                            moduloNombre = 'Datos de Empleo';
                            moduloNumero = '4';
                            break;
                        case 'modulo4.1':
                            moduloNombre = 'Institución (Química/Bioquímica)';
                            moduloNumero = '4.1';
                            break;
                        case 'modulo5':
                            moduloNombre = 'Desempeño Profesional';
                            moduloNumero = '5';
                            break;
                        case 'modulo5.1':
                            moduloNombre = 'Desempeño Laboral (Química/Bioquímica)';
                            moduloNumero = '5.1';
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
                    // Verificar si es estudiante de Química/Bioquímica
                    const esQuimicaOBioquimicaStr = localStorage.getItem('esQuimicaOBioquimica');
                    const esQuimicaOBioquimica = esQuimicaOBioquimicaStr === 'true';
                    
                    // Seleccionar el primer módulo según la carrera
                    const primerModulo = esQuimicaOBioquimica ? 'modulo1.1' : 'modulo1';
                    console.log(`Comenzando encuesta con: ${primerModulo} (Química/Bioquímica: ${esQuimicaOBioquimica})`);
                    
                    continuarEncuesta(encuesta.id, primerModulo);
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
    // Guardar el ID de la encuesta actual en localStorage para referencia futura
    localStorage.setItem('encuestaActualId', encuestaId);
    
    // Obtener la información de carrera especializada desde localStorage
    // Esta información se establece en alumnos.js cuando el usuario entra al dashboard
    const esQuimicaOBioquimicaStr = localStorage.getItem('esQuimicaOBioquimica');
    let esQuimicaOBioquimica = esQuimicaOBioquimicaStr === 'true';
    
    console.log('Calculando progreso para encuesta:', encuestaId);
    console.log('¿Es carrera especializada? (desde localStorage):', esQuimicaOBioquimica);
    
    // Si no hay información en localStorage, verificar directamente
    if (esQuimicaOBioquimicaStr === null) {
        const userSession = localStorage.getItem('userSession');
        if (userSession) {
            try {
                const userData = JSON.parse(userSession);
                if (userData.carrera) {
                    const carrera = userData.carrera.toLowerCase();
                    esQuimicaOBioquimica = carrera.includes('ingeniería química') || 
                                    carrera.includes('ingenieria quimica') || 
                                    carrera.includes('ingeniería bioquímica') || 
                                    carrera.includes('ingenieria bioquimica') ||
                                    carrera.includes('química') || 
                                    carrera.includes('quimica') || 
                                    carrera.includes('bioquímica') || 
                                    carrera.includes('bioquimica');
                }
                console.log('Verificación alternativa de carrera:', userData.carrera);
                console.log('¿Es carrera especializada?', esQuimicaOBioquimica);
            } catch (error) {
                console.error('Error al verificar carrera del usuario:', error);
            }
        }
    }
    
    // Filtrar respuestas para esta encuesta
    const respuestasEncuesta = respuestasUsuario.filter(
        respuesta => respuesta.id === encuestaId
    );
    
    if (respuestasEncuesta.length === 0) {
        // No hay respuestas, determinar el primer módulo según la carrera
        const primerModulo = esQuimicaOBioquimica ? 'modulo1.1' : 'modulo1';
        return {
            porcentaje: 0,
            siguienteModulo: primerModulo,
            modulosCompletados: []
        };
    }
    
    const respuesta = respuestasEncuesta[0];
    
    // Módulos posibles según la carrera del estudiante
    const modulosRegulares = ['modulo1', 'modulo2', 'modulo3', 'modulo4', 'modulo5', 'modulo6', 'modulo7'];
    const modulosEspecializados = ['modulo1.1', 'modulo2.1', 'modulo3.1', 'modulo4.1', 'modulo5.1'];
    
    // Seleccionar la secuencia de módulos correcta
    const modulos = esQuimicaOBioquimica ? modulosEspecializados : modulosRegulares;
    
    // Verificar módulos completados
    const modulosCompletados = [];
    let siguienteModulo = modulos[0]; // Por defecto, el primer módulo
    let fechaCompletado = null;
    
    // Verificación mejorada para módulos completados
    console.log('Verificando módulos completados en respuesta:', respuesta);
    
    // Recorrer todos los módulos posibles
    for (const moduloId of modulos) {
        console.log(`Verificando si ${moduloId} está completado:`, respuesta[moduloId]);
        
        // Verificar si el módulo existe y está completado
        if (respuesta[moduloId] && respuesta[moduloId].completado === true) {
            console.log(`Módulo ${moduloId} COMPLETADO`);
            modulosCompletados.push(moduloId);
            
            // Actualizar fecha del último módulo completado
            if (respuesta[moduloId].fechaCompletado) {
                let nuevaFecha;
                if (typeof respuesta[moduloId].fechaCompletado.toDate === 'function') {
                    nuevaFecha = respuesta[moduloId].fechaCompletado.toDate();
                } else if (respuesta[moduloId].fechaCompletado instanceof Date) {
                    nuevaFecha = respuesta[moduloId].fechaCompletado;
                } else if (respuesta[moduloId].fechaCompletado) {
                    // Intentar convertir desde timestamp
                    try {
                        nuevaFecha = new Date(respuesta[moduloId].fechaCompletado);
                    } catch (e) {
                        console.warn('No se pudo convertir la fecha:', e);
                    }
                }
                
                if (nuevaFecha && (!fechaCompletado || nuevaFecha > fechaCompletado)) {
                    fechaCompletado = nuevaFecha;
                }
            }
        } else {
            // Encontramos el primer módulo no completado
            console.log(`Módulo ${moduloId} NO completado, será el siguiente`); 
            siguienteModulo = moduloId;
            break;
        }
    }
    
    console.log('Módulos completados:', modulosCompletados);
    console.log('Siguiente módulo:', siguienteModulo);
    
    // Si todos los módulos están completados
    if (modulosCompletados.length === modulos.length) {
        console.log('Todos los módulos completados (100%)');
        return {
            porcentaje: 100,
            siguienteModulo: null,
            modulosCompletados,
            fechaCompletado
        };
    }
    
    // Calcular porcentaje de progreso
    const porcentaje = Math.round((modulosCompletados.length / modulos.length) * 100);
    console.log(`Progreso calculado: ${porcentaje}% (${modulosCompletados.length}/${modulos.length} módulos)`);
    
    return {
        porcentaje,
        siguienteModulo,
        modulosCompletados,
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
    
    // Obtener la información de carrera especializada desde localStorage
    // Esta información se establece en alumnos.js cuando el usuario entra al dashboard
    const esQuimicaOBioquimicaStr = localStorage.getItem('esQuimicaOBioquimica');
    let esQuimicaOBioquimica = esQuimicaOBioquimicaStr === 'true';
    
    console.log('Continuando encuesta, ID:', encuestaId, 'Módulo:', moduloId);
    console.log('¿Es carrera especializada? (desde localStorage):', esQuimicaOBioquimica);
    
    // Si es de Química o Bioquímica, redirigir a los módulos especializados
    if (esQuimicaOBioquimica && moduloId.match(/^modulo[1-5]$/)) {
        // Convertir modulo1 a modulo1.1, modulo2 a modulo2.1, etc.
        const moduloEspecializado = `${moduloId}.1`;
        console.log(`Redirigiendo a estudiante de Química/Bioquímica al módulo especializado: ${moduloEspecializado}`);
        window.location.href = `modulos/${moduloEspecializado}.html`;
    } else {
        // Redirigir al módulo regular correspondiente
        window.location.href = `modulos/${moduloId}.html`;
    }
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
    
    // Si el módulo ya es un módulo especializado (contiene ".1"),
    // redirigimos directamente a ese módulo
    if (moduloId.includes('.1')) {
        console.log(`Redirigiendo a ver respuestas del módulo especializado: ${moduloId}`);
        window.location.href = `modulos/${moduloId}.html?modo=vista`;
        return;
    }
    
    // Obtener la información de carrera especializada desde localStorage
    // Esta información se establece en alumnos.js cuando el usuario entra al dashboard
    const esQuimicaOBioquimicaStr = localStorage.getItem('esQuimicaOBioquimica');
    let esQuimicaOBioquimica = esQuimicaOBioquimicaStr === 'true';
    
    console.log('Viendo respuestas, ID:', encuestaId, 'Módulo:', moduloId);
    console.log('¿Es carrera especializada? (desde localStorage):', esQuimicaOBioquimica);
    
    // Si es de Química o Bioquímica y el módulo es de 1 a 5, usar módulo especializado
    if (esQuimicaOBioquimica && moduloId.match(/^modulo[1-5]$/)) {
        const moduloEspecializado = `${moduloId}.1`;
        console.log(`Redirigiendo a ver respuestas del módulo especializado: ${moduloEspecializado}`);
        window.location.href = `modulos/${moduloEspecializado}.html?modo=vista`;
    } else {
        // Redirigir a la página de respuestas del módulo regular
        console.log(`Redirigiendo a ver respuestas del módulo regular: ${moduloId}`);
        window.location.href = `modulos/${moduloId}.html?modo=vista`;
    }
}

// Exportar funciones para uso global
window.inicializarGestorEncuestas = inicializarGestorEncuestas;
window.verRespuestasModulo = verRespuestasModulo;
