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
            // Asegurarse de que modulosCompletados siempre sea un array
            if (!item.modulosCompletados) {
                item.modulosCompletados = [];
            }
            
            // Generar botones para cada módulo
            // Siempre mostrar todos los módulos (1-7), pero resaltar los completados
            let modulosHTML = '';
            for (let i = 1; i <= 7; i++) {
                const estaCompletado = item.modulosCompletados.includes(`Módulo ${i}`);
                modulosHTML += `<button class="modulo-tag modulo-btn ${estaCompletado ? 'completado' : 'no-completado'}" 
                    data-modulo="${i}" data-encuesta-id="${item.id}" data-alumno-id="${alumnoId}">
                    Módulo ${i}
                </button>`;
            }
            
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
            let modulosCompletados = [];
            
            // Comprobar si existe la nueva estructura de datos (data.modulos)
            if (data.modulos) {
                // Nueva estructura
                modulosCompletados = Object.keys(data.modulos)
                    .filter(modulo => data.modulos[modulo] && typeof data.modulos[modulo] === 'object')
                    .map(modulo => `Módulo ${modulo}`);
            } else {
                // Estructura antigua
                modulosCompletados = [
                    data.modulo1 && data.modulo1.completado ? 'Módulo 1' : null,
                    data.modulo2 && data.modulo2.completado ? 'Módulo 2' : null,
                    data.modulo3 && data.modulo3.completado ? 'Módulo 3' : null,
                    data.modulo4 && data.modulo4.completado ? 'Módulo 4' : null,
                    data.modulo5 && data.modulo5.completado ? 'Módulo 5' : null,
                    data.modulo6 && data.modulo6.completado ? 'Módulo 6' : null,
                    data.modulo7 && data.modulo7.completado ? 'Módulo 7' : null
                ].filter(m => m !== null);
            }
            
            // Asegurarse de que modulosCompletados siempre sea un array
            if (!Array.isArray(modulosCompletados)) {
                modulosCompletados = [];
            }
            
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
 * Muestra los detalles de un módulo específico de la encuesta
 * @param {string} modulo - Número del módulo (1-7)
 * @param {string} encuestaId - ID de la encuesta
 * @param {string} alumnoId - ID del alumno
 */
async function mostrarDetallesModulo(modulo, encuestaId, alumnoId) {
    try {
        console.log(`Mostrando detalles del módulo ${modulo} de la encuesta ${encuestaId} del alumno ${alumnoId}`);
        
        // Cargar los estilos si no están ya cargados
        if (!document.querySelector('link[href*="/public/css/admin/alumnos/modulos/modal.css"]')) {
            const linkEstilos = document.createElement('link');
            linkEstilos.rel = 'stylesheet';
            linkEstilos.href = '/public/css/admin/alumnos/modulos/modal.css';
            document.head.appendChild(linkEstilos);
        }
        
        // Verificar si ya existe el modal de módulos
        let modalModulo = document.getElementById('modal-detalle-modulo');
        
        if (!modalModulo) {
            // Crear el modal si no existe
            const modalHTML = `
                <div id="modal-detalle-modulo" class="modal-detalle-modulo">
                    <div class="modal-contenido-modulo">
                        <div class="modal-header">
                            <h3 id="titulo-modulo">Cargando...</h3>
                            <span class="cerrar-modal-modulo">&times;</span>
                        </div>
                        <div id="contenido-modulo" class="contenido-modulo">
                            <p class="cargando">Cargando detalles del módulo...</p>
                        </div>
                    </div>
                </div>
            `;
            
            const modalDiv = document.createElement('div');
            modalDiv.innerHTML = modalHTML;
            document.body.appendChild(modalDiv.firstElementChild);
            
            modalModulo = document.getElementById('modal-detalle-modulo');
            
            // Agregar evento para cerrar el modal
            document.querySelector('.cerrar-modal-modulo').addEventListener('click', function() {
                modalModulo.style.display = 'none';
            });
            
            window.addEventListener('click', function(event) {
                if (event.target == modalModulo) {
                    modalModulo.style.display = 'none';
                }
            });
        }
        
        // Mostrar el modal
        modalModulo.style.display = 'block';
        document.getElementById('titulo-modulo').textContent = `Módulo ${modulo}: ${obtenerTituloModulo(modulo)}`;
        document.getElementById('contenido-modulo').innerHTML = '<p class="cargando">Cargando datos del módulo...</p>';
        
        // Cargar los datos del módulo desde Firestore
        const datosModulo = await cargarDatosModulo(modulo, encuestaId, alumnoId);
        
        // Cargar la vista del módulo
        const urlVistaModulo = `/public/admin/opciones_admin/alumnos/modulos/modulo${modulo}.html`;
        
        // Verificar si existe el módulo, si no, cargarlo dinámicamente
        await verificarCrearModulo(modulo);
        
        // Cargar vista del módulo
        const contenidoModulo = document.getElementById('contenido-modulo');
        contenidoModulo.innerHTML = '<iframe id="iframe-modulo" class="iframe-modulo" src="' + urlVistaModulo + '"></iframe>';
        
        const iframe = document.getElementById('iframe-modulo');
        iframe.onload = function() {
            // Inicializar el módulo y cargar datos
            const iframeWindow = iframe.contentWindow;
            if (iframeWindow && iframeWindow.inicializarVistaAdminModulo) {
                iframeWindow.inicializarVistaAdminModulo(datosModulo);
            } else {
                console.error('No se pudo inicializar la vista del módulo');
            }
        };
    } catch (error) {
        console.error(`Error al mostrar detalles del módulo ${modulo}:`, error);
        const contenidoModulo = document.getElementById('contenido-modulo');
        if (contenidoModulo) {
            contenidoModulo.innerHTML = `<p class="error">Error al cargar datos del módulo: ${error.message}</p>`;
        }
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
