/**
 * Módulo 2: Evaluación de la Formación Académica
 * 
 * Este módulo captura la evaluación del egresado sobre su experiencia académica
 * en la institución, incluyendo calidad docente, plan de estudios, infraestructura
 * y otros aspectos relevantes de su formación profesional.
 */

/**
 * Crea un objeto de datos del módulo 2 a partir de un formulario
 * @param {HTMLFormElement} form - Formulario con los datos de evaluación
 * @param {Object} userData - Datos del usuario actual (opcional)
 * @returns {Object} - Objeto con los datos de evaluación del módulo 2
 */
function crearModulo2DesdeFormulario(form, userData = {}) {
  if (!form) {
    console.error('No se proporcionó un formulario válido para el Módulo 2');
    return null;
  }
  
  return {
    // Identificación
    uid: userData?.uid || '',
    
    // Calificaciones de aspectos académicos (escala 1-5)
    calidad_docentes: form.calidad_docentes?.value || '',
    plan_estudios: form.plan_estudios?.value || '',
    oportunidad_proyectos: form.oportunidad_proyectos?.value || '',
    enfasis_investigacion: form.enfasis_investigacion?.value || '',
    satisfaccion_infraestructura: form.satisfaccion_infraestructura?.value || '',
    experiencia_residencia: form.experiencia_residencia?.value || '',
    
    // Comentarios adicionales
    comentario_formacion: (form.comentario_formacion?.value || '').trim(),
    
    // Metadata
    completado: true,
    fechaCompletado: new Date(),
    moduloId: 'modulo2'
  };
}

/**
 * Convierte los datos de Firestore al formato del Módulo 2
 * @param {Object} data - Datos obtenidos de Firestore
 * @returns {Object} - Objeto con los datos del Módulo 2
 */
function parseModulo2Firestore(data) {
  if (!data) return null;
  
  return {
    // Identificación
    uid: data.uid || '',
    
    // Calificaciones de aspectos académicos
    calidad_docentes: data.calidad_docentes || '',
    plan_estudios: data.plan_estudios || '',
    oportunidad_proyectos: data.oportunidad_proyectos || '',
    enfasis_investigacion: data.enfasis_investigacion || '',
    satisfaccion_infraestructura: data.satisfaccion_infraestructura || '',
    experiencia_residencia: data.experiencia_residencia || '',
    
    // Comentarios adicionales
    comentario_formacion: data.comentario_formacion || '',
    
    // Metadata
    completado: data.completado === true,
    fechaCompletado: data.fechaCompletado || null,
    moduloId: 'modulo2'
  };
}

/**
 * Valida los campos obligatorios del Módulo 2
 * @param {Object} datos - Datos del Módulo 2
 * @returns {Object} - Resultado de la validación {valido: boolean, errores: []}
 */
function validarModulo2(datos) {
  const errores = [];
  
  // Validar que se hayan respondido todas las evaluaciones
  const camposObligatorios = [
    'calidad_docentes', 
    'plan_estudios', 
    'oportunidad_proyectos',
    'enfasis_investigacion',
    'satisfaccion_infraestructura',
    'experiencia_residencia'
  ];
  
  camposObligatorios.forEach(campo => {
    if (!datos[campo]) {
      const nombreCampo = campo.replace(/_/g, ' ');
      errores.push(`Debe evaluar el campo "${nombreCampo}"`);
    }
  });
  
  return {
    valido: errores.length === 0,
    errores: errores
  };
}

// Exportar funciones para uso global
window.crearModulo2DesdeFormulario = crearModulo2DesdeFormulario;
window.parseModulo2Firestore = parseModulo2Firestore;
window.validarModulo2 = validarModulo2;
