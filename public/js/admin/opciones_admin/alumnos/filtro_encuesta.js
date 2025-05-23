/**
 * Módulo para filtrar alumnos por periodo de encuesta
 * Este archivo maneja la funcionalidad para filtrar alumnos según 
 * los periodos de encuesta que han completado.
 */

// Variables globales
let periodoEncuestaSeleccionado = '';
let alumnosPorEncuestaActual = []; // Almacena todos los alumnos que contestaron la encuesta seleccionada

/**
 * Inicializa el filtro de encuestas
 */
async function inicializarFiltroEncuesta() {
    // Cargar periodos de encuesta
    await cargarPeriodosEncuesta();
    
    // Configurar evento de cambio de filtro
    document.getElementById('filtro-periodo-encuesta')?.addEventListener('change', async (e) => {
        periodoEncuestaSeleccionado = e.target.value;
        
        if (periodoEncuestaSeleccionado) {
            console.log(`Filtrando por periodo de encuesta: ${periodoEncuestaSeleccionado}`);
            // Si se seleccionó un periodo, cargar alumnos por ese periodo
            await cargarAlumnosPorEncuesta(periodoEncuestaSeleccionado);
            
            // Aplicar los demás filtros a los alumnos cargados por encuesta
            aplicarFiltrosAdicionales();
        } else {
            console.log('Seleccionado: Todos los periodos, aplicando filtros existentes');
            // Si se deseleccionó el periodo, cargar todos los alumnos
            // pero conservando los demás filtros
            await cargarTodosLosAlumnosConFiltros();
        }
    });
    
    // Configurar evento para los otros filtros cuando hay un periodo seleccionado
    document.getElementById('filtro-carrera')?.addEventListener('change', () => {
        if (periodoEncuestaSeleccionado) {
            aplicarFiltrosAdicionales();
        }
    });
    
    document.getElementById('filtro-verificado')?.addEventListener('change', () => {
        if (periodoEncuestaSeleccionado) {
            aplicarFiltrosAdicionales();
        }
    });
    
    document.getElementById('busqueda')?.addEventListener('keyup', (e) => {
        if (e.key === 'Enter' && periodoEncuestaSeleccionado) {
            aplicarFiltrosAdicionales();
        }
    });
    
    document.getElementById('btn-buscar')?.addEventListener('click', () => {
        if (periodoEncuestaSeleccionado) {
            aplicarFiltrosAdicionales();
        }
    });
}

/**
 * Carga los periodos de encuesta disponibles
 */
async function cargarPeriodosEncuesta() {
    try {
        const snapshot = await firebase.firestore()
            .collection('encuestas')
            .orderBy('fechaInicio', 'desc')
            .get();
        
        if (snapshot.empty) {
            console.log('No hay periodos de encuesta disponibles');
            return;
        }
        
        // Procesar encuestas
        const periodosEncuesta = snapshot.docs.map(doc => {
            const data = doc.data();
            // Formatear fechas para mostrar en la UI
            const fechaInicio = data.fechaInicio.toDate().toLocaleDateString('es-MX');
            const fechaFin = data.fechaFin.toDate().toLocaleDateString('es-MX');
            
            return {
                id: doc.id,
                titulo: data.titulo,
                fechaInicio: fechaInicio,
                fechaFin: fechaFin,
                label: `${data.titulo} (${fechaInicio} - ${fechaFin})`
            };
        });
        
        // Llenar el select de filtro
        const options = periodosEncuesta.map(periodo => {
            return `<option value="${periodo.id}">${periodo.label}</option>`;
        }).join('');
        
        const filtroPeriodo = document.getElementById('filtro-periodo-encuesta');
        if (filtroPeriodo) {
            filtroPeriodo.innerHTML = '<option value="">Todos los periodos</option>' + options;
        }
        
    } catch (error) {
        console.error('Error al cargar periodos de encuesta:', error);
    }
}

/**
 * Carga los alumnos que han completado una encuesta específica
 * @param {string} encuestaId - ID de la encuesta
 */
