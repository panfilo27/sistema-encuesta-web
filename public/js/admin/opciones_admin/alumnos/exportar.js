/**
 * Módulo para exportación de datos de alumnos y encuestas
 * Este archivo maneja la funcionalidad para exportar a Excel la información
 * de los alumnos filtrados y sus respuestas a las encuestas.
 */

// Definición de preguntas por módulo para la exportación
const PREGUNTAS_MODULO1 = {
    "nombre": "Nombre(s)",
    "apellidoPaterno": "Apellido Paterno",
    "apellidoMaterno": "Apellido Materno",
    "numeroControl": "Número de Control",
    "telefono": "Teléfono",
    "email": "Correo Electrónico",
    "direccion": "Dirección",
    "ciudad": "Ciudad",
    "estado": "Estado",
    "codigoPostal": "Código Postal",
    "carrera": "Carrera",
    "especialidad": "Especialidad",
    "anioEgreso": "Año de Egreso",
    "mesEgreso": "Mes de Egreso",
    "titulado": "¿Está titulado?"
};

const PREGUNTAS_MODULO2 = {
    "calidadDocentes": "Calidad de los docentes",
    "planEstudios": "Plan de estudios",
    "oportunidadesPracticas": "Oportunidades de prácticas profesionales",
    "equipamientoLaboratorios": "Equipamiento de los laboratorios",
    "infraestructura": "Infraestructura de las instalaciones",
    "serviciosAdministrativos": "Servicios administrativos",
    "formacionPractica": "Formación práctica",
    "formacionTeorica": "Formación teórica",
    "empleabilidad": "Empleabilidad de la carrera",
    "satisfaccionGeneral": "Satisfacción general con la formación recibida"
};

/**
 * Inicializa el módulo de exportación
 */
function inicializarExportacion() {
    // Verificar si ya está inicializado
    if (window.exportacionInicializada) return;
    window.exportacionInicializada = true;
    
    console.log('Inicializando módulo de exportación');
    
    // Configurar evento para el botón de exportación
    document.getElementById('btn-exportar-excel')?.addEventListener('click', async () => {
        await exportarDatosAExcel();
    });
    
    // Cargar bibliotecas necesarias si no están ya cargadas
    if (typeof XLSX === 'undefined') {
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
        document.head.appendChild(script);
        
        script.onload = () => {
            console.log('Biblioteca XLSX cargada correctamente');
        };
    }
}

/**
 * Exporta los datos de los alumnos filtrados a Excel
 */
async function exportarDatosAExcel() {
    try {
        // Mostrar mensaje de carga
        mostrarMensajeCargando('Preparando datos para exportación...');
        
        // Obtener alumnos filtrados
        const alumnosParaExportar = alumnosFiltrados.length > 0 ? alumnosFiltrados : todosLosAlumnos;
        
        if (!alumnosParaExportar || alumnosParaExportar.length === 0) {
            mostrarMensaje('No hay alumnos para exportar', 'error');
            return;
        }
        
        console.log(`Exportando datos de ${alumnosParaExportar.length} alumnos...`);
        
        // Obtener datos de encuestas para cada alumno
        const datosCompletos = await obtenerDatosEncuestasAlumnos(alumnosParaExportar);
        
        // Crear hoja de Excel
        const workbook = XLSX.utils.book_new();
        
        // Crear hoja para el Módulo 1
        const datosModulo1 = prepararDatosExcel(datosCompletos, 1);
        const worksheetModulo1 = XLSX.utils.json_to_sheet(datosModulo1);
        XLSX.utils.book_append_sheet(workbook, worksheetModulo1, "Módulo 1 - Datos Personales");
        
        // Crear hoja para el Módulo 2
        const datosModulo2 = prepararDatosExcel(datosCompletos, 2);
        const worksheetModulo2 = XLSX.utils.json_to_sheet(datosModulo2);
        XLSX.utils.book_append_sheet(workbook, worksheetModulo2, "Módulo 2 - Evaluación");
        
        // Generar nombre del archivo
        let nombreArchivo = 'encuestas_alumnos';
        
        // Si hay un periodo seleccionado, añadirlo al nombre
        const filtroPeriodo = document.getElementById('filtro-periodo-encuesta');
        if (filtroPeriodo && filtroPeriodo.value) {
            const periodoSeleccionado = filtroPeriodo.options[filtroPeriodo.selectedIndex].text;
            nombreArchivo += '_' + periodoSeleccionado.replace(/[()]/g, '').replace(/\s+/g, '_');
        }
        
        // Añadir fecha actual
        const fechaActual = new Date().toISOString().split('T')[0];
        nombreArchivo += '_' + fechaActual;
        
        // Exportar archivo
        XLSX.writeFile(workbook, `${nombreArchivo}.xlsx`);
        
        mostrarMensaje('Datos exportados correctamente', 'success');
        
    } catch (error) {
        console.error('Error al exportar datos a Excel:', error);
        mostrarMensaje(`Error al exportar datos: ${error.message}`, 'error');
    }
}

