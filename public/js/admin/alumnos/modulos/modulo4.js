/**
 * Módulo 4: Datos de Empleo - Vista Admin
 * Este archivo maneja la funcionalidad para mostrar los datos del módulo 4
 * en el panel de administración.
 */

// Variables globales
let datosModulo = null;
let db = null;
let alumnoId = null;
let encuestaId = null;

// Mapeo para traducciones de valores
const TRADUCCIONES = {
    // Tiempo para obtener empleo
    tiempo_primer_empleo: {
        "antes_egresar": "Antes de egresar",
        "menos_6meses": "Menos de 6 meses",
        "6meses_1anio": "Entre 6 meses y un año",
        "mas_1anio": "Más de un año"
    },
    // Medio para obtener empleo
    medio_obtener_empleo: {
        "bolsa_trabajo": "Bolsa de trabajo del plantel",
        "servicio_social": "Por servicio social",
        "residencia": "Por residencia profesional",
        "recomendacion": "Por recomendación familiar o amigos",
        "medios": "Por medios masivos de comunicación",
        "otro": "Otro"
    },
    // Requisitos de contratación
    requisitos_contratacion: {
        "competencias_laborales": "Competencias laborales",
        "titulo_profesional": "Título profesional",
        "examen_seleccion": "Examen de selección",
        "idioma_extranjero": "Idioma extranjero",
        "actitudes_habilidades": "Actitudes y habilidades socio-comunicativas",
        "ninguno": "Ninguno",
        "otro": "Otro"
    },
    // Idioma
    idioma: {
        "ingles": "Inglés",
        "frances": "Francés",
        "aleman": "Alemán",
        "japones": "Japonés",
        "otro": "Otro"
    },
    // Antigüedad
    antiguedad: {
        "menos_1anio": "Menos de 1 año",
        "1anio_3anios": "Entre 1 y 3 años",
        "3anios_5anios": "Entre 3 y 5 años",
        "mas_5anios": "Más de 5 años"
    },
    // Ingreso
    ingreso: {
        "menos_5000": "Menos de $5,000",
        "5000_10000": "Entre $5,000 y $10,000",
        "10000_15000": "Entre $10,000 y $15,000",
        "15000_20000": "Entre $15,000 y $20,000",
        "mas_20000": "Más de $20,000"
    },
    // Nivel jerárquico
    nivel_jerarquico: {
        "operativo": "Operativo",
        "supervisor": "Supervisor",
        "mando_medio": "Mando medio",
        "directivo": "Directivo",
        "empresario": "Empresario"
    },
    // Condición de trabajo
    condicion_trabajo: {
        "base": "Base",
        "eventual": "Eventual",
        "contrato": "Contrato",
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
        console.log('Inicializando vista admin para Módulo 4', datos);
        
        // Guardar los datos
        datosModulo = datos;
        alumnoId = datos.alumnoId;
        encuestaId = datos.encuestaId;
        
        // Verificar si el modelo de Módulo 4 está disponible
        if (typeof parseModulo4Firestore !== 'function') {
            cargarModeloModulo4();
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
        console.error('Error al inicializar vista admin del módulo 4:', error);
        alert('Error al cargar los datos del módulo. Por favor, inténtelo de nuevo.');
    }
}

/**
 * Carga el modelo del Módulo 4 dinámicamente
 */
function cargarModeloModulo4() {
    const scriptModelo = document.createElement('script');
    scriptModelo.src = '/public/models/modulos/modulo4.js';
    scriptModelo.onload = function() {
        console.log('Modelo Módulo 4 cargado correctamente');
        cargarDatosFormulario();
    };
    scriptModelo.onerror = function() {
        console.error('Error al cargar el modelo Módulo 4');
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
        
        // Utilizar el modelo parseModulo4Firestore si está disponible
        if (typeof parseModulo4Firestore === 'function') {
            datosProcesados = parseModulo4Firestore(datosModulo.datos);
        } else {
            datosProcesados = datosModulo.datos;
        }
        
        // Tiempo y medio para obtener empleo
        mostrarTiempoYMedioEmpleo(datosProcesados);
        
        // Requisitos de contratación
        mostrarRequisitosContratacion(datosProcesados);
        
        // Idioma extranjero
        mostrarIdiomaExtranjero(datosProcesados);
        
        // Antigüedad
        mostrarAntiguedad(datosProcesados);
        
        // Datos económicos y jerárquicos
        mostrarDatosEconomicosJerarquicos(datosProcesados);
        
        // Condición de trabajo
        mostrarCondicionTrabajo(datosProcesados);
        
    } catch (error) {
        console.error('Error al cargar datos en el formulario:', error);
        alert('Error al mostrar los datos del módulo: ' + error.message);
    }
}

/**
 * Muestra la información de tiempo y medio para obtener empleo
 * @param {Object} datos - Datos procesados del módulo
 */
function mostrarTiempoYMedioEmpleo(datos) {
    // Tiempo para obtener primer empleo
    document.getElementById('tiempo-primer-empleo').textContent = 
        TRADUCCIONES.tiempo_primer_empleo[datos.tiempo_primer_empleo] || datos.tiempo_primer_empleo || 'No especificado';
    
    // Medio para obtener empleo
    document.getElementById('medio-obtener-empleo').textContent = 
        TRADUCCIONES.medio_obtener_empleo[datos.medio_obtener_empleo] || datos.medio_obtener_empleo || 'No especificado';
    
    // Mostrar otro medio si corresponde
    if (datos.medio_obtener_empleo === 'otro' && datos.medio_otro) {
        document.getElementById('campo-medio-otro').style.display = 'block';
        document.getElementById('medio-otro').textContent = datos.medio_otro;
    } else {
        document.getElementById('campo-medio-otro').style.display = 'none';
    }
}

/**
 * Muestra la información de requisitos de contratación
 * @param {Object} datos - Datos procesados del módulo
 */
function mostrarRequisitosContratacion(datos) {
    const listaRequisitos = document.getElementById('requisitos-contratacion');
    listaRequisitos.innerHTML = '';
    
    // Si no hay requisitos, mostrar mensaje
    if (!datos.requisitos_contratacion || datos.requisitos_contratacion.length === 0) {
        listaRequisitos.innerHTML = '<li>No se especificaron requisitos</li>';
        return;
    }
    
    // Agregar cada requisito a la lista
    datos.requisitos_contratacion.forEach(requisito => {
        const li = document.createElement('li');
        li.textContent = TRADUCCIONES.requisitos_contratacion[requisito] || requisito;
        listaRequisitos.appendChild(li);
        
        // Mostrar otro requisito si corresponde
        if (requisito === 'otro' && datos.requisito_otro) {
            document.getElementById('campo-requisito-otro').style.display = 'block';
            document.getElementById('requisito-otro').textContent = datos.requisito_otro;
        }
    });
    
    // Ocultar el campo de otro requisito si no se seleccionó "otro"
    if (!datos.requisitos_contratacion.includes('otro')) {
        document.getElementById('campo-requisito-otro').style.display = 'none';
    }
}

/**
 * Muestra la información de idioma extranjero
 * @param {Object} datos - Datos procesados del módulo
 */
function mostrarIdiomaExtranjero(datos) {
    // Idioma utilizado
    document.getElementById('idioma-utilizado').textContent = 
        TRADUCCIONES.idioma[datos.idioma] || datos.idioma || 'No especificado';
    
    // Mostrar otro idioma si corresponde
    if (datos.idioma === 'otro' && datos.idioma_otro) {
        document.getElementById('campo-idioma-otro').style.display = 'block';
        document.getElementById('idioma-otro').textContent = datos.idioma_otro;
    } else {
        document.getElementById('campo-idioma-otro').style.display = 'none';
    }
    
    // Mostrar habilidades del idioma (porcentajes)
    const habilidades = [
        { id: 'habilidad-hablar', value: datos.habilidad_hablar || 0 },
        { id: 'habilidad-escribir', value: datos.habilidad_escribir || 0 },
        { id: 'habilidad-leer', value: datos.habilidad_leer || 0 },
        { id: 'habilidad-escuchar', value: datos.habilidad_escuchar || 0 }
    ];
    
    habilidades.forEach(habilidad => {
        document.getElementById(habilidad.id).textContent = habilidad.value + '%';
        document.getElementById(habilidad.id + '-bar').style.width = habilidad.value + '%';
        
        // Cambiar color según el nivel
        const barElement = document.getElementById(habilidad.id + '-bar');
        if (habilidad.value < 30) {
            barElement.style.backgroundColor = '#f44336'; // Rojo
        } else if (habilidad.value < 70) {
            barElement.style.backgroundColor = '#ff9800'; // Naranja
        } else {
            barElement.style.backgroundColor = '#4caf50'; // Verde
        }
    });
}

/**
 * Muestra la información de antigüedad
 * @param {Object} datos - Datos procesados del módulo
 */
function mostrarAntiguedad(datos) {
    // Antigüedad
    document.getElementById('antiguedad-empleo').textContent = 
        TRADUCCIONES.antiguedad[datos.antiguedad] || datos.antiguedad || 'No especificado';
    
    // Año de ingreso
    document.getElementById('anio-ingreso').textContent = datos.anio_ingreso || 'No especificado';
}

/**
 * Muestra la información económica y jerárquica
 * @param {Object} datos - Datos procesados del módulo
 */
function mostrarDatosEconomicosJerarquicos(datos) {
    // Ingreso mensual
    document.getElementById('ingreso-mensual').textContent = 
        TRADUCCIONES.ingreso[datos.ingreso] || datos.ingreso || 'No especificado';
    
    // Nivel jerárquico
    document.getElementById('nivel-jerarquico').textContent = 
        TRADUCCIONES.nivel_jerarquico[datos.nivel_jerarquico] || datos.nivel_jerarquico || 'No especificado';
}

/**
 * Muestra la información de condición de trabajo
 * @param {Object} datos - Datos procesados del módulo
 */
function mostrarCondicionTrabajo(datos) {
    // Condición de trabajo
    document.getElementById('condicion-trabajo').textContent = 
        TRADUCCIONES.condicion_trabajo[datos.condicion_trabajo] || datos.condicion_trabajo || 'No especificado';
    
    // Mostrar otra condición si corresponde
    if (datos.condicion_trabajo === 'otro' && datos.condicion_otro) {
        document.getElementById('campo-condicion-otro').style.display = 'block';
        document.getElementById('condicion-otro').textContent = datos.condicion_otro;
    } else {
        document.getElementById('campo-condicion-otro').style.display = 'none';
    }
}

// Exportar funciones para que sean accesibles desde el iframe
window.inicializarVistaAdminModulo = inicializarVistaAdminModulo;
window.cargarDatosFormulario = cargarDatosFormulario;