async function cargarAlumnosPorEncuesta(encuestaId) {
    try {
        const tablaAlumnos = document.getElementById('tabla-alumnos');
        if (!tablaAlumnos) return;
        
        tablaAlumnos.innerHTML = '<p class="cargando">Filtrando alumnos por periodo de encuesta...</p>';
        
        // Obtener las respuestas para esta encuesta
        const respuestasSnapshot = await firebase.firestore()
            .collectionGroup('historial_encuestas')
            .where('encuestaId', '==', encuestaId)
            .get();
        
        console.log(`Se encontraron ${respuestasSnapshot.size} respuestas para la encuesta ${encuestaId}`);
        
        if (respuestasSnapshot.empty) {
            tablaAlumnos.innerHTML = '<p class="sin-resultados">No hay alumnos que hayan completado este periodo de encuesta.</p>';
            alumnosFiltrados = [];
            alumnosPorEncuestaActual = [];
            mostrarAlumnosPaginados();
            return;
        }
        
        // Extraer IDs únicos de alumnos que han respondido
        const alumnosIds = new Set();
        for (const doc of respuestasSnapshot.docs) {
            // El ID del alumno está en el padre del padre de la colección historial_encuestas
            const alumnoId = doc.ref.parent.parent.id;
            alumnosIds.add(alumnoId);
        }
        
        console.log(`Se encontraron ${alumnosIds.size} alumnos únicos que respondieron la encuesta`);
        
        // Cargar datos completos de esos alumnos
        if (alumnosIds.size === 0) {
            tablaAlumnos.innerHTML = '<p class="sin-resultados">No hay alumnos que hayan completado este periodo de encuesta.</p>';
            alumnosFiltrados = [];
            alumnosPorEncuestaActual = [];
            mostrarAlumnosPaginados();
            return;
        }
        
        // Firestore no permite consultas con más de 10 valores en una cláusula 'in'
        // Así que dividimos en bloques si es necesario
        const alumnosIdsArray = Array.from(alumnosIds);
        const chunks = [];
        for (let i = 0; i < alumnosIdsArray.length; i += 10) {
            chunks.push(alumnosIdsArray.slice(i, i + 10));
        }
        
        let alumnosEncontrados = [];
        
        // Realizar consultas por cada bloque
        for (const chunk of chunks) {
            const alumnosSnapshot = await firebase.firestore()
                .collection('usuario')
                .where(firebase.firestore.FieldPath.documentId(), 'in', chunk)
                .get();
                
            // Convertir documentos a instancias de Usuario
            const alumnosChunk = await Promise.all(alumnosSnapshot.docs.map(async doc => {
                const alumno = Usuario.fromFirestore(doc.id, doc.data());
                
                // Obtener directamente el nombre de la carrera del alumno
                const datosOriginales = doc.data();
                
                if (datosOriginales.carrera) {
                    alumno.nombreCarrera = datosOriginales.carrera;
                } else if (alumno.carreraId) {
                    try {
                        const carreraDoc = await firebase.firestore()
                            .collection('carreras')
                            .doc(alumno.carreraId)
                            .get();
                        
                        if (carreraDoc.exists) {
                            alumno.nombreCarrera = carreraDoc.data().nombre || 'Sin nombre';
                        } else {
                            alumno.nombreCarrera = 'No asignada';
                        }
                    } catch (error) {
                        console.error('Error al obtener carrera:', error);
                        alumno.nombreCarrera = 'Error al cargar';
                    }
                } else {
                    alumno.nombreCarrera = 'No asignada';
                }
                
                return alumno;
            }));
            
            alumnosEncontrados = [...alumnosEncontrados, ...alumnosChunk];
        }
        
        console.log(`Se cargaron ${alumnosEncontrados.length} alumnos con datos completos`);
        
        // Guardar la lista completa de alumnos que contestaron esta encuesta
        alumnosPorEncuestaActual = [...alumnosEncontrados];
        
        // Actualizar variables globales para mostrar
        alumnosFiltrados = alumnosEncontrados;
        
        // Mostrar la tabla
        mostrarAlumnosPaginados();
        
    } catch (error) {
        console.error('Error al cargar alumnos por encuesta:', error);
        const tablaAlumnos = document.getElementById('tabla-alumnos');
        if (tablaAlumnos) {
            tablaAlumnos.innerHTML = `<p class="sin-resultados">Error al filtrar alumnos: ${error.message}</p>`;
        }
    }
}

