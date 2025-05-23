/* =====================================================
   Modelo de Datos para el Módulo 7: Comentarios y Sugerencias
   ===================================================== */

/**
 * Función para crear un objeto de datos desde el formulario
 * @param {HTMLFormElement} form - El formulario con los datos
 * @param {Object} adicionales - Datos adicionales como el UID
 * @returns {Object} - Objeto con los datos estructurados
 */
window.crearModulo7DesdeFormulario = function(form, adicionales = {}) {
  if (!form) return null;
  
  // Datos base
  const datos = {
    // Comentarios y sugerencias
    comentario: form.comentario?.value || '',
    
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
window.parseModulo7Firestore = function(data) {
  if (!data) return null;
  
  return {
    // Comentarios y sugerencias
    comentario: data.comentario || '',
    
    // Metadata
    uid: data.uid || null,
    timestamp: data.timestamp || null,
    ultimaModificacion: data.ultimaModificacion || null
  };
}
