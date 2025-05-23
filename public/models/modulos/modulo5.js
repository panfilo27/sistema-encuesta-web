/* =====================================================
   Modelo de Datos de Desempeño Profesional: Manejo de datos del módulo 5
   ===================================================== */

/**
 * Función para crear un objeto de datos de desempeño profesional
 * @param {HTMLFormElement} form - El formulario con los datos
 * @param {Object} adicionales - Datos adicionales como el UID
 * @returns {Object} - Objeto con los datos de desempeño profesional
 */
window.crearModulo5DesdeFormulario = function(form, adicionales = {}) {
  if (!form) return null;
  
  // Datos base
  const datos = {
    // Eficiencia para realizar actividades laborales
    eficiencia: form.eficiencia?.value || '',
    
    // Calificación de la formación académica
    formacionAcademica: form.formacion?.value || '',
    
    // Utilidad de las residencias profesionales
    utilidadResidencias: form.residencias?.value || '',
    
    // Valoración de aspectos para contratación
    aspectos: {
      areaEstudio: form.area_estudio?.value || '',
      titulacion: form.titulacion?.value || '',
      experienciaPrevia: form.experiencia?.value || '',
      competenciaLaboral: form.competencia?.value || '',
      posicionamientoInstitucion: form.posicionamiento?.value || '',
      conocimientoIdiomas: form.idiomas?.value || '',
      recomendaciones: form.recomendaciones?.value || '',
      personalidad: form.personalidad?.value || '',
      capacidadLiderazgo: form.liderazgo?.value || '',
      otrosFactor: form.otros_factores?.value || '',
      otrosValoracion: form.otros?.value || ''
    },
    
    // Metadata
    uid: adicionales.uid || null,
    timestamp: new Date().toISOString()
  };
  
  return datos;
}

/**
 * Función para parsear datos de desempeño profesional desde Firestore
 * @param {Object} data - Datos crudos desde Firestore
 * @returns {Object} - Objeto de desempeño profesional estructurado
 */
window.parseModulo5Firestore = function(data) {
  if (!data) return null;
  
  return {
    // Eficiencia para realizar actividades laborales
    eficiencia: data.eficiencia || '',
    
    // Calificación de la formación académica
    formacionAcademica: data.formacionAcademica || '',
    
    // Utilidad de las residencias profesionales
    utilidadResidencias: data.utilidadResidencias || '',
    
    // Valoración de aspectos para contratación
    aspectos: {
      areaEstudio: data.aspectos?.areaEstudio || '',
      titulacion: data.aspectos?.titulacion || '',
      experienciaPrevia: data.aspectos?.experienciaPrevia || '',
      competenciaLaboral: data.aspectos?.competenciaLaboral || '',
      posicionamientoInstitucion: data.aspectos?.posicionamientoInstitucion || '',
      conocimientoIdiomas: data.aspectos?.conocimientoIdiomas || '',
      recomendaciones: data.aspectos?.recomendaciones || '',
      personalidad: data.aspectos?.personalidad || '',
      capacidadLiderazgo: data.aspectos?.capacidadLiderazgo || '',
      otrosFactor: data.aspectos?.otrosFactor || '',
      otrosValoracion: data.aspectos?.otrosValoracion || ''
    },
    
    // Metadata
    uid: data.uid || null,
    timestamp: data.timestamp || null,
    ultimaModificacion: data.ultimaModificacion || null
  };
}
