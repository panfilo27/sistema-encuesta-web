/**
 * Módulo 1: Datos Personales del Egresado
 * 
 * Este módulo captura información personal y demográfica básica sobre el egresado,
 * incluyendo datos de contacto, información académica y estado laboral/académico actual.
 * Es el primer paso en la encuesta de seguimiento de egresados.
 */

/**
 * Crea un objeto de datos del módulo 1 a partir de un formulario
 * @param {HTMLFormElement} form - Formulario con los datos personales
 * @param {Object} userData - Datos del usuario actual (opcional)
 * @returns {Object} - Objeto con los datos personales del módulo 1
 */
function crearModulo1DesdeFormulario(form, userData = {}) {
  if (!form) {
    console.error('No se proporcionó un formulario válido para el Módulo 1');
    return null;
  }
  
  return {
    // Identificación
    uid: userData?.uid || '',
    email: (form.email?.value || userData?.email || '').trim(),
    
    // Datos personales
    nombre: (form.nombre?.value || '').trim(),
    apellidoPaterno: (form.apellidoPaterno?.value || '').trim(),
    apellidoMaterno: (form.apellidoMaterno?.value || '').trim(),
    noControl: (form.noControl?.value || '').trim(),
    fechaNacimiento: form.fechaNacimiento?.value || '',
    curp: (form.curp?.value || '').trim(),
    sexo: form.sexo?.value || '',
    estadoCivil: form.estadoCivil?.value || '',
    
    // Ubicación y contacto
    domicilio: (form.domicilio?.value || '').trim(),
    ciudad: (form.ciudad?.value || '').trim(),
    municipio: (form.municipio?.value || '').trim(),
    estado: (form.estado?.value || '').trim(),
    telefono: (form.telefono?.value || '').trim(),
    telCasa: (form.telCasa?.value || '').trim(),
    
    // Información académica
    carrera: form.carrera?.value || '',
    titulado: form.titulado?.value === 'Si',
    trabaja: !!form.trabaja?.checked,
    estudia: !!form.estudia?.checked,
    mesEgreso: form.mesEgreso?.value || '',
    
    // Habilidades
    idiomas: obtenerIdiomasSeleccionados(form),
    paquetes: obtenerPaquetesSeleccionados(form),
    
    // Metadata
    completado: true,
    fechaCompletado: new Date(),
    moduloId: 'modulo1'
  };
}

/**
 * Extrae los idiomas seleccionados del formulario
 * @param {HTMLFormElement} form - Formulario con los datos
 * @returns {Array} - Array de idiomas seleccionados
 */
function obtenerIdiomasSeleccionados(form) {
  const idiomas = [];
  
  // Procesar checkboxes de idiomas
  if (form.idiomaIngles?.checked) idiomas.push('Inglés');
  if (form.idiomaFrances?.checked) idiomas.push('Francés');
  if (form.idiomaAleman?.checked) idiomas.push('Alemán');
  if (form.idiomaJapones?.checked) idiomas.push('Japonés');
  if (form.idiomaItaliano?.checked) idiomas.push('Italiano');
  if (form.idiomaChino?.checked) idiomas.push('Chino');
  
  // Procesar idioma adicional si está presente
  const otroIdioma = form.otroIdioma?.value?.trim();
  if (otroIdioma) idiomas.push(otroIdioma);
  
  return idiomas;
}

/**
 * Extrae los paquetes computacionales seleccionados del formulario
 * @param {HTMLFormElement} form - Formulario con los datos
 * @returns {Array} - Array de paquetes seleccionados
 */
