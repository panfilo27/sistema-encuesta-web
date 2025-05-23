/**
 * Módulo 5: Desempeño Profesional - Vista Admin
 * Este archivo maneja la funcionalidad para mostrar los datos del módulo 5
 * en el panel de administración.
 */

// Variables globales
let datosModulo = null;
let db = null;
let alumnoId = null;
let encuestaId = null;

// Mapeo para traducciones de valores
const TRADUCCIONES = {
    // Calificaciones
    valoraciones: {
        "5": "Excelente",
        "4": "Muy bueno",
        "3": "Bueno",
        "2": "Regular",
        "1": "Malo"
    },
    // Aspectos para la contratación
    aspectos: {
        "areaEstudio": "Área de estudio",
        "titulacion": "Titulación",
        "experienciaPrevia": "Experiencia laboral previa",
        "competenciaLaboral": "Competencia laboral",
        "posicionamientoInstitucion": "Posicionamiento de la institución",
        "conocimientoIdiomas": "Conocimiento de idiomas extranjeros",
        "recomendaciones": "Recomendaciones / Referencias",
        "personalidad": "Personalidad / Actitud",
        "capacidadLiderazgo": "Capacidad de liderazgo",
        "otrosFactor": "Otros factores"
    },
    // Importancia de los aspectos
    importancia: {
        "5": "Muy importante",
        "4": "Importante",
        "3": "Regular",
        "2": "Poco importante",
        "1": "Nada importante",
        "0": "No especificado"
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
        console.log('Inicializando vista admin para Módulo 5', datos);
        
        // Guardar los datos
        datosModulo = datos;
        alumnoId = datos.alumnoId;
        encuestaId = datos.encuestaId;
        
        // Verificar si el modelo de Módulo 5 está disponible
        if (typeof parseModulo5Firestore !== 'function') {
            cargarModeloModulo5();
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
        console.error('Error al inicializar vista admin del módulo 5:', error);
        alert('Error al cargar los datos del módulo. Por favor, inténtelo de nuevo.');
    }
}

/**
 * Carga el modelo del Módulo 5 dinámicamente
 */
function cargarModeloModulo5() {
    const scriptModelo = document.createElement('script');
    scriptModelo.src = '/public/models/modulos/modulo5.js';
    scriptModelo.onload = function() {
        console.log('Modelo Módulo 5 cargado correctamente');
        cargarDatosFormulario();
    };
    scriptModelo.onerror = function() {
        console.error('Error al cargar el modelo Módulo 5');
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
        
        // Utilizar el modelo parseModulo5Firestore si está disponible
        if (typeof parseModulo5Firestore === 'function') {
            datosProcesados = parseModulo5Firestore(datosModulo.datos);
        } else {
            datosProcesados = datosModulo.datos;
        }
        
        // Mostrar calificación de eficiencia
        mostrarCalificacionConEstrellas('eficiencia', datosProcesados.eficiencia);
        
        // Mostrar calificación de formación académica
        mostrarCalificacionConEstrellas('formacion', datosProcesados.formacionAcademica);
        
        // Mostrar calificación de utilidad de residencias profesionales
        mostrarCalificacionConEstrellas('residencias', datosProcesados.utilidadResidencias);
        
        // Mostrar valoración de aspectos para contratación
        mostrarAspectosTrabajo(datosProcesados.aspectos);
        
    } catch (error) {
        console.error('Error al cargar datos en el formulario:', error);
        alert('Error al mostrar los datos del módulo: ' + error.message);
    }
}

/**
 * Muestra una calificación con estrellas
 * @param {string} idPrefijo - Prefijo del ID de los elementos HTML
 * @param {string} valor - Valor de la calificación (1-5)
 */
function mostrarCalificacionConEstrellas(idPrefijo, valor) {
    const valorNumerico = parseInt(valor) || 0;
    const estrellas = document.getElementById(`${idPrefijo}-estrellas`);
    const valorTexto = document.getElementById(`${idPrefijo}-valor`);
    
    // Establecer el texto del valor
    valorTexto.textContent = valorNumerico > 0 ? 
        `${valorNumerico}/5 - ${TRADUCCIONES.valoraciones[valorNumerico] || 'No especificado'}` : 
        'No calificado';
    
    // Establecer las estrellas (llenas y vacías)
    let estrellasHTML = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= valorNumerico) {
            estrellasHTML += '<span class="estrella-llena">★</span>';
        } else {
            estrellasHTML += '<span class="estrella-vacia">☆</span>';
        }
    }
    estrellas.innerHTML = estrellasHTML;
    
    // Colorear las estrellas según la calificación
    const colorEstrellas = getColorPorValoracion(valorNumerico);
    Array.from(estrellas.getElementsByClassName('estrella-llena')).forEach(estrella => {
        estrella.style.color = colorEstrellas;
    });
}

/**
 * Devuelve un color según la valoración
 * @param {number} valoracion - Valor de la valoración (1-5)
 * @returns {string} - Color en formato hexadecimal
 */
function getColorPorValoracion(valoracion) {
    switch (parseInt(valoracion)) {
        case 5: return '#4caf50'; // Verde
        case 4: return '#8bc34a'; // Verde claro
        case 3: return '#ffeb3b'; // Amarillo
        case 2: return '#ff9800'; // Naranja
        case 1: return '#f44336'; // Rojo
        default: return '#9e9e9e'; // Gris (no especificado)
    }
}

/**
 * Muestra la tabla de aspectos para la contratación
 * @param {Object} aspectos - Objeto con los aspectos y sus valoraciones
 */
function mostrarAspectosTrabajo(aspectos) {
    const tablaAspectos = document.getElementById('tabla-aspectos');
    tablaAspectos.innerHTML = '';
    
    // Verificar si hay aspectos para mostrar
    if (!aspectos) {
        tablaAspectos.innerHTML = '<tr><td colspan="2">No hay información de aspectos disponible</td></tr>';
        return;
    }
    
    // Recorrer los aspectos en el orden deseado
    const ordenAspectos = [
        'areaEstudio', 'titulacion', 'experienciaPrevia', 'competenciaLaboral',
        'posicionamientoInstitucion', 'conocimientoIdiomas', 'recomendaciones',
        'personalidad', 'capacidadLiderazgo', 'otrosFactor'
    ];
    
    ordenAspectos.forEach(clave => {
        if (clave === 'otrosFactor' && !aspectos[clave]) {
            return; // No mostrar la fila "Otros factores" si no hay valor
        }
        
        const valoracion = aspectos[clave] ? parseInt(aspectos[clave]) : 0;
        
        const fila = document.createElement('tr');
        
        // Nombre del aspecto
        const celdaNombre = document.createElement('td');
        celdaNombre.textContent = TRADUCCIONES.aspectos[clave] || clave;
        
        if (clave === 'otrosFactor' && aspectos.otrosValoracion) {
            celdaNombre.textContent += ': ' + aspectos.otrosValoracion;
        }
        
        fila.appendChild(celdaNombre);
        
        // Valoración del aspecto
        const celdaValoracion = document.createElement('td');
        const badge = document.createElement('div');
        badge.className = `valoracion-badge valoracion-${valoracion}`;
        badge.textContent = TRADUCCIONES.importancia[valoracion] || 'No especificado';
        celdaValoracion.appendChild(badge);
        fila.appendChild(celdaValoracion);
        
        tablaAspectos.appendChild(fila);
    });
}

// Exportar funciones para que sean accesibles desde el iframe
window.inicializarVistaAdminModulo = inicializarVistaAdminModulo;
window.cargarDatosFormulario = cargarDatosFormulario;
