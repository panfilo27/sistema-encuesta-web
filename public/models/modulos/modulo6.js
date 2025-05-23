/* =====================================================
   Modelo de Datos para el Módulo 6: Expectativas y Participación Social
   ===================================================== */

/**
 * Función para crear un objeto de datos desde el formulario
 * @param {HTMLFormElement} form - El formulario con los datos
 * @param {Object} adicionales - Datos adicionales como el UID
 * @returns {Object} - Objeto con los datos estructurados
 */
window.crearModulo6DesdeFormulario = function(form, adicionales = {}) {
  if (!form) return null;
  
  // Datos base
  const datos = {
    // Sección: Expectativas de Desarrollo
    expectativas: {
      // Cursos de actualización
      cursos_actualizacion: form.cursos_actualizacion?.value || '',
      cuales_cursos: form.cuales_cursos?.value || '',
      
      // Datos de posgrado
      tomar_posgrado: form.tomar_posgrado?.value || '',
      cual_posgrado: form.cual_posgrado?.value || '',
    },
    
    // Sección: Participación Social
    participacion: {
      // Pertenencia a organizaciones sociales
      organizaciones_sociales: form.organizaciones_sociales?.value || '',
      cuales_organizaciones: form.cuales_organizaciones?.value || '',
      
      // Pertenencia a organismos profesionales
      organismos_profesionales: form.organismos_profesionales?.value || '',
      cual_organismo: form.cual_organismo?.value || '',
      
      // Asociación de egresados
      asociacion_egresados: form.asociacion_egresados?.value || ''
    },
    
    // Metadata
    uid: adicionales.uid || null,
    timestamp: new Date().toISOString()
  };
  
  return datos;
}

/**
 * Función para parsear datos desde Firestore
 * @param {Object} data - Datos crudos desde Firestore
 * @returns {Object} - Objeto estructurado
 */
window.parseModulo6Firestore = function(data) {
  if (!data) return null;
  
  return {
    // Sección: Expectativas de Desarrollo
    expectativas: {
      // Cursos de actualización
      cursos_actualizacion: data.expectativas?.cursos_actualizacion || '',
      cuales_cursos: data.expectativas?.cuales_cursos || '',
      
      // Datos de posgrado
      tomar_posgrado: data.expectativas?.tomar_posgrado || '',
      cual_posgrado: data.expectativas?.cual_posgrado || '',
    },
    
    // Sección: Participación Social
    participacion: {
      // Pertenencia a organizaciones sociales
      organizaciones_sociales: data.participacion?.organizaciones_sociales || '',
      cuales_organizaciones: data.participacion?.cuales_organizaciones || '',
      
      // Pertenencia a organismos profesionales
      organismos_profesionales: data.participacion?.organismos_profesionales || '',
      cual_organismo: data.participacion?.cual_organismo || '',
      
      // Asociación de egresados
      asociacion_egresados: data.participacion?.asociacion_egresados || ''
    },
    
    // Metadata
    uid: data.uid || null,
    timestamp: data.timestamp || null,
    ultimaModificacion: data.ultimaModificacion || null
  };
}
