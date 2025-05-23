/**
 * Módulo 6: Expectativas y Participación Social - Vista Admin
 * Este archivo maneja la funcionalidad para mostrar los datos del módulo 6
 * en el panel de administración.
 */

// Variables globales
let datosModulo = null;
let db = null;
let alumnoId = null;
let encuestaId = null;

// Mapeo para traducciones de valores
const TRADUCCIONES = {
    // Respuestas Sí/No
    respuestas: {
        "si": "Sí",
        "no": "No",
        "ns": "No sabe / No contestó"
    }
};

// Inicializar Firebase si aún no está inicializado
if (typeof firebase !== 'undefined') {
    db = firebase.firestore();
} else {
    console.error('Firebase no está disponible');
}

/**
 * Inicializa la vista del módulo para el panel de administración
 * @param {Object} datos - Datos del módulo a mostrar
 */
function inicializarVistaAdminModulo(datos) {
    try {
        console.log('Inicializando vista admin para Módulo 6', datos);
        
        // Guardar los datos
        datosModulo = datos;
        alumnoId = datos.alumnoId;
        encuestaId = datos.encuestaId;
        
        // Verificar si el modelo de Módulo 6 está disponible
        if (typeof parseModulo6Firestore !== 'function') {
            cargarModeloModulo6();
            return; // La función continuará después de cargar el modelo
        }
        
        // Actualizar información de estado
        document.getElementById('estado-modulo').textContent = datos.completado ? 'Completado' : 'En progreso';
        
        // Mostrar fecha de completado si existe
        if (datos.fechaCompletado) {
            document.getElementById('fecha-completado').textContent = datos.fechaCompletado.toLocaleString();
        } else {
            document.getElementById('fecha-completado').textContent = 'No disponible';
        }
        
        // Cargar los datos en el formulario usando el modelo
        cargarDatosFormulario();
        
    } catch (error) {
        console.error('Error al inicializar vista admin del módulo 6:', error);
        alert('Error al cargar los datos del módulo. Por favor, inténtelo de nuevo.');
    }
}

/**
 * Carga el modelo del Módulo 6 dinámicamente
 */
function cargarModeloModulo6() {
    const scriptModelo = document.createElement('script');
    scriptModelo.src = '/public/models/modulos/modulo6.js';
    scriptModelo.onload = function() {
        console.log('Modelo Módulo 6 cargado correctamente');
        cargarDatosFormulario();
    };
    scriptModelo.onerror = function() {
        console.error('Error al cargar el modelo Módulo 6');
        alert('Error al cargar el modelo de datos. Algunas funcionalidades no estarán disponibles.');
    };
    document.head.appendChild(scriptModelo);
}

/**
 * Carga los datos en el formulario del módulo usando el modelo
 */
async function cargarDatosFormulario() {
    try {
        if (!datosModulo || !datosModulo.datos) {
            throw new Error('No hay datos disponibles para mostrar');
        }
        
        let datosProcesados;
        
        // Utilizar el modelo parseModulo6Firestore si está disponible
        if (typeof parseModulo6Firestore === 'function') {
            datosProcesados = parseModulo6Firestore(datosModulo.datos);
        } else {
            datosProcesados = datosModulo.datos;
        }
        
        // Mostrar sección de expectativas
        mostrarExpectativas(datosProcesados.expectativas);
        
        // Mostrar sección de participación social
        mostrarParticipacionSocial(datosProcesados.participacion);
        
    } catch (error) {
        console.error('Error al cargar datos en el formulario:', error);
        alert('Error al mostrar los datos del módulo: ' + error.message);
    }
}

/**
 * Muestra la sección de expectativas
 * @param {Object} expectativas - Datos de expectativas del egresado
 */
function mostrarExpectativas(expectativas) {
    if (!expectativas) return;
    
    // Cursos de actualización
    mostrarRespuestaSiNo('cursos-actualizacion', 'badge-cursos', expectativas.cursos_actualizacion);
    
    // Detalle de cuáles cursos (si aplica)
    if (expectativas.cursos_actualizacion === 'si' && expectativas.cuales_cursos) {
        document.getElementById('grupo-cuales-cursos').style.display = 'block';
        document.getElementById('cuales-cursos').textContent = expectativas.cuales_cursos;
    } else {
        document.getElementById('grupo-cuales-cursos').style.display = 'none';
    }
    
    // Posgrado
    mostrarRespuestaSiNo('tomar-posgrado', 'badge-posgrado', expectativas.tomar_posgrado);
    
    // Detalle de cuál posgrado (si aplica)
    if (expectativas.tomar_posgrado === 'si' && expectativas.cual_posgrado) {
        document.getElementById('grupo-cual-posgrado').style.display = 'block';
        document.getElementById('cual-posgrado').textContent = expectativas.cual_posgrado;
    } else {
        document.getElementById('grupo-cual-posgrado').style.display = 'none';
    }
}

/**
 * Muestra la sección de participación social
 * @param {Object} participacion - Datos de participación social del egresado
 */
function mostrarParticipacionSocial(participacion) {
    if (!participacion) return;
    
    // Organizaciones sociales
    mostrarRespuestaSiNo('organizaciones-sociales', 'badge-organizaciones', participacion.organizaciones_sociales);
    
    // Detalle de cuáles organizaciones (si aplica)
    if (participacion.organizaciones_sociales === 'si' && participacion.cuales_organizaciones) {
        document.getElementById('grupo-cuales-organizaciones').style.display = 'block';
        document.getElementById('cuales-organizaciones').textContent = participacion.cuales_organizaciones;
    } else {
        document.getElementById('grupo-cuales-organizaciones').style.display = 'none';
    }
    
    // Organismos profesionales
    mostrarRespuestaSiNo('organismos-profesionales', 'badge-organismos', participacion.organismos_profesionales);
    
    // Detalle de cuál organismo (si aplica)
    if (participacion.organismos_profesionales === 'si' && participacion.cual_organismo) {
        document.getElementById('grupo-cual-organismo').style.display = 'block';
        document.getElementById('cual-organismo').textContent = participacion.cual_organismo;
    } else {
        document.getElementById('grupo-cual-organismo').style.display = 'none';
    }
    
    // Asociación de egresados
    mostrarRespuestaSiNo('asociacion-egresados', 'badge-asociacion', participacion.asociacion_egresados);
}

/**
 * Muestra una respuesta de tipo Sí/No con su badge correspondiente
 * @param {string} idElemento - ID del elemento para mostrar el texto
 * @param {string} idBadge - ID del badge para mostrar el icono
 * @param {string} respuesta - Valor de la respuesta ('si', 'no', 'ns')
 */
function mostrarRespuestaSiNo(idElemento, idBadge, respuesta) {
    const elemento = document.getElementById(idElemento);
    const badge = document.getElementById(idBadge);
    
    // Texto de la respuesta
    elemento.textContent = TRADUCCIONES.respuestas[respuesta] || 'No especificado';
    
    // Estilo del badge
    badge.className = 'badge';
    
    if (respuesta === 'si') {
        badge.classList.add('badge-si');
        badge.innerHTML = '<i class="icon-check">✓</i>';
    } else if (respuesta === 'no') {
        badge.classList.add('badge-no');
        badge.innerHTML = '<i class="icon-times">✗</i>';
    } else {
        badge.classList.add('badge-ns');
        badge.innerHTML = '<i class="icon-question">?</i>';
    }
}

// Exportar funciones para que sean accesibles desde el iframe
window.inicializarVistaAdminModulo = inicializarVistaAdminModulo;
window.cargarDatosFormulario = cargarDatosFormulario;
