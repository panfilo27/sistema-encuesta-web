/**
 * Administración de Encuestas - JavaScript
 * Este archivo maneja la funcionalidad para abrir y cerrar períodos de encuestas,
 * y verificar el estado de respuesta de los alumnos.
 */

// Variables globales para gestión de encuestas
let encuestasActivas = [];
let encuestasHistoricas = [];

/**
 * Inicializa el gestor de encuestas
 */
function inicializarGestorEncuestas() {
    // Evitar reinicialización
    if (window.gestorEncuestasInicializado) return;
    window.gestorEncuestasInicializado = true;
    
    console.log('Inicializando gestor de encuestas...');
    
    // Verificar autenticación de administrador
    verificarAutenticacionAdmin();
    
    // Configurar eventos
    configurarEventosEncuesta();
    
    // Cargar datos
    cargarEncuestasActivas();
    cargarEstadisticasEncuestas();
}

/**
 * Verifica que el usuario sea administrador
 */
function verificarAutenticacionAdmin() {
    const userSession = localStorage.getItem('userSession');
    
    if (!userSession) {
        window.location.href = '../../../../../auth/login.html';
        return;
    }
    
    try {
        const userData = JSON.parse(userSession);
        
        if (userData.rolUser !== 'admin') {
            alert('No tienes permisos para acceder a esta página.');
            window.location.href = '../../../../../auth/login.html';
        }
    } catch (error) {
        console.error('Error al verificar autenticación:', error);
        window.location.href = '../../../../../auth/login.html';
    }
}

/**
 * Configura los eventos de la interfaz de encuestas
 */
function configurarEventosEncuesta() {
    // Botón para abrir nueva encuesta
    document.getElementById('btn-nueva-encuesta')?.addEventListener('click', mostrarFormularioNuevaEncuesta);
    
    // Formulario de nueva encuesta
    document.getElementById('form-nueva-encuesta')?.addEventListener('submit', function(e) {
        e.preventDefault();
        crearNuevaEncuesta();
    });
    
    // Botón para cancelar nueva encuesta
    document.getElementById('btn-cancelar-encuesta')?.addEventListener('click', function() {
        document.getElementById('form-nueva-encuesta').reset();
        document.getElementById('error-encuesta').textContent = '';
        document.getElementById('formulario-nueva-encuesta').style.display = 'none';
    });
}

/**
 * Muestra el formulario para crear una nueva encuesta
 */
function mostrarFormularioNuevaEncuesta() {
    // Establecer fechas mínimas (hoy)
    const hoy = new Date();
    const fechaHoy = hoy.toISOString().split('T')[0];
    
    document.getElementById('fecha-inicio-encuesta').min = fechaHoy;
    document.getElementById('fecha-fin-encuesta').min = fechaHoy;
    
    // Mostrar formulario
    document.getElementById('formulario-nueva-encuesta').style.display = 'block';
    document.getElementById('form-nueva-encuesta').reset();
    document.getElementById('error-encuesta').textContent = '';
}

/**
 * Carga las encuestas activas desde Firestore
 */
