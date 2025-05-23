/* =====================================================
   Modelo de Datos de Empleo: Manejo de datos del módulo 4
   ===================================================== */

/**
 * Función para crear un objeto de datos de empleo a partir de un formulario
 * @param {HTMLFormElement} form - El formulario con los datos
 * @param {Object} adicionales - Datos adicionales como el UID
 * @returns {Object} - Objeto con los datos de empleo
 */
window.crearModulo4DesdeFormulario = function(form, adicionales = {}) {
  if (!form) return null;
  
  // Datos base
  const datos = {
    // Tiempo para obtener empleo
    tiempo_primer_empleo: form.tiempo_primer_empleo?.value || '',
    
    // Medio para obtener empleo
    medio_obtener_empleo: form.medio_obtener_empleo?.value || '',
    medio_otro: form.medio_otro?.value || '',
    
    // Requisitos de contratación
    requisitos_contratacion: obtenerRequisitosSeleccionados(form),
    requisito_otro: form.requisito_otro?.value || '',
    
    // Idioma
    idioma: obtenerIdiomaSeleccionado(form),
    idioma_otro: form.idioma_otro?.value || '',
    
    // Habilidades del idioma (porcentajes)
    habilidad_hablar: parseInt(form.habilidad_hablar?.value || 0),
    habilidad_escribir: parseInt(form.habilidad_escribir?.value || 0),
    habilidad_leer: parseInt(form.habilidad_leer?.value || 0),
    habilidad_escuchar: parseInt(form.habilidad_escuchar?.value || 0),
    
    // Antigüedad
    antiguedad: form.antiguedad?.value || '',
    anio_ingreso: form.anio_ingreso?.value || '',
    
    // Datos económicos y jerárquicos
    ingreso: form.ingreso?.value || '',
    nivel_jerarquico: form.nivel_jerarquico?.value || '',
    
    // Condición de trabajo
    condicion_trabajo: form.condicion_trabajo?.value || '',
    condicion_otro: form.condicion_otro?.value || '',
    
    // Metadata
    uid: adicionales.uid || null,
    timestamp: new Date().toISOString()
  };
  
  return datos;
}

/**
 * Función para parsear datos de empleo desde Firestore
 * @param {Object} data - Datos crudos desde Firestore
 * @returns {Object} - Objeto de empleo estructurado
 */
window.parseModulo4Firestore = function(data) {
  if (!data) return null;
  
  return {
    // Tiempo para obtener empleo
    tiempo_primer_empleo: data.tiempo_primer_empleo || '',
    
    // Medio para obtener empleo
    medio_obtener_empleo: data.medio_obtener_empleo || '',
    medio_otro: data.medio_otro || '',
    
    // Requisitos de contratación
    requisitos_contratacion: data.requisitos_contratacion || [],
    requisito_otro: data.requisito_otro || '',
    
    // Idioma
    idioma: data.idioma || '',
    idioma_otro: data.idioma_otro || '',
    
    // Habilidades del idioma
    habilidad_hablar: data.habilidad_hablar || 0,
    habilidad_escribir: data.habilidad_escribir || 0,
    habilidad_leer: data.habilidad_leer || 0,
    habilidad_escuchar: data.habilidad_escuchar || 0,
    
    // Antigüedad
    antiguedad: data.antiguedad || '',
    anio_ingreso: data.anio_ingreso || '',
    
    // Datos económicos y jerárquicos
    ingreso: data.ingreso || '',
    nivel_jerarquico: data.nivel_jerarquico || '',
    
    // Condición de trabajo
    condicion_trabajo: data.condicion_trabajo || '',
    condicion_otro: data.condicion_otro || '',
    
    // Metadata
    uid: data.uid || null,
    timestamp: data.timestamp || null,
    ultimaModificacion: data.ultimaModificacion || null
  };
}

/**
 * Función auxiliar para obtener los requisitos de contratación seleccionados
 * @param {HTMLFormElement} form - El formulario
 * @returns {Array} - Array de requisitos seleccionados
 */
function obtenerRequisitosSeleccionados(form) {
  const requisitos = [];
  
  if (form.requisito_competencias?.checked) requisitos.push('competencias_laborales');
  if (form.requisito_titulo?.checked) requisitos.push('titulo_profesional');
  if (form.requisito_examen?.checked) requisitos.push('examen_seleccion');
  if (form.requisito_idioma?.checked) requisitos.push('idioma_extranjero');
  if (form.requisito_actitudes?.checked) requisitos.push('actitudes_habilidades');
  if (form.requisito_ninguno?.checked) requisitos.push('ninguno');
  if (form.requisito_otro?.checked) requisitos.push('otro');
  
  return requisitos;
}

/**
 * Función auxiliar para obtener el idioma seleccionado
 * @param {HTMLFormElement} form - El formulario
 * @returns {String} - Idioma seleccionado
 */
function obtenerIdiomaSeleccionado(form) {
  if (form.idioma_ingles?.checked) return 'ingles';
  if (form.idioma_frances?.checked) return 'frances';
  if (form.idioma_aleman?.checked) return 'aleman';
  if (form.idioma_japones?.checked) return 'japones';
  if (form.idioma_otro?.checked) return 'otro';
  
  return '';
}
