/**
 * Módulo 7: Comentarios y Sugerencias - Vista Admin
 * Este archivo maneja la funcionalidad para mostrar los datos del módulo 7
 * en el panel de administración.
 */

// Variables globales
let datosModulo = null;
let db = null;
let alumnoId = null;
let encuestaId = null;

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
        console.log('Inicializando vista admin para Módulo 7', datos);
        
        // Guardar los datos
        datosModulo = datos;
        alumnoId = datos.alumnoId;
        encuestaId = datos.encuestaId;
        
        // Verificar si el modelo de Módulo 7 está disponible
        if (typeof parseModulo7Firestore !== 'function') {
            cargarModeloModulo7();
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
        console.error('Error al inicializar vista admin del módulo 7:', error);
        alert('Error al cargar los datos del módulo. Por favor, inténtelo de nuevo.');
    }
}

/**
 * Carga el modelo del Módulo 7 dinámicamente
 */
function cargarModeloModulo7() {
    const scriptModelo = document.createElement('script');
    scriptModelo.src = '../../../../models/modulos/modulo7.js';
    scriptModelo.onload = function() {
        console.log('Modelo Módulo 7 cargado correctamente');
        cargarDatosFormulario();
    };
    scriptModelo.onerror = function() {
        console.error('Error al cargar el modelo Módulo 7');
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
        
        // Utilizar el modelo parseModulo7Firestore si está disponible
        if (typeof parseModulo7Firestore === 'function') {
            datosProcesados = parseModulo7Firestore(datosModulo.datos);
        } else {
            datosProcesados = datosModulo.datos;
        }
        
        // Mostrar el comentario
        mostrarComentario(datosProcesados);
        
    } catch (error) {
        console.error('Error al cargar datos en el formulario:', error);
        alert('Error al mostrar los datos del módulo: ' + error.message);
    }
}

/**
 * Muestra el comentario del egresado
 * @param {Object} datos - Datos procesados del módulo
 */
function mostrarComentario(datos) {
    const contenedorComentario = document.getElementById('comentario-contenido');
    const fechaComentario = document.getElementById('fecha-comentario');
    
    // Mostrar el comentario si existe
    if (datos.comentario && datos.comentario.trim()) {
        // Convertir saltos de línea en formato texto a HTML
        const comentarioHTML = datos.comentario
            .replace(/\n/g, '<br>')
            .replace(/\r/g, '')
            .trim();
            
        contenedorComentario.innerHTML = comentarioHTML;
    } else {
        contenedorComentario.innerHTML = '<p class="comentario-vacio">El egresado no proporcionó comentarios o sugerencias.</p>';
    }
    
    // Mostrar la fecha del comentario si existe
    if (datos.timestamp) {
        let fecha;
        try {
            // Intentar convertir el timestamp a fecha
            if (typeof datos.timestamp === 'string') {
                fecha = new Date(datos.timestamp);
            } else if (datos.timestamp.toDate) {
                // Para objetos timestamp de Firestore
                fecha = datos.timestamp.toDate();
            } else {
                fecha = new Date(datos.timestamp);
            }
            
            fechaComentario.textContent = fecha.toLocaleString();
        } catch (error) {
            console.error('Error al formatear la fecha:', error);
            fechaComentario.textContent = 'Fecha no disponible';
        }
    } else {
        fechaComentario.textContent = 'Fecha no disponible';
    }
}

// Exportar funciones para que sean accesibles desde el iframe
window.inicializarVistaAdminModulo = inicializarVistaAdminModulo;
window.cargarDatosFormulario = cargarDatosFormulario;