async function cargarEncuestasActivas() {
    try {
        const tablaEncuestas = document.getElementById('tabla-encuestas-activas');
        if (!tablaEncuestas) return;
        
        tablaEncuestas.innerHTML = '<p class="cargando">Cargando encuestas activas...</p>';
        
        const snapshot = await firebase.firestore()
            .collection('encuestas')
            .orderBy('fechaInicio', 'desc')
            .get();
        
        if (snapshot.empty) {
            tablaEncuestas.innerHTML = '<p class="sin-resultados">No hay encuestas configuradas actualmente.</p>';
            return;
        }
        
        // Procesar encuestas
        encuestasActivas = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                titulo: data.titulo,
                descripcion: data.descripcion,
                fechaInicio: data.fechaInicio.toDate(),
                fechaFin: data.fechaFin.toDate(),
                activa: data.activa,
                creadorId: data.creadorId
            };
        });
        
        // Construir HTML de la tabla
        const html = `
            <table>
                <thead>
                    <tr>
                        <th>Título</th>
                        <th>Descripción</th>
                        <th>Fecha Inicio</th>
                        <th>Fecha Fin</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${encuestasActivas.map(encuesta => {
                        const hoy = new Date();
                        const estaActiva = encuesta.activa && 
                                          encuesta.fechaInicio <= hoy && 
                                          encuesta.fechaFin >= hoy;
                        
                        return `
                            <tr>
                                <td>${encuesta.titulo}</td>
                                <td>${encuesta.descripcion}</td>
                                <td>
                                    <div>${encuesta.fechaInicio.toLocaleDateString()}</div>
                                    <div class="hora-encuesta">${encuesta.fechaInicio.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                </td>
                                <td>
                                    <div>${encuesta.fechaFin.toLocaleDateString()}</div>
                                    <div class="hora-encuesta">${encuesta.fechaFin.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                </td>
                                <td>
                                    <span class="${estaActiva ? 'estado-activo' : 'estado-inactivo'}">
                                        ${estaActiva ? 'Activa' : 'Inactiva'}
                                    </span>
                                </td>
                                <td>
                                    <button class="acciones-btn" onclick="cambiarEstadoEncuesta('${encuesta.id}', ${!encuesta.activa})">
                                        <i class="fas fa-${encuesta.activa ? 'times-circle' : 'check-circle'}"></i>
                                        ${encuesta.activa ? 'Desactivar' : 'Activar'}
                                    </button>
                                    <button class="acciones-btn btn-ver" onclick="verEstadisticasEncuesta('${encuesta.id}')">
                                        <i class="fas fa-chart-bar"></i>
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        
        tablaEncuestas.innerHTML = html;
        
    } catch (error) {
        console.error('Error al cargar encuestas activas:', error);
        const tablaEncuestas = document.getElementById('tabla-encuestas-activas');
        if (tablaEncuestas) {
            tablaEncuestas.innerHTML = `<p class="error">Error al cargar encuestas: ${error.message}</p>`;
        }
    }
}

/**
 * Crea una nueva encuesta
 */
