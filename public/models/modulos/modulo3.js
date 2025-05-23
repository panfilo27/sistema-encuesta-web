/* =====================================================
   Modelo de Ubicación Laboral: Manejo de datos del módulo 3
   ===================================================== */

/**
 * Función para crear un objeto de ubicación laboral a partir de un formulario
 * @param {HTMLFormElement} form - El formulario con los datos
 * @param {Object} adicionales - Datos adicionales como el UID
 * @returns {Object} - Objeto con los datos de ubicación laboral
 */
window.crearModulo3DesdeFormulario = function(form, adicionales = {}) {
  if (!form) return null;
  
  // Datos base
  const datos = {
    // Actividad actual
    actividad_actual: form.actividad_actual?.value || '',
    
    // Datos de estudios (si aplica)
    estudia: form.actividad_actual?.value?.includes('estudia') || false,
    tipo_estudio: form.tipo_estudio?.value || '',
    otro_estudio: form.otro_estudio?.value || '',
    institucion_educativa: form.institucion_educativa?.value || '',
    especialidad_posgrado: form.especialidad_posgrado?.value || '',
    
    // Datos de trabajo (si aplica)
    trabaja: form.actividad_actual?.value?.includes('trabaja') || false,
    nombre_empresa: form.nombre_empresa?.value || '',
    puesto: form.puesto?.value || '',
    sector_empresa: form.sector_empresa?.value || '',
    tipo_contratacion: form.tipo_contratacion?.value || '',
    antiguedad: form.antiguedad?.value || '',
    nivel_jerarquico: form.nivel_jerarquico?.value || '',
    relacion_estudios: form.relacion_estudios?.value || '',
    satisfaccion_trabajo: form.satisfaccion_trabajo?.value || '',
    
    // Salario
    rango_salario: form.rango_salario?.value || '',
    
    // Datos de búsqueda (si no trabaja)
    tiempo_sin_empleo: form.tiempo_sin_empleo?.value || '',
    motivo_desempleo: form.motivo_desempleo?.value || '',
    dificultades_empleo: form.dificultades_empleo?.value || '',
    
    // Comentarios adicionales
    comentario_laboral: form.comentario_laboral?.value || '',
    
    // Metadata
    uid: adicionales.uid || null,
    timestamp: new Date().toISOString()
  };
  
  return datos;
}

/**
 * Función para parsear datos de ubicación laboral desde Firestore
 * @param {Object} data - Datos crudos desde Firestore
 * @returns {Object} - Objeto de ubicación laboral estructurado
 */
window.parseModulo3Firestore = function(data) {
  if (!data) return null;
  
  return {
    // Actividad actual
    actividad_actual: data.actividad_actual || '',
    
    // Datos de estudios
    estudia: data.estudia === true,
    tipo_estudio: data.tipo_estudio || '',
    otro_estudio: data.otro_estudio || '',
    institucion_educativa: data.institucion_educativa || '',
    especialidad_posgrado: data.especialidad_posgrado || '',
    
    // Datos de trabajo
    trabaja: data.trabaja === true,
    nombre_empresa: data.nombre_empresa || '',
    puesto: data.puesto || '',
    sector_empresa: data.sector_empresa || '',
    tipo_contratacion: data.tipo_contratacion || '',
    antiguedad: data.antiguedad || '',
    nivel_jerarquico: data.nivel_jerarquico || '',
    relacion_estudios: data.relacion_estudios || '',
    satisfaccion_trabajo: data.satisfaccion_trabajo || '',
    
    // Salario
    rango_salario: data.rango_salario || '',
    
    // Datos de búsqueda
    tiempo_sin_empleo: data.tiempo_sin_empleo || '',
    motivo_desempleo: data.motivo_desempleo || '',
    dificultades_empleo: data.dificultades_empleo || '',
    
    // Comentarios adicionales
    comentario_laboral: data.comentario_laboral || '',
    
    // Metadata
    uid: data.uid || null,
    timestamp: data.timestamp || null,
    ultimaModificacion: data.ultimaModificacion || null
  };
}
