/**
 * Módulo para exportación de datos de alumnos y encuestas
 * Este archivo maneja la funcionalidad para exportar a Excel la información
 * de los alumnos filtrados y sus respuestas a las encuestas.
 * 
 * Se incluye soporte para exportar tanto encuestas generales como encuestas
 * especializadas para alumnos de Química y Bioquímica.
 */

// Definición de preguntas por módulo para la exportación
const PREGUNTAS_MODULO1 = {
    "nombre": "Nombre(s)",
    "apellidoPaterno": "Apellido Paterno",
    "apellidoMaterno": "Apellido Materno",
    "noControl": "Número de Control",
    "telefono": "Teléfono",
    "telCasa": "Teléfono de Casa",
    "email": "Correo Electrónico",
    "domicilio": "Domicilio",
    "ciudad": "Ciudad",
    "municipio": "Municipio",
    "estado": "Estado",
    "curp": "CURP",
    "fechaNacimiento": "Fecha de Nacimiento",
    "sexo": "Sexo",
    "estadoCivil": "Estado Civil",
    "carrera": "Carrera",
    "mesEgreso": "Mes de Egreso",
    "titulado": "¿Está titulado?",
    "trabaja": "¿Trabaja actualmente?",
    "estudia": "¿Estudia actualmente?"
};

const PREGUNTAS_MODULO2 = {
    "calidad_docentes": "Calidad de los docentes",
    "plan_estudios": "Plan de estudios",
    "oportunidad_proyectos": "Oportunidades para participar en proyectos",
    "enfasis_investigacion": "Énfasis en investigación",
    "satisfaccion_infraestructura": "Satisfacción con la infraestructura",
    "experiencia_residencia": "Experiencia en residencia profesional",
    "comentario_formacion": "Comentarios sobre tu formación"
};

const PREGUNTAS_MODULO3 = {
    "actividad_actual": "Actividad actual",
    "estudia": "¿Actualmente estudia?",
    "tipo_estudio": "Tipo de estudio",
    "otro_estudio": "Otro tipo de estudio",
    "institucion_educativa": "Institución educativa",
    "especialidad_posgrado": "Especialidad o posgrado",
    "trabaja": "¿Actualmente trabaja?",
    "nombre_empresa": "Nombre de la empresa",
    "puesto": "Puesto",
    "sector_empresa": "Sector de la empresa",
    "tipo_contratacion": "Tipo de contratación",
    "antiguedad": "Antigüedad en el puesto",
    "nivel_jerarquico": "Nivel jerárquico",
    "relacion_estudios": "Relación con estudios",
    "satisfaccion_trabajo": "Satisfacción laboral",
    "rango_salario": "Rango salarial",
    "tiempo_sin_empleo": "Tiempo sin empleo",
    "motivo_desempleo": "Motivo de desempleo",
    "dificultades_empleo": "Dificultades para encontrar empleo",
    "comentario_laboral": "Comentarios adicionales"
};

const PREGUNTAS_MODULO4 = {
    "tiempo_primer_empleo": "Tiempo para obtener primer empleo",
    "medio_obtener_empleo": "Medio para obtener empleo",
    "medio_otro": "Otro medio para obtener empleo",
    "requisitos_contratacion": "Requisitos de contratación",
    "requisito_otro": "Otro requisito de contratación",
    "idioma": "Idioma utilizado en el trabajo",
    "idioma_otro": "Otro idioma utilizado",
    "habilidad_hablar": "Habilidad para hablar (%)",
    "habilidad_escribir": "Habilidad para escribir (%)",
    "habilidad_leer": "Habilidad para leer (%)",
    "habilidad_escuchar": "Habilidad para escuchar (%)",
    "antiguedad": "Antigüedad en el trabajo",
    "anio_ingreso": "Año de ingreso",
    "ingreso": "Nivel de ingreso",
    "nivel_jerarquico": "Nivel jerárquico",
    "condicion_trabajo": "Condición de trabajo",
    "condicion_otro": "Otra condición de trabajo"
};

