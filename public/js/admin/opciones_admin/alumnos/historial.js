/**
 * Funcionalidad para mostrar el historial de encuestas de los alumnos
 */

/**
 * Carga y muestra el historial de encuestas de un alumno específico
 * @param {string} alumnoId - ID del alumno
 * @param {string} contenedorId - ID del elemento HTML donde mostrar el historial
 */
async function mostrarHistorialEncuestasAlumno(alumnoId, contenedorId) {
    try {
        const contenedor = document.getElementById(contenedorId);
        if (!contenedor) return;
        
        contenedor.innerHTML = '<p class="cargando">Cargando historial de encuestas...</p>';
        
        // Obtener historial de encuestas
        const historial = await obtenerHistorialEncuestasAlumno(alumnoId);
        
        if (historial.length === 0) {
            contenedor.innerHTML = '<p class="sin-resultados">El alumno no ha respondido ninguna encuesta.</p>';
            return;
        }
        
        // Contar encuestas completas
        const encuestasCompletas = historial.filter(item => item.completada).length;
        
        // Construir HTML con el historial
        const itemsHTML = historial.map(item => {
            // Generar botones para cada módulo completado
            const modulosHTML = item.modulosCompletados.map(modulo => {
                const moduloNum = modulo.replace('Módulo ', '');
                return `<button class="modulo-tag modulo-btn" data-modulo="${moduloNum}" data-encuesta-id="${item.id}" data-alumno-id="${alumnoId}">${modulo}</button>`;
            }).join('');
            
            const estadoEncuesta = item.completada 
                ? '<span class="estado-completo">Completada</span>' 
                : '<span class="estado-incompleto">En progreso</span>';
            
            return `
                <div class="encuesta-historial-item ${item.completada ? 'completa' : 'incompleta'}">
                    <div class="encuesta-historial-header">
                        <div class="encuesta-historial-titulo">${item.encuestaTitulo}</div>
                        <div class="encuesta-historial-estado">${estadoEncuesta}</div>
                    </div>
                    <div class="encuesta-historial-detalles">
                        <div class="encuesta-historial-fecha">Última actualización: ${item.fechaRespuesta.toLocaleString()}</div>
                        <div class="encuesta-historial-modulos">
                            <div>Módulos completados: ${item.totalModulos} de 7</div>
                            <div class="modulos-tags">${modulosHTML}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        const html = `
            <h3>Historial de Encuestas</h3>
            <div class="encuesta-resumen">
                <p>El alumno ha respondido <strong>${historial.length}</strong> encuestas en total.</p>
                <p>Encuestas completadas: <strong>${encuestasCompletas}</strong></p>
                <p>Encuestas en progreso: <strong>${historial.length - encuestasCompletas}</strong></p>
            </div>
            <div class="historial-items">
                ${itemsHTML}
            </div>
        `;
        
        contenedor.innerHTML = html;
        
        // Agregar eventos a los botones de módulos
        document.querySelectorAll('.modulo-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const modulo = this.getAttribute('data-modulo');
                const encuestaId = this.getAttribute('data-encuesta-id');
                const alumnoId = this.getAttribute('data-alumno-id');
                mostrarDetallesModulo(modulo, encuestaId, alumnoId);
            });
        });
        
    } catch (error) {
        console.error('Error al mostrar historial de encuestas:', error);
        const contenedor = document.getElementById(contenedorId);
        if (contenedor) {
            contenedor.innerHTML = `<p class="error">Error al cargar historial: ${error.message}</p>`;
        }
    }
}

/**
 * Obtiene el historial de encuestas de un alumno desde Firestore
 * @param {string} alumnoId - ID del alumno
 * @returns {Promise<Array>} - Array con el historial de encuestas
 */
async function obtenerHistorialEncuestasAlumno(alumnoId) {
    try {
        // Usar la ruta correcta con guión bajo
        const snapshot = await firebase.firestore()
            .collection('usuario')
            .doc(alumnoId)
            .collection('historial_encuestas') // Colección correcta con guión bajo
            .orderBy('ultimaModificacion', 'desc')
            .get();
        
        if (snapshot.empty) {
            console.log('No se encontraron encuestas en historial_encuestas');
            return [];
        }
        
        console.log('Encuestas encontradas:', snapshot.docs.length);
        
        // Procesar cada encuesta en el historial
        const historial = await Promise.all(snapshot.docs.map(async doc => {
            const data = doc.data();
            let encuestaTitulo = data.titulo || 'Encuesta sin título';
            let encuestaCompletada = data.encuestaCompletada === true;
            
            // Si no existe el flag encuestaCompletada, verificar si todos los módulos están completados
            if (encuestaCompletada === undefined) {
                // Verificar si los módulos necesarios están completados
                const modulos = [
                    data.modulo1 && data.modulo1.completado,
                    data.modulo2 && data.modulo2.completado,
                    data.modulo3 && data.modulo3.completado,
                    data.modulo4 && data.modulo4.completado,
                    data.modulo5 && data.modulo5.completado,
                    data.modulo6 && data.modulo6.completado,
                    data.modulo7 && data.modulo7.completado
                ];
                
                // Si al menos los primeros 6 módulos están completados, considerar la encuesta como completada
                const modulosCompletados = modulos.filter(m => m === true).length;
                encuestaCompletada = modulosCompletados >= 6;
            }
            
            // Obtener detalles adicionales de la encuesta si es necesario
            if (data.encuestaId) {
                try {
                    const docEncuesta = await firebase.firestore()
                        .collection('encuestas')
                        .doc(data.encuestaId)
                        .get();
                    
                    if (docEncuesta.exists) {
                        encuestaTitulo = docEncuesta.data().titulo || encuestaTitulo;
                    }
                } catch (e) {
                    console.error('Error al obtener detalles de encuesta:', e);
                }
            }
            
            // Contar módulos completados
            const modulosCompletados = [
                data.modulo1 && data.modulo1.completado ? 'Módulo 1' : null,
                data.modulo2 && data.modulo2.completado ? 'Módulo 2' : null,
                data.modulo3 && data.modulo3.completado ? 'Módulo 3' : null,
                data.modulo4 && data.modulo4.completado ? 'Módulo 4' : null,
                data.modulo5 && data.modulo5.completado ? 'Módulo 5' : null,
                data.modulo6 && data.modulo6.completado ? 'Módulo 6' : null,
                data.modulo7 && data.modulo7.completado ? 'Módulo 7' : null
            ].filter(m => m !== null);
            
            return {
                id: doc.id,
                encuestaId: data.encuestaId || '',
                encuestaTitulo: encuestaTitulo,
                fechaRespuesta: data.ultimaModificacion ? data.ultimaModificacion.toDate() : 
                              (data.fechaCreacion ? data.fechaCreacion.toDate() : new Date()),
                completada: encuestaCompletada,
                modulosCompletados: modulosCompletados,
                totalModulos: modulosCompletados.length
            };
        }));
        
        // Filtrar solo encuestas que tengan al menos un módulo completado
        const historialConRespuestas = historial.filter(item => item.totalModulos > 0);
        console.log('Encuestas con al menos un módulo completado:', historialConRespuestas.length);
        
        return historialConRespuestas;
        
    } catch (error) {
        console.error('Error al obtener historial de encuestas:', error);
        throw error;
    }
}

 

/**
 * Obtiene el título del módulo según su número
 * @param {string} modulo - Número del módulo (1-7)
 * @returns {string} - Título del módulo
 */
function obtenerTituloModulo(modulo) {
    const titulos = {
        '1': 'Datos Personales',
        '2': 'Evaluación de la Formación Académica',
        '3': 'Ubicación Laboral',
        '4': 'Expectativas y Participación Social',
        '5': 'Desempeño Profesional',
        '6': 'Actualización',
        '7': 'Comentarios y Sugerencias'
    };
    
    return titulos[modulo] || 'Módulo Desconocido';
}

/**
 * Carga los datos del módulo desde Firestore
 * @param {string} modulo - Número del módulo (1-7)
 * @param {string} encuestaId - ID de la encuesta
 * @param {string} alumnoId - ID del alumno
 * @returns {Promise<Object>} - Datos del módulo
 */
async function cargarDatosModulo(modulo, encuestaId, alumnoId) {
    try {
        // Obtener referencia al documento de la encuesta
        const encuestaDoc = await firebase.firestore()
            .collection('usuario')
            .doc(alumnoId)
            .collection('historial_encuestas')
            .doc(encuestaId)
            .get();
        
        if (!encuestaDoc.exists) {
            throw new Error('No se encontró la encuesta solicitada');
        }
        
        const datosEncuesta = encuestaDoc.data();
        const moduloKey = `modulo${modulo}`;
        
        if (!datosEncuesta[moduloKey] || !datosEncuesta[moduloKey].datos) {
            throw new Error(`No hay datos disponibles para el módulo ${modulo}`);
        }
        
        // Obtener datos adicionales del alumno si es necesario
        const alumnoDoc = await firebase.firestore()
            .collection('usuario')
            .doc(alumnoId)
            .get();
        
        const datosAlumno = alumnoDoc.exists ? alumnoDoc.data() : {};
        
        // Retornar los datos combinados
        return {
            encuestaId: encuestaId,
            alumnoId: alumnoId,
            alumno: datosAlumno,
            modulo: datosEncuesta[moduloKey],
            datos: datosEncuesta[moduloKey].datos,
            completado: datosEncuesta[moduloKey].completado || false,
            fechaCompletado: datosEncuesta[moduloKey].fechaCompletado ? datosEncuesta[moduloKey].fechaCompletado.toDate() : null
        };
    } catch (error) {
        console.error(`Error al cargar datos del módulo ${modulo}:`, error);
        throw error;
    }
}

/**
 * Verifica si existe el archivo HTML del módulo y lo crea si no existe
 * @param {string} modulo - Número del módulo (1-7)
 */
async function verificarCrearModulo(modulo) {
    // Aquí podríamos verificar si el archivo existe o crear los archivos necesarios
    // Por ahora, asumiremos que los archivos ya existen o se crean manualmente
    return true;
}

// Exponer funciones al ámbito global
window.mostrarHistorialEncuestasAlumno = mostrarHistorialEncuestasAlumno;
window.obtenerHistorialEncuestasAlumno = obtenerHistorialEncuestasAlumno;
window.mostrarDetallesModulo = mostrarDetallesModulo;
