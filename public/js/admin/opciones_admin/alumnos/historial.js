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
        
        // Construir HTML con el historial
        const itemsHTML = historial.map(item => `
            <div class="encuesta-historial-item">
                <div class="encuesta-historial-titulo">${item.encuestaTitulo}</div>
                <div class="encuesta-historial-fecha">Respondida el ${item.fechaRespuesta.toLocaleString()}</div>
            </div>
        `).join('');
        
        const html = `
            <h3>Historial de Encuestas</h3>
            <p>El alumno ha respondido <strong>${historial.length}</strong> encuestas en total.</p>
            <div class="historial-items">
                ${itemsHTML}
            </div>
        `;
        
        contenedor.innerHTML = html;
        
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
        const snapshot = await firebase.firestore()
            .collection('usuario')
            .doc(alumnoId)
            .collection('historialencuestas')
            .orderBy('fechaCreacion', 'desc')
            .get();
        
        if (snapshot.empty) {
            return [];
        }
        
        // Procesar cada respuesta de encuesta
        const historial = await Promise.all(snapshot.docs.map(async doc => {
            const data = doc.data();
            let encuestaTitulo = 'Encuesta no disponible';
            
            // Obtener detalles de la encuesta
            if (data.encuestaId) {
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
            }
            
            return {
                id: doc.id,
                encuestaId: data.encuestaId || '',
                encuestaTitulo: encuestaTitulo,
                fechaRespuesta: data.fechaCreacion ? data.fechaCreacion.toDate() : new Date(),
                respuestas: data.respuestas || []
            };
        }));
        
        return historial;
        
    } catch (error) {
        console.error('Error al obtener historial de encuestas:', error);
        throw error;
    }
}

// Exponer funciones al ámbito global
window.mostrarHistorialEncuestasAlumno = mostrarHistorialEncuestasAlumno;
window.obtenerHistorialEncuestasAlumno = obtenerHistorialEncuestasAlumno;