const PREGUNTAS_MODULO5 = {
    "eficiencia": "Eficiencia para realizar actividades laborales",
    "formacionAcademica": "Calificación de la formación académica",
    "utilidadResidencias": "Utilidad de las residencias profesionales",
    "aspectos.areaEstudio": "Importancia del área de estudio",
    "aspectos.titulacion": "Importancia de la titulación",
    "aspectos.experienciaPrevia": "Importancia de la experiencia previa",
    "aspectos.competenciaLaboral": "Importancia de la competencia laboral",
    "aspectos.posicionamientoInstitucion": "Importancia del posicionamiento de la institución",
    "aspectos.conocimientoIdiomas": "Importancia del conocimiento de idiomas",
    "aspectos.recomendaciones": "Importancia de las recomendaciones",
    "aspectos.personalidad": "Importancia de la personalidad",
    "aspectos.capacidadLiderazgo": "Importancia de la capacidad de liderazgo",
    "aspectos.otrosFactor": "Otros factores importantes",
    "aspectos.otrosValoracion": "Valoración de otros factores"
};

const PREGUNTAS_MODULO6 = {
    "expectativas.cursos_actualizacion": "¿Le interesa tomar cursos de actualización?",
    "expectativas.cuales_cursos": "¿Cuáles cursos le interesan?",
    "expectativas.tomar_posgrado": "¿Le interesa tomar un posgrado?",
    "expectativas.cual_posgrado": "¿Cuál posgrado le interesa?",
    "participacion.organizaciones_sociales": "¿Pertenece a organizaciones sociales?",
    "participacion.cuales_organizaciones": "¿A cuáles organizaciones pertenece?",
    "participacion.organismos_profesionales": "¿Pertenece a organismos profesionales?",
    "participacion.cual_organismo": "¿A cuál organismo profesional pertenece?",
    "participacion.asociacion_egresados": "¿Pertenece a alguna asociación de egresados?"
};

const PREGUNTAS_MODULO7 = {
    "comentario": "Opiniones o recomendaciones",
    "encuestaCompletada": "Encuesta completada",
    "fechaCompletado": "Fecha de finalización"
};

// Definición de preguntas para módulos especializados (Química y Bioquímica)
const PREGUNTAS_MODULO1_1 = {
    "nombre_completo": "Nombre Completo",
    "telefono_celular": "Teléfono Celular",
    "redes_sociales": "Redes Sociales",
    "email": "Correo Electrónico",
    "fecha_ingreso": "Año de Ingreso",
    "fecha_egreso": "Año de Egreso",
    "titulado": "¿Estás titulado?",
    "razon_no_titulado": "Razón por la que no te has titulado",
    "trabajo_relacionado": "¿Tu trabajo actual está relacionado con tu carrera?"
};

const PREGUNTAS_MODULO2_1 = {
    "trabaja": "¿Trabajas actualmente?",
    "antiguedad": "Antigüedad en el trabajo actual",
    "razon_no_trabajo": "Razón por la que no trabajas",
    "tiempo_primer_empleo": "Tiempo para conseguir primer empleo",
    "razon_no_conseguir": "¿Por qué no has conseguido empleo?",
    "tipo_sector": "¿En qué sector te desempeñas?",
    "rol_trabajo": "¿Cuál es tu rol principal?",
    "medio_conseguir_empleo": "¿Cómo conseguiste empleo?", 
    "satisfaccion_trabajo": "Nivel de satisfacción laboral"
};

const PREGUNTAS_MODULO3_1 = {
    "utilidad_competencias": "Utilidad de competencias adquiridas",
    "satisfaccion_carrera": "Grado de satisfacción con la carrera",
    "aspectos_reforzar": "Aspectos a reforzar en el plan de estudios",
    "otro_aspecto": "Otros aspectos a reforzar"
};

const PREGUNTAS_MODULO4_1 = {
    "contactado_institucion": "¿La institución te ha contactado?",
    "participar_institucion": "¿Te gustaría participar con la institución?",
    "formas_participacion": "Formas de participación que te interesan"
};