/**
 * Carga todos los alumnos pero aplicando los filtros actuales de carrera, verificación y búsqueda
 */
async function cargarTodosLosAlumnosConFiltros() {
    try {
        // Obtener valores de los filtros actuales
        const busqueda = document.getElementById('busqueda');
        const filtroCarrera = document.getElementById('filtro-carrera');
        const filtroVerificado = document.getElementById('filtro-verificado');
        
        if (!busqueda || !filtroCarrera || !filtroVerificado) return;
        
        const textoBusqueda = busqueda.value.toLowerCase().trim();
        const carreraId = filtroCarrera.value;
        const estadoVerificacion = filtroVerificado.value;
        
        console.log('Cargando todos los alumnos con filtros:', {
            textoBusqueda,
            carreraId,
            estadoVerificacion
        });
        
        // Si no hay ningún filtro activo, simplemente cargar todos los alumnos
        if (textoBusqueda === '' && carreraId === '' && estadoVerificacion === '') {
            return cargarAlumnos();
        }
        
        // Si hay algún filtro activo, necesitamos aplicarlos a todos los alumnos
        const tablaAlumnos = document.getElementById('tabla-alumnos');
        if (tablaAlumnos) {
            tablaAlumnos.innerHTML = '<p class="cargando">Cargando alumnos con filtros...</p>';
        }
        
        // Construir la consulta base
        let query = firebase.firestore().collection('usuario').where('rolUser', '==', 'alumno');
        
        // Aplicar filtro de verificación si está activo
        if (estadoVerificacion !== '') {
            query = query.where('emailVerificado', '==', estadoVerificacion === 'true');
        }
        
        // Aplicar filtro de carrera si está activo y es posible hacerlo en la consulta
        // (no siempre es posible filtrar por carrera directamente en la consulta)
        
        // Ejecutar consulta
        const snapshot = await query.get();
        
        if (snapshot.empty) {
            if (tablaAlumnos) {
                tablaAlumnos.innerHTML = '<p class="sin-resultados">No se encontraron alumnos con los criterios especificados.</p>';
            }
            alumnosFiltrados = [];
            mostrarAlumnosPaginados();
            return;
        }
        
        // Convertir documentos a instancias de Usuario
        let todosLosAlumnos = await Promise.all(snapshot.docs.map(async doc => {
            const alumno = Usuario.fromFirestore(doc.id, doc.data());
            
            // Obtener directamente el nombre de la carrera del alumno
            const datosOriginales = doc.data();
            
            if (datosOriginales.carrera) {
                alumno.nombreCarrera = datosOriginales.carrera;
            } else if (alumno.carreraId) {
                try {
                    const carreraDoc = await firebase.firestore()
                        .collection('carreras')
                        .doc(alumno.carreraId)
                        .get();
                    
                    if (carreraDoc.exists) {
                        alumno.nombreCarrera = carreraDoc.data().nombre || 'Sin nombre';
                    } else {
                        alumno.nombreCarrera = 'No asignada';
                    }
                } catch (error) {
                    console.error('Error al obtener carrera:', error);
                    alumno.nombreCarrera = 'Error al cargar';
                }
            } else {
                alumno.nombreCarrera = 'No asignada';
            }
            
            return alumno;
        }));
        
        // Aplicar los filtros que no se pueden aplicar directamente en la consulta
        alumnosFiltrados = todosLosAlumnos.filter(alumno => {
            // Filtrar por texto de búsqueda
            const cumpleBusqueda = textoBusqueda === '' || 
                alumno.getNombreCompleto().toLowerCase().includes(textoBusqueda) ||
                alumno.usuario.toLowerCase().includes(textoBusqueda) ||
                (alumno.nombreCarrera && alumno.nombreCarrera.toLowerCase().includes(textoBusqueda));
            
            // Filtrar por carrera si está activo el filtro
            let cumpleCarrera = carreraId === ''; // Si no hay filtro, todos cumplen
            
            if (carreraId !== '') {
                // Buscar la carrera seleccionada
                const carreraSeleccionada = todasLasCarreras.find(c => c.id === carreraId);
                
                if (carreraSeleccionada) {
                    // Comparar por ID o por nombre de carrera
                    cumpleCarrera = 
                        alumno.carreraId === carreraId || // Coincide por ID
                        (alumno.nombreCarrera && 
                        carreraSeleccionada.nombre && 
                        alumno.nombreCarrera.toLowerCase() === carreraSeleccionada.nombre.toLowerCase()); // Coincide por nombre
                } else {
                    // Si no encontramos la carrera seleccionada, solo filtrar por ID
                    cumpleCarrera = alumno.carreraId === carreraId;
                }
            }
            
            return cumpleBusqueda && cumpleCarrera;
        });
        
        console.log(`Se encontraron ${alumnosFiltrados.length} alumnos que cumplen con los filtros`);
        
        // Mostrar los resultados
        paginaActual = 1;
        mostrarAlumnosPaginados();
        
    } catch (error) {
        console.error('Error al cargar alumnos con filtros:', error);
        const tablaAlumnos = document.getElementById('tabla-alumnos');
        if (tablaAlumnos) {
            tablaAlumnos.innerHTML = `<p class="sin-resultados">Error al cargar alumnos: ${error.message}</p>`;
        }
    }
}