/**
 * Obtiene los datos de encuestas para cada alumno
 * @param {Array} alumnos - Lista de alumnos para los que se quiere obtener datos
 * @returns {Promise<Array>} - Lista de objetos con datos de alumnos y sus encuestas
 */
async function obtenerDatosEncuestasAlumnos(alumnos) {
    try {
        const resultado = [];
        
        // Para cada alumno, obtener su historial de encuestas
        for (const alumno of alumnos) {
            mostrarMensajeCargando(`Procesando datos de ${alumno.getNombreCompleto()}...`);
            
            // Determinar qué encuesta buscar
            let encuestaId = '';
            
            // Si hay un periodo seleccionado, usar ese
            const filtroPeriodo = document.getElementById('filtro-periodo-encuesta');
            if (filtroPeriodo && filtroPeriodo.value) {
                encuestaId = filtroPeriodo.value;
            } else if (alumno.historialEncuestas && alumno.historialEncuestas.length > 0) {
                // Si no hay periodo seleccionado, usar la última encuesta del alumno
                alumno.historialEncuestas.sort((a, b) => {
                    if (!a.fechaCompletado) return 1;
                    if (!b.fechaCompletado) return -1;
                    return b.fechaCompletado - a.fechaCompletado;
                });
                encuestaId = alumno.historialEncuestas[0].encuestaId;
            }
            
            if (!encuestaId) {
                console.log(`No se encontró encuesta para ${alumno.getNombreCompleto()}`);
                // Añadir datos básicos sin respuestas
                resultado.push({
                    alumno: alumno,
                    respuestasModulo1: {},
                    respuestasModulo2: {},
                    fechaCompletado: null
                });
                continue;
            }
            
            // Obtener datos de la encuesta
            try {
                // Buscar en la colección historial_encuestas
                const historialSnapshot = await firebase.firestore()
                    .collectionGroup('historial_encuestas')
                    .where('encuestaId', '==', encuestaId)
                    .where('userId', '==', alumno.id)
                    .get();
                
                if (historialSnapshot.empty) {
                    console.log(`No se encontró historial para ${alumno.getNombreCompleto()} en la encuesta ${encuestaId}`);
                    resultado.push({
                        alumno: alumno,
                        respuestasModulo1: {},
                        respuestasModulo2: {},
                        fechaCompletado: null
                    });
                    continue;
                }
                
                // Tomar el primer documento que coincida
                const historialDoc = historialSnapshot.docs[0];
                const historialData = historialDoc.data();
                
                // Obtener las respuestas para los módulos 1 y 2
                let respuestasModulo1 = {};
                let respuestasModulo2 = {};
                
                // Verificar si hay respuestas para los módulos
                if (historialData.modulos && historialData.modulos['1']) {
                    respuestasModulo1 = historialData.modulos['1'];
                }
                
                if (historialData.modulos && historialData.modulos['2']) {
                    respuestasModulo2 = historialData.modulos['2'];
                }
                
                // Añadir datos al resultado
                resultado.push({
                    alumno: alumno,
                    respuestasModulo1: respuestasModulo1,
                    respuestasModulo2: respuestasModulo2,
                    fechaCompletado: historialData.fechaCompletado?.toDate()
                });
                
            } catch (error) {
                console.error(`Error al obtener datos de encuesta para ${alumno.getNombreCompleto()}:`, error);
                resultado.push({
                    alumno: alumno,
                    respuestasModulo1: {},
                    respuestasModulo2: {},
                    fechaCompletado: null,
                    error: error.message
                });
            }
        }
        
        return resultado;
        
    } catch (error) {
        console.error('Error al obtener datos de encuestas:', error);
        throw error;
    }
}

/**
 * Prepara los datos para exportar a Excel
 * @param {Array} datosCompletos - Datos de alumnos con sus respuestas
 * @param {number} modulo - Número de módulo (1 o 2)
 * @returns {Array} - Datos formateados para Excel
 */
function prepararDatosExcel(datosCompletos, modulo) {
    const resultado = [];
    
    // Seleccionar las preguntas según el módulo
    const preguntas = modulo === 1 ? PREGUNTAS_MODULO1 : PREGUNTAS_MODULO2;
    
    // Para cada alumno, crear una fila con sus datos y respuestas
    for (const datos of datosCompletos) {
        const alumno = datos.alumno;
        const respuestas = modulo === 1 ? datos.respuestasModulo1 : datos.respuestasModulo2;
        const fechaCompletado = datos.fechaCompletado;
        
        // Crear objeto base con datos básicos del alumno
        const fila = {
            "No. Control": alumno.usuario || '',
            "Nombre": alumno.getNombreCompleto(),
            "Carrera": alumno.nombreCarrera || ''
        };
        
        // Añadir fecha de completado si existe
        if (fechaCompletado) {
            fila["Fecha Completado"] = fechaCompletado.toLocaleDateString('es-MX');
        } else {
            fila["Fecha Completado"] = 'No completado';
        }
        
        // Añadir respuestas a las preguntas
        for (const [clave, pregunta] of Object.entries(preguntas)) {
            fila[pregunta] = respuestas[clave] || '';
        }
        
        resultado.push(fila);
    }
    
    return resultado;
}