function obtenerPaquetesSeleccionados(form) {
  const paquetes = [];
  
  // Procesar checkboxes de paquetes
  if (form.paqueteWord?.checked) paquetes.push('Word');
  if (form.paqueteExcel?.checked) paquetes.push('Excel');
  if (form.paquetePowerPoint?.checked) paquetes.push('PowerPoint');
  if (form.paqueteAccess?.checked) paquetes.push('Access');
  if (form.paqueteCAD?.checked) paquetes.push('AutoCAD');
  if (form.paqueteSolidWorks?.checked) paquetes.push('SolidWorks');
  if (form.paquetePhotoshop?.checked) paquetes.push('Photoshop');
  if (form.paqueteIllustrator?.checked) paquetes.push('Illustrator');
  if (form.paqueteAdobePremiere?.checked) paquetes.push('Adobe Premiere');
  
  // Procesar paquetes adicionales si están presentes
  const otrosPaquetes = form.otrosPaquetes?.value?.trim();
  if (otrosPaquetes) {
    const paquetesAdicionales = otrosPaquetes.split(',').map(p => p.trim()).filter(p => p);
    paquetes.push(...paquetesAdicionales);
  }
  
  return paquetes;
}

/**
 * Convierte los datos de Firestore al formato del Módulo 1
 * @param {Object} data - Datos obtenidos de Firestore
 * @returns {Object} - Objeto con los datos del Módulo 1
 */
function parseModulo1Firestore(data) {
  if (!data) return null;
  
  return {
    // Identificación
    uid: data.uid || '',
    email: data.email || '',
    
    // Datos personales
    nombre: data.nombre || '',
    apellidoPaterno: data.apellidoPaterno || '',
    apellidoMaterno: data.apellidoMaterno || '',
    noControl: data.noControl || '',
    fechaNacimiento: data.fechaNacimiento || '',
    curp: data.curp || '',
    sexo: data.sexo || '',
    estadoCivil: data.estadoCivil || '',
    
    // Ubicación y contacto
    domicilio: data.domicilio || '',
    ciudad: data.ciudad || '',
    municipio: data.municipio || '',
    estado: data.estado || '',
    telefono: data.telefono || '',
    telCasa: data.telCasa || '',
    
    // Información académica
    carrera: data.carrera || '',
    titulado: data.titulado === true,
    trabaja: data.trabaja === true,
    estudia: data.estudia === true,
    mesEgreso: data.mesEgreso || '',
    
    // Habilidades
    idiomas: Array.isArray(data.idiomas) ? data.idiomas : [],
    paquetes: Array.isArray(data.paquetes) ? data.paquetes : [],
    
    // Metadata
    completado: data.completado === true,
    fechaCompletado: data.fechaCompletado || null,
    moduloId: 'modulo1'
  };
}

/**
 * Valida los campos obligatorios del Módulo 1
 * @param {Object} datos - Datos del Módulo 1
 * @returns {Object} - Resultado de la validación {valido: boolean, errores: []}
 */
function validarModulo1(datos) {
  const errores = [];
  
  // Validar campos obligatorios
  if (!datos.nombre) errores.push('El nombre es obligatorio');
  if (!datos.apellidoPaterno) errores.push('El apellido paterno es obligatorio');
  if (!datos.noControl) errores.push('El número de control es obligatorio');
  if (!datos.fechaNacimiento) errores.push('La fecha de nacimiento es obligatoria');
  if (!datos.sexo) errores.push('El sexo es obligatorio');
  if (!datos.estadoCivil) errores.push('El estado civil es obligatorio');
  if (!datos.carrera) errores.push('La carrera es obligatoria');
  if (!datos.mesEgreso) errores.push('El mes de egreso es obligatorio');
  
  // Validar al menos un medio de contacto
  if (!datos.telefono && !datos.telCasa && !datos.email) {
    errores.push('Debe proporcionar al menos un medio de contacto (teléfono, teléfono de casa o email)');
  }
  
  return {
    valido: errores.length === 0,
    errores: errores
  };
}

// Exportar funciones para uso global
window.crearModulo1DesdeFormulario = crearModulo1DesdeFormulario;
window.parseModulo1Firestore = parseModulo1Firestore;
window.validarModulo1 = validarModulo1;
