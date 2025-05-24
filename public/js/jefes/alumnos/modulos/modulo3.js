/**
 * Módulo 3: Ubicación Laboral - Vista Admin
 * Este archivo maneja la funcionalidad para mostrar los datos del módulo 3
 * en el panel de administración.
 */

// Variables globales
let datosModulo = null;
let db = null;
let alumnoId = null;
let encuestaId = null;

// Mapeo para traducciones de valores
const TRADUCCIONES = {
    // Actividad actual
    actividad_actual: {
        "estudia": "Estudio",
        "trabaja": "Trabajo",
        "trabaja_estudia": "Estudio y trabajo",
        "ninguna": "No estudio ni trabajo"
    },
    // Tipo de estudio
    tipo_estudio: {
        "maestria": "Maestría",
        "doctorado": "Doctorado",
        "especialidad": "Especialidad",
        "licenciatura": "Otra licenciatura",
        "diplomado": "Diplomado",
        "curso": "Curso de actualización",
        "otro": "Otro"
    },
    // Sector empresa
    sector_empresa: {
        "publico": "Público",
        "privado": "Privado",
        "educativo": "Educativo",
        "social": "Social",
        "otro": "Otro"
    },
    // Tipo contratación
    tipo_contratacion: {
        "base": "Base/Planta",
        "temporal": "Temporal/Contrato",
        "proyectos": "Por proyectos",
        "honorarios": "Honorarios",
        "otro": "Otro"
    },
    // Antigüedad
    antiguedad: {
        "menos_6m": "Menos de 6 meses",
        "6m_1a": "Entre 6 meses y 1 año",
        "1a_2a": "Entre 1 y 2 años",
        "mas_2a": "Más de 2 años"
    },
    // Nivel jerárquico
    nivel_jerarquico: {
        "directivo": "Directivo",
        "mando_medio": "Mando medio",
        "supervisor": "Supervisor",
        "tecnico": "Técnico",
        "operativo": "Operativo",
        "otro": "Otro"
    },
    // Relación con estudios
    relacion_estudios: {
        "alta": "Alta (directamente relacionado)",
        "media": "Media (parcialmente relacionado)",
        "baja": "Baja (poco relacionado)",
        "nula": "Nula (no relacionado)"
    },
    // Satisfacción trabajo
    satisfaccion_trabajo: {
        "muy_satisfecho": "Muy satisfecho",
        "satisfecho": "Satisfecho",
        "neutral": "Neutral",
        "insatisfecho": "Insatisfecho",
        "muy_insatisfecho": "Muy insatisfecho"
    },
    // Rango salarial
    rango_salario: {
        "menos_5000": "Menos de $5,000",
        "5000_10000": "Entre $5,000 y $10,000",
        "10000_15000": "Entre $10,000 y $15,000",
        "15000_20000": "Entre $15,000 y $20,000",
        "mas_20000": "Más de $20,000"
    },
    // Tiempo sin empleo
    tiempo_sin_empleo: {
        "menos_3m": "Menos de 3 meses",
        "3m_6m": "Entre 3 y 6 meses",
        "6m_1a": "Entre 6 meses y 1 año",
        "mas_1a": "Más de 1 año"
    },
    // Motivo desempleo
    motivo_desempleo: {
        "continuar_estudios": "Decidí continuar estudiando",
        "no_encontrado": "No he encontrado trabajo",
        "salario_insuficiente": "Salarios insuficientes",
        "razones_personales": "Razones personales",
        "otro": "Otro"
    },
    // Dificultades empleo
    dificultades_empleo: {
        "falta_experiencia": "Falta de experiencia",
        "falta_vacantes": "Falta de vacantes en mi área",
        "bajos_salarios": "Bajos salarios ofrecidos",
        "falta_conocimientos": "Falta de conocimientos específicos",
        "falta_ingles": "Falta de dominio del inglés",
        "otro": "Otro"
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
        console.log('Inicializando vista admin para Módulo 3', datos);
        
        // Guardar los datos
        datosModulo = datos;
        alumnoId = datos.alumnoId;
        encuestaId = datos.encuestaId;
        
        // Verificar si el modelo de Módulo 3 está disponible
        if (typeof parseModulo3Firestore !== 'function') {
            cargarModeloModulo3();
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
        console.error('Error al inicializar vista admin del módulo 3:', error);
        alert('Error al cargar los datos del módulo. Por favor, inténtelo de nuevo.');
    }
}

/**
 * Carga el modelo del Módulo 3 dinámicamente
 */
function cargarModeloModulo3() {
    const scriptModelo = document.createElement('script');
    scriptModelo.src = '../../../../models/modulos/modulo3.js';
    scriptModelo.onload = function() {
        console.log('Modelo Módulo 3 cargado correctamente');
        cargarDatosFormulario();
    };
    scriptModelo.onerror = function() {
        console.error('Error al cargar el modelo Módulo 3');
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
        
        // Utilizar el modelo parseModulo3Firestore si está disponible
        if (typeof parseModulo3Firestore === 'function') {
            datosProcesados = parseModulo3Firestore(datosModulo.datos);
        } else {
            datosProcesados = datosModulo.datos;
        }
        
        // Mostrar actividad actual
        const actividadActual = datosProcesados.actividad_actual;
        document.getElementById('actividad-actual').textContent = 
            TRADUCCIONES.actividad_actual[actividadActual] || actividadActual || 'No especificado';
        
        // Establecer badge
        const badgeActividad = document.getElementById('badge-actividad');
        if (actividadActual === 'estudia') {
            badgeActividad.textContent = 'ESTUDIA';
            badgeActividad.className = 'badge badge-estudio';
        } else if (actividadActual === 'trabaja') {
            badgeActividad.textContent = 'TRABAJA';
            badgeActividad.className = 'badge badge-trabajo';
        } else if (actividadActual === 'trabaja_estudia') {
            badgeActividad.textContent = 'ESTUDIA Y TRABAJA';
            badgeActividad.className = 'badge badge-ambos';
        } else if (actividadActual === 'ninguna') {
            badgeActividad.textContent = 'NO ESTUDIA NI TRABAJA';
            badgeActividad.className = 'badge badge-ninguno';
        }
        
        // Mostrar secciones condicionales según actividad
        mostrarSeccionEstudios(datosProcesados, actividadActual);
        mostrarSeccionTrabajo(datosProcesados, actividadActual);
        mostrarSeccionDesempleo(datosProcesados, actividadActual);
        
        // Mostrar comentario
        if (datosProcesados.comentario_laboral && datosProcesados.comentario_laboral.trim()) {
            document.getElementById('comentario-laboral').innerHTML = `<p>${datosProcesados.comentario_laboral}</p>`;
        } else {
            document.getElementById('comentario-laboral').innerHTML = '<p class="comentario-vacio">El alumno no proporcionó comentarios adicionales.</p>';
        }
        
    } catch (error) {
        console.error('Error al cargar datos en el formulario:', error);
        alert('Error al mostrar los datos del módulo: ' + error.message);
    }
}

/**
 * Muestra la sección de estudios si corresponde
 * @param {Object} datos - Datos procesados del módulo
 * @param {string} actividad - Actividad actual del alumno
 */
function mostrarSeccionEstudios(datos, actividad) {
    const seccionEstudios = document.getElementById('seccion-estudios');
    
    if (actividad === 'estudia' || actividad === 'trabaja_estudia') {
        seccionEstudios.style.display = 'block';
        
        // Mostrar tipo de estudio
        const tipoEstudio = datos.tipo_estudio;
        document.getElementById('tipo-estudio').textContent = 
            TRADUCCIONES.tipo_estudio[tipoEstudio] || tipoEstudio || 'No especificado';
        
        // Mostrar otro estudio si corresponde
        if (tipoEstudio === 'otro' && datos.otro_estudio) {
            document.getElementById('campo-otro-estudio').style.display = 'block';
            document.getElementById('otro-estudio').textContent = datos.otro_estudio;
        } else {
            document.getElementById('campo-otro-estudio').style.display = 'none';
        }
        
        // Mostrar institución y especialidad
        document.getElementById('institucion-educativa').textContent = datos.institucion_educativa || 'No especificado';
        document.getElementById('especialidad-posgrado').textContent = datos.especialidad_posgrado || 'No especificado';
    } else {
        seccionEstudios.style.display = 'none';
    }
}

/**
 * Muestra la sección de trabajo si corresponde
 * @param {Object} datos - Datos procesados del módulo
 * @param {string} actividad - Actividad actual del alumno
 */
function mostrarSeccionTrabajo(datos, actividad) {
    const seccionTrabajo = document.getElementById('seccion-trabajo');
    
    if (actividad === 'trabaja' || actividad === 'trabaja_estudia') {
        seccionTrabajo.style.display = 'block';
        
        // Información de la empresa
        document.getElementById('nombre-empresa').textContent = datos.nombre_empresa || 'No especificado';
        document.getElementById('puesto').textContent = datos.puesto || 'No especificado';
        document.getElementById('sector-empresa').textContent = 
            TRADUCCIONES.sector_empresa[datos.sector_empresa] || datos.sector_empresa || 'No especificado';
        
        // Información del empleo
        document.getElementById('tipo-contratacion').textContent = 
            TRADUCCIONES.tipo_contratacion[datos.tipo_contratacion] || datos.tipo_contratacion || 'No especificado';
        document.getElementById('antiguedad').textContent = 
            TRADUCCIONES.antiguedad[datos.antiguedad] || datos.antiguedad || 'No especificado';
        document.getElementById('nivel-jerarquico').textContent = 
            TRADUCCIONES.nivel_jerarquico[datos.nivel_jerarquico] || datos.nivel_jerarquico || 'No especificado';
        
        // Relación y satisfacción
        document.getElementById('relacion-estudios').textContent = 
            TRADUCCIONES.relacion_estudios[datos.relacion_estudios] || datos.relacion_estudios || 'No especificado';
        document.getElementById('satisfaccion-trabajo').textContent = 
            TRADUCCIONES.satisfaccion_trabajo[datos.satisfaccion_trabajo] || datos.satisfaccion_trabajo || 'No especificado';
        
        // Salario
        document.getElementById('rango-salario').textContent = 
            TRADUCCIONES.rango_salario[datos.rango_salario] || datos.rango_salario || 'No especificado';
    } else {
        seccionTrabajo.style.display = 'none';
    }
}

/**
 * Muestra la sección de desempleo si corresponde
 * @param {Object} datos - Datos procesados del módulo
 * @param {string} actividad - Actividad actual del alumno
 */
function mostrarSeccionDesempleo(datos, actividad) {
    const seccionDesempleo = document.getElementById('seccion-desempleo');
    
    if (actividad === 'ninguna') {
        seccionDesempleo.style.display = 'block';
        
        // Información de desempleo
        document.getElementById('tiempo-sin-empleo').textContent = 
            TRADUCCIONES.tiempo_sin_empleo[datos.tiempo_sin_empleo] || datos.tiempo_sin_empleo || 'No especificado';
        document.getElementById('motivo-desempleo').textContent = 
            TRADUCCIONES.motivo_desempleo[datos.motivo_desempleo] || datos.motivo_desempleo || 'No especificado';
        document.getElementById('dificultades-empleo').textContent = 
            TRADUCCIONES.dificultades_empleo[datos.dificultades_empleo] || datos.dificultades_empleo || 'No especificado';
    } else {
        seccionDesempleo.style.display = 'none';
    }
}

// Exportar funciones para que sean accesibles desde el iframe
window.inicializarVistaAdminModulo = inicializarVistaAdminModulo;
window.cargarDatosFormulario = cargarDatosFormulario;