async function crearNuevaEncuesta() {
    try {
        // Obtener datos del formulario
        const titulo = document.getElementById('titulo-encuesta').value.trim();
        const descripcion = document.getElementById('descripcion-encuesta').value.trim();
        
        // Obtener fechas y horas
        const fechaInicioInput = document.getElementById('fecha-inicio-encuesta').value;
        const horaInicioInput = document.getElementById('hora-inicio-encuesta').value || '00:00';
        const fechaFinInput = document.getElementById('fecha-fin-encuesta').value;
        const horaFinInput = document.getElementById('hora-fin-encuesta').value || '23:59';
        
        // Crear objetos de fecha combinando fecha y hora
        const fechaInicio = new Date(`${fechaInicioInput}T${horaInicioInput}`);
        const fechaFin = new Date(`${fechaFinInput}T${horaFinInput}`);
        
        // Validar campos
        if (!titulo || !descripcion || !fechaInicioInput || !fechaFinInput) {
            document.getElementById('error-encuesta').textContent = 'Todos los campos son obligatorios';
            return;
        }
        
        // Validar fechas
        if (fechaInicio >= fechaFin) {
            document.getElementById('error-encuesta').textContent = 'El momento de inicio debe ser anterior al momento de fin';
            return;
        }
        
        // Verificar que no exista una encuesta en el mismo rango de fechas
        const verificacionRango = await verificarEncuestaEnRango(fechaInicio, fechaFin);
        
        if (verificacionRango.existe) {
            // Formatear fechas para mejor visualización
            const inicioFormateado = fechaInicio.toLocaleString('es-MX', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
            
            const finFormateado = fechaFin.toLocaleString('es-MX', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
            
            // Mostrar mensaje detallado sobre las encuestas solapadas
            const mensajeError = `Ya existe ${verificacionRango.encuestasSolapadas.length} encuesta${verificacionRango.encuestasSolapadas.length > 1 ? 's' : ''} activa${verificacionRango.encuestasSolapadas.length > 1 ? 's' : ''} en ese rango de fechas y horas.\n\nTu encuesta: ${inicioFormateado} - ${finFormateado}\n\nEncuesta${verificacionRango.encuestasSolapadas.length > 1 ? 's' : ''} en conflicto:\n${verificacionRango.encuestasSolapadas.map(e => 
                `- "${e.titulo}" (${e.inicio} - ${e.fin})`
            ).join('\n')}\n\nNota: Hay solapamiento porque ambas encuestas estarían activas simultáneamente durante cierto periodo.`;
            
            document.getElementById('error-encuesta').innerHTML = mensajeError.replace(/\n/g, '<br>');
            console.log('Encuestas solapadas:', verificacionRango.encuestasSolapadas);
            return;
        }
        
        // Obtener datos del usuario actual
        const userSession = JSON.parse(localStorage.getItem('userSession'));
        
        // Crear objeto de encuesta
        const nuevaEncuesta = {
            titulo: titulo,
            descripcion: descripcion,
            fechaInicio: firebase.firestore.Timestamp.fromDate(fechaInicio),
            fechaFin: firebase.firestore.Timestamp.fromDate(fechaFin),
            activa: true,
            creadorId: userSession.id,
            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Guardar en Firestore
        await firebase.firestore().collection('encuestas').add(nuevaEncuesta);
        
        // Cerrar formulario y recargar encuestas
        document.getElementById('form-nueva-encuesta').reset();
        document.getElementById('formulario-nueva-encuesta').style.display = 'none';
        
        // Mostrar mensaje de éxito
        alert('Encuesta creada exitosamente');
        
        // Recargar lista de encuestas
        cargarEncuestasActivas();
        
    } catch (error) {
        console.error('Error al crear encuesta:', error);
        document.getElementById('error-encuesta').textContent = `Error: ${error.message}`;
    }
}

/**
 * Verifica si ya existe una encuesta en el rango de fechas proporcionado
 * @param {Date} fechaInicio - Fecha y hora de inicio a verificar
 * @param {Date} fechaFin - Fecha y hora de fin a verificar
 * @returns {Promise<{existe: boolean, mensaje: string, encuestasSolapadas: Array}>} - Resultado de la verificación
 */
async function verificarEncuestaEnRango(fechaInicio, fechaFin) {
    try {
        console.log(`Verificando solapamiento para: ${fechaInicio.toLocaleString()} - ${fechaFin.toLocaleString()}`);
        
        // Consultar encuestas que podrían solaparse con el rango proporcionado
        const snapshot = await firebase.firestore()
            .collection('encuestas')
            .where('activa', '==', true)
            .get();
        
        if (snapshot.empty) {
            return { existe: false, mensaje: '', encuestasSolapadas: [] };
        }
        
        // Recopilar encuestas solapadas
        const encuestasSolapadas = [];
        
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const encuestaInicio = data.fechaInicio.toDate();
            const encuestaFin = data.fechaFin.toDate();
            
            // Verificar solapamiento de rangos (considerando fecha y hora)
            if (fechaInicio <= encuestaFin && fechaFin >= encuestaInicio) {
                encuestasSolapadas.push({
                    id: doc.id,
                    titulo: data.titulo,
                    inicio: encuestaInicio.toLocaleString(),
                    fin: encuestaFin.toLocaleString()
                });
            }
        });
        
        if (encuestasSolapadas.length > 0) {
            const mensaje = `Ya existe${encuestasSolapadas.length > 1 ? 'n' : ''} ${encuestasSolapadas.length} encuesta${encuestasSolapadas.length > 1 ? 's' : ''} activa${encuestasSolapadas.length > 1 ? 's' : ''} en ese rango de fechas y horas.`;
            return { existe: true, mensaje, encuestasSolapadas };
        }
        
        return { existe: false, mensaje: '', encuestasSolapadas: [] };
        
    } catch (error) {
        console.error('Error al verificar encuestas en rango:', error);
        throw error;
    }
}

/**
 * Cambia el estado de una encuesta (activa/inactiva)
 * @param {string} encuestaId - ID de la encuesta
 * @param {boolean} nuevoEstado - Nuevo estado (true = activa, false = inactiva)
 */
async function cambiarEstadoEncuesta(encuestaId, nuevoEstado) {
    try {
        // Actualizar estado en Firestore
        await firebase.firestore()
            .collection('encuestas')
            .doc(encuestaId)
            .update({
                activa: nuevoEstado,
                fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
            });
        
        // Recargar lista de encuestas
        cargarEncuestasActivas();
        
        // Mostrar mensaje
        alert(`Encuesta ${nuevoEstado ? 'activada' : 'desactivada'} correctamente`);
        
    } catch (error) {
        console.error('Error al cambiar estado de encuesta:', error);
        alert(`Error: ${error.message}`);
    }
}

/**
 * Carga estadísticas generales de encuestas
 */
async function cargarEstadisticasEncuestas() {
    try {
        const contenedorEstadisticas = document.getElementById('estadisticas-encuestas');
        if (!contenedorEstadisticas) return;
        
        contenedorEstadisticas.innerHTML = '<p class="cargando">Cargando estadísticas...</p>';
        
        // Obtener conteo de encuestas
        const snapshotEncuestas = await firebase.firestore()
            .collection('encuestas')
            .get();
        
        const totalEncuestas = snapshotEncuestas.size;
        
        // Obtener encuestas activas actualmente
        const hoy = new Date();
        const encuestasActivas = snapshotEncuestas.docs.filter(doc => {
            const data = doc.data();
            return data.activa && 
                   data.fechaInicio.toDate() <= hoy && 
                   data.fechaFin.toDate() >= hoy;
        }).length;
        
        // Obtener estadísticas de respuestas
        const snapshotRespuestas = await firebase.firestore()
            .collectionGroup('historial_encuestas')
            .get();
        
        console.log('Total de respuestas encontradas:', snapshotRespuestas.size);
        const totalRespuestas = snapshotRespuestas.size;
        
        // Obtener total de alumnos
        const snapshotAlumnos = await firebase.firestore()
            .collection('usuario')
            .where('rolUser', '==', 'alumno')
            .get();
        
        const totalAlumnos = snapshotAlumnos.size;
        
        // Crear HTML con estadísticas
        const html = `
            <div class="estadistica-item">
                <div class="estadistica-valor">${totalEncuestas}</div>
                <div class="estadistica-etiqueta">Encuestas Totales</div>
            </div>
            <div class="estadistica-item">
                <div class="estadistica-valor">${encuestasActivas}</div>
                <div class="estadistica-etiqueta">Encuestas Activas</div>
            </div>
            <div class="estadistica-item">
                <div class="estadistica-valor">${totalRespuestas}</div>
                <div class="estadistica-etiqueta">Respuestas Totales</div>
            </div>
            <div class="estadistica-item">
                <div class="estadistica-valor">${totalAlumnos}</div>
                <div class="estadistica-etiqueta">Alumnos Registrados</div>
            </div>
        `;
        
        contenedorEstadisticas.innerHTML = html;
        
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        const contenedorEstadisticas = document.getElementById('estadisticas-encuestas');
        if (contenedorEstadisticas) {
            contenedorEstadisticas.innerHTML = `<p class="error">Error al cargar estadísticas: ${error.message}</p>`;
        }
    }
}

/**
 * Muestra las estadísticas detalladas de una encuesta específica
 * @param {string} encuestaId - ID de la encuesta
 */
async function verEstadisticasEncuesta(encuestaId) {
    try {
        const modal = document.getElementById('modal-estadisticas-encuesta');
        const contenidoModal = document.getElementById('contenido-estadisticas-encuesta');
        
        if (!modal || !contenidoModal) return;
        
        // Mostrar modal con indicador de carga
        contenidoModal.innerHTML = '<p class="cargando">Cargando estadísticas detalladas...</p>';
        modal.style.display = 'block';
        
        // Obtener datos de la encuesta
        const docEncuesta = await firebase.firestore()
            .collection('encuestas')
            .doc(encuestaId)
            .get();
        
        if (!docEncuesta.exists) {
            throw new Error('La encuesta no existe');
        }
        
        const encuesta = {
            id: docEncuesta.id,
            ...docEncuesta.data(),
            fechaInicio: docEncuesta.data().fechaInicio.toDate(),
            fechaFin: docEncuesta.data().fechaFin.toDate()
        };
        
        // Obtener respuestas para esta encuesta
        const snapshotRespuestas = await firebase.firestore()
            .collectionGroup('historial_encuestas')
            .where('encuestaId', '==', encuestaId)
            .get();
        
        console.log('Respuestas encontradas para encuesta', encuestaId, ':', snapshotRespuestas.size);
        const totalRespuestas = snapshotRespuestas.size;
        
        // Crear mapa de alumnos que han respondido
        const alumnosRespondido = new Map();
        
        for (const doc of snapshotRespuestas.docs) {
            const alumnoId = doc.ref.parent.parent.id;
            if (!alumnosRespondido.has(alumnoId)) {
                alumnosRespondido.set(alumnoId, []);
            }
            alumnosRespondido.get(alumnoId).push({
                id: doc.id,
                fechaRespuesta: doc.data().ultimaModificacion ? doc.data().ultimaModificacion.toDate() : 
                               (doc.data().fechaCreacion ? doc.data().fechaCreacion.toDate() : new Date()),
                ...doc.data()
            });
        }
        
        // Obtener total de alumnos
        const snapshotAlumnos = await firebase.firestore()
            .collection('usuario')
            .where('rolUser', '==', 'alumno')
            .get();
        
        const totalAlumnos = snapshotAlumnos.size;
        const porcentajeParticipacion = totalAlumnos > 0 ? 
            Math.round((alumnosRespondido.size / totalAlumnos) * 100) : 0;
        
        console.log('Estadísticas calculadas:', {
            totalRespuestas,
            alumnosRespondientes: alumnosRespondido.size,
            totalAlumnos,
            porcentajeParticipacion
        });
        
        // Crear HTML con estadísticas
        const html = `
            <h2>${encuesta.titulo}</h2>
            <p class="encuesta-descripcion">${encuesta.descripcion}</p>
            
            <div class="encuesta-fechas">
                <span>Período: ${encuesta.fechaInicio.toLocaleDateString()} al ${encuesta.fechaFin.toLocaleDateString()}</span>
                <span class="${encuesta.activa ? 'estado-activo' : 'estado-inactivo'}">
                    ${encuesta.activa ? 'Activa' : 'Inactiva'}
                </span>
            </div>
            
            <div class="estadisticas-resumen">
                <div class="estadistica-item">
                    <div class="estadistica-valor">${alumnosRespondido.size}</div>
                    <div class="estadistica-etiqueta">Alumnos Participantes</div>
                </div>
                <div class="estadistica-item">
                    <div class="estadistica-valor">${totalAlumnos - alumnosRespondido.size}</div>
                    <div class="estadistica-etiqueta">Alumnos Pendientes</div>
                </div>
                <div class="estadistica-item">
                    <div class="estadistica-valor">${totalRespuestas}</div>
                    <div class="estadistica-etiqueta">Total Respuestas</div>
                </div>
                <div class="estadistica-item">
                    <div class="estadistica-valor">${porcentajeParticipacion}%</div>
                    <div class="estadistica-etiqueta">Participación</div>
                </div>
            </div>
            
            <h3>Alumnos que han participado</h3>
            <div class="tabla-alumnos-participantes">
                ${alumnosRespondido.size > 0 ? `
                    <table>
                        <thead>
                            <tr>
                                <th>Alumno</th>
                                <th>Veces Respondido</th>
                                <th>Última Respuesta</th>
                            </tr>
                        </thead>
                        <tbody id="tbody-alumnos-participantes">
                            <tr>
                                <td colspan="3">Cargando detalles de alumnos...</td>
                            </tr>
                        </tbody>
                    </table>
                ` : '<p class="sin-resultados">Aún no hay alumnos que hayan respondido esta encuesta.</p>'}
            </div>
        `;
        
        contenidoModal.innerHTML = html;
        
        // Si hay alumnos que respondieron, cargar sus detalles
        if (alumnosRespondido.size > 0) {
            const tbodyAlumnos = document.getElementById('tbody-alumnos-participantes');
            
            // Preparar array de promesas para obtener detalles de alumnos
            const promesasAlumnos = Array.from(alumnosRespondido.keys()).map(async alumnoId => {
                try {
                    const docAlumno = await firebase.firestore()
                        .collection('usuario')
                        .doc(alumnoId)
                        .get();
                    
                    if (!docAlumno.exists) return null;
                    
                    const alumno = {
                        id: docAlumno.id,
                        ...docAlumno.data(),
                        respuestas: alumnosRespondido.get(alumnoId)
                    };
                    
                    // Ordenar respuestas por fecha (más reciente primero)
                    alumno.respuestas.sort((a, b) => b.fechaRespuesta - a.fechaRespuesta);
                    
                    return alumno;
                } catch (error) {
                    console.error(`Error al obtener alumno ${alumnoId}:`, error);
                    return null;
                }
            });
            
            // Esperar a que se completen todas las promesas
            const alumnos = (await Promise.all(promesasAlumnos)).filter(Boolean);
            
            // Construir filas de la tabla
            const filasHTML = alumnos.map(alumno => `
                <tr>
                    <td>${alumno.nombre} ${alumno.apellidoPaterno} ${alumno.apellidoMaterno || ''}</td>
                    <td>${alumno.respuestas.length}</td>
                    <td>${alumno.respuestas[0].fechaRespuesta.toLocaleString()}</td>
                </tr>
            `).join('');
            
            tbodyAlumnos.innerHTML = filasHTML || '<tr><td colspan="3">No se encontraron detalles de alumnos.</td></tr>';
        }
        
    } catch (error) {
        console.error('Error al ver estadísticas de encuesta:', error);
        const contenidoModal = document.getElementById('contenido-estadisticas-encuesta');
        if (contenidoModal) {
            contenidoModal.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        }
    }
}

/**
 * Obtiene el historial de encuestas de un alumno específico
 * @param {string} alumnoId - ID del alumno
 * @returns {Promise<Array>} - Array con el historial de encuestas
 */
async function obtenerHistorialEncuestasAlumno(alumnoId) {
    try {
        const snapshot = await firebase.firestore()
            .collection('usuario')
            .doc(alumnoId)
            .collection('historial_encuestas')
            .orderBy('ultimaModificacion', 'desc')
            .get();
        
        if (snapshot.empty) {
            return [];
        }
        
        // Procesar cada respuesta de encuesta
        const historial = await Promise.all(snapshot.docs.map(async doc => {
            const data = doc.data();
            let encuestaTitulo = 'Encuesta no disponible';
            
            // Obtener detalles de la encuesta
            try {
                const docEncuesta = await firebase.firestore()
                    .collection('encuestas')
                    .doc(data.encuestaId)
                    .get();
                
                if (docEncuesta.exists) {
                    encuestaTitulo = docEncuesta.data().titulo;
                }
            } catch (e) {
                console.error('Error al obtener detalles de encuesta:', e);
            }
            
            return {
                id: doc.id,
                encuestaId: data.encuestaId,
                encuestaTitulo: encuestaTitulo,
                fechaRespuesta: data.fechaCreacion.toDate(),
                respuestas: data.respuestas || []
            };
        }));
        
        return historial;
        
    } catch (error) {
        console.error('Error al obtener historial de encuestas:', error);
        throw error;
    }
}

// Exponer funciones al ámbito global para uso en HTML
window.inicializarGestorEncuestas = inicializarGestorEncuestas;
window.mostrarFormularioNuevaEncuesta = mostrarFormularioNuevaEncuesta;
window.crearNuevaEncuesta = crearNuevaEncuesta;
window.cambiarEstadoEncuesta = cambiarEstadoEncuesta;
window.verEstadisticasEncuesta = verEstadisticasEncuesta;
window.obtenerHistorialEncuestasAlumno = obtenerHistorialEncuestasAlumno;

// Inicializar cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si estamos en la página de encuestas
    if (document.getElementById('administracion-encuestas')) {
        inicializarGestorEncuestas();
    }
});