/**
 * Muestra un mensaje de carga
 * @param {string} mensaje - Mensaje a mostrar
 */
function mostrarMensajeCargando(mensaje) {
    // Verificar si ya existe el contenedor de mensajes
    let contenedorMensajes = document.getElementById('contenedor-mensajes');
    
    if (!contenedorMensajes) {
        // Crear contenedor de mensajes
        contenedorMensajes = document.createElement('div');
        contenedorMensajes.id = 'contenedor-mensajes';
        contenedorMensajes.style.position = 'fixed';
        contenedorMensajes.style.bottom = '20px';
        contenedorMensajes.style.right = '20px';
        contenedorMensajes.style.zIndex = '1000';
        document.body.appendChild(contenedorMensajes);
    }
    
    // Actualizar o crear mensaje de carga
    let mensajeCarga = document.getElementById('mensaje-carga');
    
    if (!mensajeCarga) {
        mensajeCarga = document.createElement('div');
        mensajeCarga.id = 'mensaje-carga';
        mensajeCarga.style.backgroundColor = '#f8f9fa';
        mensajeCarga.style.border = '1px solid #dee2e6';
        mensajeCarga.style.borderLeft = '5px solid #007bff';
        mensajeCarga.style.padding = '15px 20px';
        mensajeCarga.style.marginBottom = '10px';
        mensajeCarga.style.borderRadius = '4px';
        mensajeCarga.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
        mensajeCarga.style.display = 'flex';
        mensajeCarga.style.alignItems = 'center';
        contenedorMensajes.appendChild(mensajeCarga);
    }
    
    // Actualizar contenido del mensaje
    mensajeCarga.innerHTML = `
        <div style="width: 20px; height: 20px; border: 3px solid #f3f3f3; border-top: 3px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 10px;"></div>
        <div>${mensaje}</div>
    `;
    
    // Añadir animación de spin
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(styleElement);
}

/**
 * Muestra un mensaje
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} tipo - Tipo de mensaje (success, error, info)
 */
function mostrarMensaje(mensaje, tipo = 'info') {
    // Verificar si ya existe el contenedor de mensajes
    let contenedorMensajes = document.getElementById('contenedor-mensajes');
    
    if (!contenedorMensajes) {
        // Crear contenedor de mensajes
        contenedorMensajes = document.createElement('div');
        contenedorMensajes.id = 'contenedor-mensajes';
        contenedorMensajes.style.position = 'fixed';
        contenedorMensajes.style.bottom = '20px';
        contenedorMensajes.style.right = '20px';
        contenedorMensajes.style.zIndex = '1000';
        document.body.appendChild(contenedorMensajes);
    }
    
    // Eliminar mensaje de carga si existe
    const mensajeCarga = document.getElementById('mensaje-carga');
    if (mensajeCarga) {
        mensajeCarga.remove();
    }
    
    // Determinar color según tipo
    let color = '#007bff'; // info
    if (tipo === 'success') color = '#28a745';
    if (tipo === 'error') color = '#dc3545';
    
    // Crear elemento de mensaje
    const mensajeElement = document.createElement('div');
    mensajeElement.style.backgroundColor = '#f8f9fa';
    mensajeElement.style.border = '1px solid #dee2e6';
    mensajeElement.style.borderLeft = `5px solid ${color}`;
    mensajeElement.style.padding = '15px 20px';
    mensajeElement.style.marginBottom = '10px';
    mensajeElement.style.borderRadius = '4px';
    mensajeElement.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
    mensajeElement.style.position = 'relative';
    mensajeElement.style.animation = 'fadeIn 0.3s ease-in-out';
    mensajeElement.innerHTML = mensaje;
    
    // Añadir botón para cerrar
    const btnCerrar = document.createElement('button');
    btnCerrar.innerHTML = '&times;';
    btnCerrar.style.position = 'absolute';
    btnCerrar.style.top = '5px';
    btnCerrar.style.right = '5px';
    btnCerrar.style.border = 'none';
    btnCerrar.style.background = 'none';
    btnCerrar.style.fontSize = '16px';
    btnCerrar.style.cursor = 'pointer';
    btnCerrar.style.color = '#666';
    btnCerrar.onclick = () => mensajeElement.remove();
    mensajeElement.appendChild(btnCerrar);
    
    // Añadir mensaje al contenedor
    contenedorMensajes.appendChild(mensajeElement);
    
    // Añadir animación de fadeIn
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(styleElement);
    
    // Eliminar mensaje después de 5 segundos
    setTimeout(() => {
        if (mensajeElement.parentNode) {
            mensajeElement.remove();
        }
    }, 5000);
}