const PREGUNTAS_MODULO5_1 = {
    "herramientas": "Herramientas utilizadas en desempeño profesional",
    "colabora_investigacion": "¿Colaboras en investigación y desarrollo?",
    "tipo_investigacion": "Tipo de investigación",
    "area_especializacion": "Área de especialización",
    "certificaciones": "Certificaciones profesionales",
    "asociacion_profesional": "¿Perteneces a una asociación profesional?",
    "nombre_asociacion": "Nombre de la asociación",
    "aporte_etica": "¿Cómo aporta la ética a tu trabajo?"
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
 * Exporta a Excel las respuestas de los alumnos filtrados
 */
async function exportarDatosAExcel() {
    // Obtener referencia al botón
    const btnExportar = document.getElementById('btn-exportar-excel');
    
    // Guardar el texto original y cambiar el estado visual
    const textoOriginal = btnExportar.innerHTML;
    btnExportar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exportando...';
    btnExportar.classList.add('procesando');
    
    try {
        // Mostrar mensaje de carga
        mostrarMensajeCargando('Preparando datos para exportación...');
        
        // Verificar que la biblioteca XLSX esté cargada
        if (typeof XLSX === 'undefined') {
            throw new Error('La biblioteca XLSX no está cargada. Intente nuevamente en unos segundos.');
        }
        
        // Obtener los alumnos filtrados actualmente
        const alumnosFiltrados = obtenerAlumnosFiltrados();
        if (!alumnosFiltrados || alumnosFiltrados.length === 0) {
            alert('No hay alumnos para exportar. Aplique filtros diferentes.');
            return;
        }
        
        // Obtener el periodo de encuesta seleccionado
        const filtroPeriodoEncuesta = document.getElementById('filtro-periodo-encuesta');
        const periodoEncuestaId = filtroPeriodoEncuesta ? filtroPeriodoEncuesta.value : '';
        
        // Obtener datos de encuestas para los alumnos filtrados
        mostrarMensajeCargando('Obteniendo datos de encuestas...');
        const datosEncuestas = await obtenerDatosEncuestasAlumnos(alumnosFiltrados, periodoEncuestaId);
        
        if (!datosEncuestas || datosEncuestas.length === 0) {
            ocultarMensajeDeCarga();
            alert('No se encontraron datos de encuestas para los alumnos seleccionados.');
            return;
        }
        
        // Separar datos por tipo de encuesta
        const datosRegulares = [];
        const datosEspecializados = [];
        
        // Identificar encuestas regulares y especializadas
        for (const dato of datosEncuestas) {
            if (dato.encuestaData && dato.encuestaData.tipo === 'especializada') {
                datosEspecializados.push(dato);
            } else {
                datosRegulares.push(dato);
            }
        }
        
        // Mostrar información sobre lo que se va a exportar
        let mensajeInfo = '';
        if (datosRegulares.length > 0) {
            mensajeInfo += `Se exportarán ${datosRegulares.length} encuestas regulares. `;
        }
        if (datosEspecializados.length > 0) {
            mensajeInfo += `Se exportarán ${datosEspecializados.length} encuestas especializadas para Química/Bioquímica.`;
        }
        mostrarMensaje(mensajeInfo, 'info');
        
        // Exportar encuestas regulares si existen
        if (datosRegulares.length > 0) {
            await exportarEncuestasRegulares(datosRegulares);
        }
        
        // Exportar encuestas especializadas si existen
        if (datosEspecializados.length > 0) {
            await exportarEncuestasEspecializadas(datosEspecializados);
        }
        
        // Restaurar el estado original del botón
        btnExportar.innerHTML = textoOriginal;
        btnExportar.classList.remove('procesando');
        
        // Ocultar mensaje de carga
        ocultarMensajeDeCarga();
        
    } catch (error) {
        console.error('Error al exportar datos a Excel:', error);
        alert(`Error al exportar datos: ${error.message}`);
        ocultarMensajeDeCarga();
        
        // Restaurar el estado original del botón incluso si hay error
        btnExportar.innerHTML = textoOriginal;
        btnExportar.classList.remove('procesando');
    }
}

/**
 * Exporta a Excel las encuestas regulares
 * @param {Array} datosEncuestas - Datos de encuestas regulares
 */
async function exportarEncuestasRegulares(datosEncuestas) {
    // Crear libro de Excel
    mostrarMensajeCargando('Creando archivo Excel para encuestas regulares...');
    const wb = XLSX.utils.book_new();
    
    // Definir nombres cortos de los módulos (menos de 31 caracteres en total)
    const nombresModulos = [
        "Datos Personales",
        "Evaluacion Academica",
        "Ubicacion Laboral",
        "Datos de Empleo",
        "Desempeno Profesional",
        "Expectativas",
        "Comentarios"
    ];
    
    // Preparar y añadir cada módulo como una hoja separada
    let hayDatos = false;
    
    for (let modulo = 1; modulo <= 7; modulo++) {
        mostrarMensajeCargando(`Formateando datos del Módulo ${modulo}...`);
        const datosModulo = prepararDatosExcel(datosEncuestas, modulo);
        
        if (datosModulo.length > 0) {
            hayDatos = true;
            const ws = XLSX.utils.json_to_sheet(datosModulo);
            XLSX.utils.book_append_sheet(wb, ws, `Mod${modulo}-${nombresModulos[modulo-1]}`.substring(0, 31));
        }
    }
    
    if (!hayDatos) {
        mostrarMensaje('No hay datos para exportar en las encuestas regulares', 'info');
        return;
    }
    
    // Obtener nombre del archivo
    const fechaActual = new Date();
    const fechaStr = fechaActual.toISOString().slice(0, 10);
    const horaStr = `${fechaActual.getHours()}-${fechaActual.getMinutes()}`;
    
    // Construir nombre del archivo
    const nombreArchivo = `Encuestas_Regulares_${fechaStr}_${horaStr}.xlsx`;
    
    // Exportar a Excel
    XLSX.writeFile(wb, nombreArchivo);
    mostrarMensaje(`Encuestas regulares exportadas correctamente a ${nombreArchivo}`, 'success');
}

/**
 * Exporta a Excel las encuestas especializadas
 * @param {Array} datosEncuestas - Datos de encuestas especializadas
 */
async function exportarEncuestasEspecializadas(datosEncuestas) {
    // Crear libro de Excel
    mostrarMensajeCargando('Creando archivo Excel para encuestas especializadas...');
    const wb = XLSX.utils.book_new();
    
    // Definir nombres de los módulos especializados
    const nombresModulos = [
        "Datos Generales",
        "Situacion Laboral",
        "Plan de Estudios",
        "Institucion",
        "Desempeno Laboral"
    ];
    
    // Preparar y añadir cada módulo especializado como una hoja separada
    let hayDatos = false;
    
    for (let modulo = 1; modulo <= 5; modulo++) {
        mostrarMensajeCargando(`Formateando datos del Módulo ${modulo}.1...`);
        const datosModulo = prepararDatosExcelEspecializados(datosEncuestas, modulo);
        
        if (datosModulo.length > 0) {
            hayDatos = true;
            const ws = XLSX.utils.json_to_sheet(datosModulo);
            XLSX.utils.book_append_sheet(wb, ws, `Mod${modulo}.1-${nombresModulos[modulo-1]}`.substring(0, 31));
        }
    }
    
    if (!hayDatos) {
        mostrarMensaje('No hay datos para exportar en las encuestas especializadas', 'info');
        return;
    }
    
    // Obtener nombre del archivo
    const fechaActual = new Date();
    const fechaStr = fechaActual.toISOString().slice(0, 10);
    const horaStr = `${fechaActual.getHours()}-${fechaActual.getMinutes()}`;
    
    // Construir nombre del archivo
    const nombreArchivo = `Encuestas_Especializadas_Quimica_${fechaStr}_${horaStr}.xlsx`;
    
    // Exportar a Excel
    XLSX.writeFile(wb, nombreArchivo);
    mostrarMensaje(`Encuestas especializadas exportadas correctamente a ${nombreArchivo}`, 'success');
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
                // Buscar en la ruta correcta: usuario/[id_usuario]/historial_encuestas
                const historialSnapshot = await firebase.firestore()
                    .collection('usuario')
                    .doc(alumno.id)
                    .collection('historial_encuestas')
                    .where('encuestaId', '==', encuestaId)
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
                
                // Obtener las respuestas para todos los módulos (1-7)
                const respuestasModulos = {};
                
                // Obtener datos de cada módulo si está disponible
                for (let i = 1; i <= 7; i++) {
                    const moduloKey = `modulo${i}`;
                    respuestasModulos[moduloKey] = {};
                    
                    if (historialData[moduloKey] && historialData[moduloKey].datos) {
                        respuestasModulos[moduloKey] = historialData[moduloKey].datos;
                        console.log(`Respuestas módulo ${i} encontradas:`, respuestasModulos[moduloKey]);
                    }
                }
                
                // Para módulo 7, añadir campos adicionales a nivel de encuesta
                if (respuestasModulos.modulo7) {
                    respuestasModulos.modulo7.encuestaCompletada = historialData.encuestaCompletada || false;
                    respuestasModulos.modulo7.fechaCompletado = historialData.fechaCompletado || null;
                }
                
                // Añadir datos al resultado
                const resultadoAlumno = {
                    alumno: alumno,
                    fechaCompletado: historialData.fechaCompletado?.toDate()
                };
                
                // Añadir todas las respuestas de módulos
                for (let i = 1; i <= 7; i++) {
                    resultadoAlumno[`respuestasModulo${i}`] = respuestasModulos[`modulo${i}`] || {};
                }
                
                resultado.push(resultadoAlumno);
                
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
 * @param {number} modulo - Número de módulo (1 a 7)
 * @returns {Array} - Datos formateados para Excel
 */
function prepararDatosExcel(datosCompletos, modulo) {
    const resultado = [];
    
    // Seleccionar las preguntas según el módulo
    let preguntas;
    switch(modulo) {
        case 1: preguntas = PREGUNTAS_MODULO1; break;
        case 2: preguntas = PREGUNTAS_MODULO2; break;
        case 3: preguntas = PREGUNTAS_MODULO3; break;
        case 4: preguntas = PREGUNTAS_MODULO4; break;
        case 5: preguntas = PREGUNTAS_MODULO5; break;
        case 6: preguntas = PREGUNTAS_MODULO6; break;
        case 7: preguntas = PREGUNTAS_MODULO7; break;
        default: preguntas = PREGUNTAS_MODULO1;
    }
    
    // Para cada alumno, crear una fila con sus datos y respuestas
    for (const datos of datosCompletos) {
        const alumno = datos.alumno;
        const respuestas = datos[`respuestasModulo${modulo}`] || {};
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
            // Para campos anidados como aspectos.areaEstudio, acceder correctamente
            if (clave.includes('.')) {
                const [objetoPadre, campoHijo] = clave.split('.');
                fila[pregunta] = respuestas[objetoPadre]?.[campoHijo] || '';
            } else {
                fila[pregunta] = respuestas[clave] || '';
            }
        }
        
        resultado.push(fila);
    }
    
    return resultado;
}

/**
 * Prepara los datos para exportar a Excel de las encuestas especializadas
 * @param {Array} datosCompletos - Datos de alumnos con sus respuestas especializadas
 * @param {number} modulo - Número de módulo (1 a 5)
 * @returns {Array} - Datos formateados para Excel
 */
function prepararDatosExcelEspecializados(datosCompletos, modulo) {
    const resultado = [];
    
    // Seleccionar las preguntas según el módulo especializado
    let preguntas;
    switch(modulo) {
        case 1: preguntas = PREGUNTAS_MODULO1_1; break;
        case 2: preguntas = PREGUNTAS_MODULO2_1; break;
        case 3: preguntas = PREGUNTAS_MODULO3_1; break;
        case 4: preguntas = PREGUNTAS_MODULO4_1; break;
        case 5: preguntas = PREGUNTAS_MODULO5_1; break;
        default: preguntas = PREGUNTAS_MODULO1_1;
    }
    
    // Para cada alumno, crear una fila con sus datos y respuestas
    for (const datos of datosCompletos) {
        const alumno = datos.alumno;
        const respuestas = datos[`respuestasModulo${modulo}_1`] || {};
        const fechaCompletado = datos.fechaCompletadoEspecializada;
        
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
            // Para campos anidados como aspectos.areaEstudio, acceder correctamente
            if (clave.includes('.')) {
                const [objetoPadre, campoHijo] = clave.split('.');
                fila[pregunta] = respuestas[objetoPadre]?.[campoHijo] || '';
            } else {
                fila[pregunta] = respuestas[clave] || '';
            }
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
    
    // Actualizar mensaje
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
 * Oculta el mensaje de carga
 */
function ocultarMensajeDeCarga() {
    // Verificar si existe el contenedor de mensajes
    const contenedorMensajes = document.getElementById('contenedor-mensajes');
    if (contenedorMensajes) {
        contenedorMensajes.innerHTML = '';
    }
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