/**
 * Aplica los filtros adicionales (carrera, verificación, búsqueda) a los alumnos
 * que ya han sido filtrados por periodo de encuesta
 */
function aplicarFiltrosAdicionales() {
    // Si no hay alumnos que contestaron la encuesta seleccionada, no hacer nada
    if (!alumnosPorEncuestaActual || alumnosPorEncuestaActual.length === 0) {
        return;
    }
    
    // Obtener los valores de los filtros
    const busqueda = document.getElementById('busqueda');
    const filtroCarrera = document.getElementById('filtro-carrera');
    const filtroVerificado = document.getElementById('filtro-verificado');
    
    if (!busqueda || !filtroCarrera || !filtroVerificado) return;
    
    const textoBusqueda = busqueda.value.toLowerCase().trim();
    const carreraId = filtroCarrera.value;
    const estadoVerificacion = filtroVerificado.value;
    
    console.log(`Aplicando filtros adicionales a ${alumnosPorEncuestaActual.length} alumnos:`, {
        textoBusqueda,
        carreraId,
        estadoVerificacion
    });
    
    // Aplicar filtros adicionales a los alumnos que contestaron la encuesta
    alumnosFiltrados = alumnosPorEncuestaActual.filter(alumno => {
        // Filtrar por texto de búsqueda
        const cumpleBusqueda = textoBusqueda === '' || 
            alumno.getNombreCompleto().toLowerCase().includes(textoBusqueda) ||
            alumno.usuario.toLowerCase().includes(textoBusqueda) ||
            (alumno.nombreCarrera && alumno.nombreCarrera.toLowerCase().includes(textoBusqueda));
        
        // Filtrar por carrera
        let cumpleCarrera = carreraId === ''; // Si no hay filtro, todos cumplen
        
        if (carreraId !== '') {
            // Buscar la carrera seleccionada para tener su nombre
            const carreraSeleccionada = todasLasCarreras.find(c => c.id === carreraId);
            
            if (carreraSeleccionada) {
                // Comparar por ID o por nombre de carrera
                cumpleCarrera = 
                    alumno.carreraId === carreraId || // Coincide por ID
                    (alumno.nombreCarrera && 
                    carreraSeleccionada.nombre && 
                    alumno.nombreCarrera.toLowerCase() === carreraSeleccionada.nombre.toLowerCase()); // Coincide por nombre
            } else {
                // Si no encontramos la carrera seleccionada, solo filtrar por ID
                cumpleCarrera = alumno.carreraId === carreraId;
            }
        }
        
        // Filtrar por estado de verificación
        const cumpleVerificacion = estadoVerificacion === '' || 
            alumno.emailVerificado.toString() === estadoVerificacion;
            
        // Devolver verdadero solo si cumple con todos los filtros
        return cumpleBusqueda && cumpleCarrera && cumpleVerificacion;
    });
    
    console.log(`Después de aplicar filtros adicionales, quedan ${alumnosFiltrados.length} alumnos`);
    
    // Actualizar la tabla con los resultados filtrados
    paginaActual = 1;
    mostrarAlumnosPaginados();
}
