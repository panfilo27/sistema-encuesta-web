/**
 * Administración de Alumnos - JavaScript
 * Este archivo maneja la funcionalidad para listar, buscar, filtrar
 * y ver detalles de los alumnos registrados en el sistema.
 */

// Bandera para controlar la inicialización
let modeloCargado = false;

// Función para verificar si el modelo Usuario está disponible
function verificarModeloUsuario() {
    if (typeof Usuario !== 'undefined') {
        // Si ya está disponible, inicializar directamente
        console.log('Modelo Usuario ya está disponible');
        modeloCargado = true;
        return true;
    }
    
    // Si no está disponible, cargarlo dinámicamente
    console.log('Cargando modelo Usuario...');
    const scriptUsuario = document.createElement('script');
    scriptUsuario.src = '../../../../models/Usuario.js';
    scriptUsuario.onload = function() {
        console.log('Modelo Usuario cargado correctamente');
        modeloCargado = true;
        inicializarGestorAlumnos();
    };
    scriptUsuario.onerror = function() {
        console.error('Error al cargar el modelo Usuario');
        alert('Error al cargar el modelo Usuario. Algunas funcionalidades no estarán disponibles.');
    };
    document.head.appendChild(scriptUsuario);
    return false;
}

// Variables globales para la gestión de alumnos
let ITEMS_POR_PAGINA = 10;
let paginaActual = 1;
let totalPaginas = 1;
let alumnosFiltrados = [];
let todasLasCarreras = [];
let todosLosAlumnos = [];
let todosLosPeriodosEncuesta = []; // Para almacenar todos los períodos de encuesta

// Función para inicializar la gestión de alumnos
function inicializarGestorAlumnos() {
    // Si ya está inicializado, no hacer nada
    if (window.gestorAlumnosInicializado) return;
    
    // Verificar si el modelo Usuario está disponible
    if (!modeloCargado && !verificarModeloUsuario()) {
        // Si no está disponible y se está cargando, salir
        // La inicialización se retomará cuando el script termine de cargar
        return;
    }
    
    window.gestorAlumnosInicializado = true;
    console.log('Inicializando gestor de alumnos...');
    
    // Verificar autenticación
    verificarAutenticacion();
    
    // Configurar eventos
    configurarEventos();
    
    // Cargar datos
    cargarCarreras();
    cargarAlumnos();
    
    // Inicializar el filtro de encuestas
    if (typeof inicializarFiltroEncuesta === 'function') {
        inicializarFiltroEncuesta();
    } else {
        console.error('No se encontró la función inicializarFiltroEncuesta. Asegúrate de que el script filtro_encuesta.js esté cargado.');
    }
    
    // Cargar contenido de encuestas
    cargarContenidoEncuestas();
}

/**
 * Verifica que el usuario esté autenticado y tenga rol de administrador
 */
function verificarAutenticacion() {
    const userSession = localStorage.getItem('userSession');
    
    if (!userSession) {
        window.location.href = '../../../../auth/login.html';
        return;
    }
    
    try {
        const userData = JSON.parse(userSession);
        
        if (userData.rolUser !== 'admin') {
            alert('No tienes permisos para acceder a esta página.');
            window.location.href = '../../../../auth/login.html';
        }
    } catch (error) {
        console.error('Error al verificar autenticación:', error);
        window.location.href = '../../../../auth/login.html';
    }
}

/**
 * Configura los eventos de la interfaz
 */
function configurarEventos() {
    // Botón de búsqueda
    document.getElementById('btn-buscar')?.addEventListener('click', () => {
        paginaActual = 1;
        filtrarAlumnos();
    });
    
    // Búsqueda con Enter
    document.getElementById('busqueda')?.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            paginaActual = 1;
            filtrarAlumnos();
        }
    });
    
    // Filtros
    document.getElementById('filtro-carrera')?.addEventListener('change', () => {
        paginaActual = 1;
        filtrarAlumnos();
    });
    
    document.getElementById('filtro-verificado')?.addEventListener('change', () => {
        paginaActual = 1;
        filtrarAlumnos();
    });
    
    document.getElementById('filtro-periodo-encuesta')?.addEventListener('change', () => {
        paginaActual = 1;
        filtrarAlumnos();
    });
    
    // Paginación
    document.getElementById('btn-anterior')?.addEventListener('click', () => {
        if (paginaActual > 1) {
            paginaActual--;
            mostrarAlumnosPaginados();
        }
    });
    
    document.getElementById('btn-siguiente')?.addEventListener('click', () => {
        if (paginaActual < totalPaginas) {
            paginaActual++;
            mostrarAlumnosPaginados();
        }
    });
    
    // Modal
    document.querySelector('.close')?.addEventListener('click', () => {
        document.getElementById('modal-detalle').style.display = 'none';
    });
    
    window.addEventListener('click', (event) => {
        if (event.target === document.getElementById('modal-detalle')) {
            document.getElementById('modal-detalle').style.display = 'none';
        }
    });
}

/**
 * Carga la lista de carreras desde Firestore
 */
async function cargarCarreras() {
    try {
        const snapshot = await firebase.firestore().collection('carreras').get();
        
        todasLasCarreras = snapshot.docs.map(doc => {
            return {
                id: doc.id,
                nombre: doc.data().nombre
            };
        });
        
        // Ordenar alfabéticamente
        todasLasCarreras.sort((a, b) => a.nombre.localeCompare(b.nombre));
        
        // Llenar el select de filtro
        const options = todasLasCarreras.map(carrera => {
            return `<option value="${carrera.id}">${carrera.nombre}</option>`;
        }).join('');
        
        const filtroCarrera = document.getElementById('filtro-carrera');
        if (filtroCarrera) {
            filtroCarrera.innerHTML = '<option value="">Todas las carreras</option>' + options;
        }
        
    } catch (error) {
        console.error('Error al cargar carreras:', error);
        alert('Error al cargar carreras. Por favor, recarga la página.');
    }
}

/**
 * Carga los periodos de encuesta desde Firestore
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
        todosLosPeriodosEncuesta = snapshot.docs.map(doc => {
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
        const options = todosLosPeriodosEncuesta.map(periodo => {
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
 * Carga todos los alumnos desde Firestore
 */
async function cargarAlumnos() {
    try {
        const tablaAlumnos = document.getElementById('tabla-alumnos');
        if (!tablaAlumnos) return;
        
        tablaAlumnos.innerHTML = '<p class="cargando">Cargando alumnos...</p>';
        
        const snapshot = await firebase.firestore()
            .collection('usuario')
            .where('rolUser', '==', 'alumno')
            .get();
        
        if (snapshot.empty) {
            tablaAlumnos.innerHTML = '<p class="sin-resultados">No hay alumnos registrados en el sistema.</p>';
            return;
        }
        
        // Convertir documentos a instancias de Usuario
        todosLosAlumnos = await Promise.all(snapshot.docs.map(async doc => {
            const alumno = Usuario.fromFirestore(doc.id, doc.data());
            
            // Obtener directamente el nombre de la carrera del alumno
            // En los datos del usuario ya existe la propiedad 'carrera'
            const datosOriginales = doc.data();
            console.log(`DEPURACIÓN CARRERA - Datos originales del alumno ${alumno.nombre}:`, datosOriginales);
            
            if (datosOriginales.carrera) {
                // Usar directamente la carrera que viene en el documento
                console.log(`DEPURACIÓN CARRERA - Alumno ${alumno.nombre} tiene carrera: ${datosOriginales.carrera}`);
                alumno.nombreCarrera = datosOriginales.carrera;
            } else if (alumno.carreraId) {
                // Como respaldo, buscar por ID si existe pero no tiene el nombre
                console.log(`DEPURACIÓN CARRERA - Alumno tiene carreraId pero no carrera: ${alumno.carreraId}`);
                
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
                console.log(`DEPURACIÓN CARRERA - Alumno ${alumno.nombre} no tiene información de carrera`);
                alumno.nombreCarrera = 'No asignada';
            }
            
            // Obtener el historial de encuestas del alumno
            try {
                // Usar la ruta correcta: usuario/[id_usuario]/historial_encuestas
                const historialSnapshot = await firebase.firestore()
                    .collection('usuario')
                    .doc(doc.id)
                    .collection('historial_encuestas')
                    .get();
                
                console.log(`Historial encontrado para alumno ${alumno.nombre}:`, historialSnapshot.size);
                
                if (!historialSnapshot.empty) {
                    alumno.historialEncuestas = historialSnapshot.docs.map(historialDoc => {
                        const historialData = historialDoc.data();
                        const encuestaId = historialData.encuestaId;
                        console.log(`Encuesta contestada: ${encuestaId} por alumno ${alumno.nombre}`);
                        return {
                            encuestaId: encuestaId,
                            fechaCompletado: historialData.fechaCompletado?.toDate(),
                            modulosCompletados: historialData.modulosCompletados || []
                        };
                    });
                } else {
                    alumno.historialEncuestas = [];
                }
            } catch (error) {
                console.error(`Error al obtener historial de encuestas para ${alumno.nombre}:`, error);
                alumno.historialEncuestas = [];
            }
            
            return alumno;
        }));
        
        // Iniciar con todos los alumnos
        alumnosFiltrados = [...todosLosAlumnos];
        
        // Mostrar la tabla
        mostrarAlumnosPaginados();
        
    } catch (error) {
        console.error('Error al cargar alumnos:', error);
        const tablaAlumnos = document.getElementById('tabla-alumnos');
        if (tablaAlumnos) {
            tablaAlumnos.innerHTML = '<p class="sin-resultados">Error al cargar alumnos. Por favor, recarga la página.</p>';
        }
    }
}

/**
 * Filtra los alumnos según los criterios de búsqueda y filtros
 */
function filtrarAlumnos() {
    const busqueda = document.getElementById('busqueda');
    const filtroCarrera = document.getElementById('filtro-carrera');
    const filtroVerificado = document.getElementById('filtro-verificado');
    const filtroPeriodoEncuesta = document.getElementById('filtro-periodo-encuesta');
    
    if (!busqueda || !filtroCarrera || !filtroVerificado) return;
    
    const textoBusqueda = busqueda.value.toLowerCase().trim();
    const carreraId = filtroCarrera.value;
    const estadoVerificacion = filtroVerificado.value;
    const periodoEncuestaId = filtroPeriodoEncuesta ? filtroPeriodoEncuesta.value : '';
    
    alumnosFiltrados = todosLosAlumnos.filter(alumno => {
        // Filtrar por texto de búsqueda
        const cumpleBusqueda = textoBusqueda === '' || 
            alumno.getNombreCompleto().toLowerCase().includes(textoBusqueda) ||
            alumno.usuario.toLowerCase().includes(textoBusqueda) ||
            (alumno.nombreCarrera && alumno.nombreCarrera.toLowerCase().includes(textoBusqueda));
        
        // Filtrar por carrera - Ahora puede filtrar tanto por ID como por nombre
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
            
        // Filtrar por periodo de encuesta
        let cumplePeriodoEncuesta = periodoEncuestaId === ''; // Si no hay filtro, todos cumplen
        
        if (periodoEncuestaId !== '') {
            console.log(`Filtrando alumno ${alumno.nombre} para periodo ${periodoEncuestaId}`);
            console.log('Historial de encuestas:', alumno.historialEncuestas);
            
            // Verificar explícitamente si el alumno tiene historial y si contiene la encuesta buscada
            if (alumno.historialEncuestas && Array.isArray(alumno.historialEncuestas) && alumno.historialEncuestas.length > 0) {
                // Buscar si alguna entrada en el historial coincide con el ID de encuesta seleccionado
                const tieneEncuesta = alumno.historialEncuestas.some(historial => {
                    console.log(`Comparando ${historial.encuestaId} con ${periodoEncuestaId}`);
                    return historial.encuestaId === periodoEncuestaId;
                });
                
                cumplePeriodoEncuesta = tieneEncuesta;
                console.log(`Alumno ${alumno.nombre} ${tieneEncuesta ? 'CUMPLE' : 'NO CUMPLE'} con el filtro de periodo`);
            } else {
                cumplePeriodoEncuesta = false;
                console.log(`Alumno ${alumno.nombre} NO tiene historial de encuestas`);
            }
        }
        
        return cumpleBusqueda && cumpleCarrera && cumpleVerificacion && cumplePeriodoEncuesta;
    });
    
    // Mostrar resultados paginados
    paginaActual = 1;
    mostrarAlumnosPaginados();
}

/**
 * Muestra los alumnos filtrados de forma paginada
 */
function mostrarAlumnosPaginados() {
    const tablaAlumnos = document.getElementById('tabla-alumnos');
    const infoPagina = document.getElementById('info-pagina');
    const btnAnterior = document.getElementById('btn-anterior');
    const btnSiguiente = document.getElementById('btn-siguiente');
    
    if (!tablaAlumnos || !infoPagina || !btnAnterior || !btnSiguiente) return;
    
    // Calcular total de páginas
    totalPaginas = Math.ceil(alumnosFiltrados.length / ITEMS_POR_PAGINA);
    
    // Validar página actual
    if (paginaActual < 1) paginaActual = 1;
    if (paginaActual > totalPaginas) paginaActual = totalPaginas;
    
    // Calcular índices de inicio y fin
    const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
    const fin = Math.min(inicio + ITEMS_POR_PAGINA, alumnosFiltrados.length);
    
    // Obtener alumnos de la página actual
    const alumnosPagina = alumnosFiltrados.slice(inicio, fin);
    
    // Actualizar información de paginación
    infoPagina.textContent = totalPaginas > 0 
        ? `Página ${paginaActual} de ${totalPaginas}`
        : 'Sin resultados';
    
    // Habilitar/deshabilitar botones de paginación
    btnAnterior.disabled = paginaActual <= 1;
    btnSiguiente.disabled = paginaActual >= totalPaginas;
    
    // Mostrar mensaje si no hay resultados
    if (alumnosFiltrados.length === 0) {
        tablaAlumnos.innerHTML = '<p class="sin-resultados">No se encontraron alumnos con los criterios especificados.</p>';
        return;
    }
    
    // Construir HTML de la tabla
    const html = `
        <table>
            <thead>
                <tr>
                    <th>Número de Control</th>
                    <th>Nombre</th>
                    <th>Carrera</th>
                    <th>Email</th>
                    <th>Verificado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${alumnosPagina.map(alumno => `
                    <tr>
                        <td>${alumno.usuario}</td>
                        <td>${alumno.getNombreCompleto()}</td>
                        <td>${alumno.nombreCarrera}</td>
                        <td>${alumno.email}</td>
                        <td>
                            <span class="${alumno.emailVerificado ? 'verificado' : 'no-verificado'}">
                                <i class="fas fa-${alumno.emailVerificado ? 'check-circle' : 'times-circle'}"></i>
                                ${alumno.emailVerificado ? 'Sí' : 'No'}
                            </span>
                        </td>
                        <td>
                            <button class="acciones-btn btn-ver" onclick="verDetalles('${alumno.id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    tablaAlumnos.innerHTML = html;
}

/**
 * Muestra el detalle de un alumno en el modal
 * @param {string} id - ID del alumno
 */
function verDetalles(id) {
    try {
        const modalDetalle = document.getElementById('modal-detalle');
        const detalleAlumno = document.getElementById('detalle-alumno');
        const historialEncuestas = document.getElementById('historial-encuestas-alumno');
        
        if (!modalDetalle || !detalleAlumno) return;
        
        // Mostrar indicador de carga
        detalleAlumno.innerHTML = '<p class="cargando">Cargando detalles...</p>';
        if (historialEncuestas) {
            historialEncuestas.innerHTML = '<p class="cargando">Cargando historial de encuestas...</p>';
        }
        modalDetalle.style.display = 'block';
        
        // Buscar alumno en el array (para evitar otra consulta a Firestore)
        const alumno = todosLosAlumnos.find(a => a.id === id);
        
        if (!alumno) {
            throw new Error('No se encontró el alumno solicitado');
        }
        
        // Obtener datos adicionales si es necesario
        let carreraNombre = alumno.nombreCarrera || 'No asignada';
        
        // Formatear fechas
        const formatoFecha = {
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        const fechaCreacion = alumno.fechaCreacion.toLocaleDateString('es-ES', formatoFecha);
        const fechaActualizacion = alumno.fechaActualizacion.toLocaleDateString('es-ES', formatoFecha);
        
        // Construir HTML de los detalles
        const html = `
            <div class="detalle-fila">
                <div class="detalle-columna">
                    <div class="detalle-grupo">
                        <h3>Número de Control</h3>
                        <p>${alumno.usuario}</p>
                    </div>
                </div>
                <div class="detalle-columna">
                    <div class="detalle-grupo">
                        <h3>Email</h3>
                        <p>${alumno.email}</p>
                    </div>
                </div>
            </div>
            
            <div class="detalle-fila">
                <div class="detalle-columna">
                    <div class="detalle-grupo">
                        <h3>Nombre Completo</h3>
                        <p>${alumno.getNombreCompleto()}</p>
                    </div>
                </div>
                <div class="detalle-columna">
                    <div class="detalle-grupo">
                        <h3>Carrera</h3>
                        <p>${carreraNombre}</p>
                    </div>
                </div>
            </div>
            
            <div class="detalle-grupo">
                <h3>Estado de Verificación</h3>
                <p class="${alumno.emailVerificado ? 'verificado' : 'no-verificado'}">
                    <i class="fas fa-${alumno.emailVerificado ? 'check-circle' : 'times-circle'}"></i>
                    ${alumno.emailVerificado ? 'Email verificado' : 'Email no verificado'}
                </p>
            </div>
            
            <div class="datos-verificacion">
                <h3>Datos del Sistema</h3>
                <div class="detalle-fila">
                    <div class="detalle-columna">
                        <div class="detalle-grupo">
                            <h3>Fecha de Registro</h3>
                            <p class="fecha-dato">${fechaCreacion}</p>
                        </div>
                    </div>
                    <div class="detalle-columna">
                        <div class="detalle-grupo">
                            <h3>Última Actualización</h3>
                            <p class="fecha-dato">${fechaActualizacion}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        detalleAlumno.innerHTML = html;
        
        // Cargar historial de encuestas si está disponible la función
        const contenedorHistorial = document.getElementById('historial-encuestas-alumno');
        if (contenedorHistorial && typeof mostrarHistorialEncuestasAlumno === 'function') {
            mostrarHistorialEncuestasAlumno(id, 'historial-encuestas-alumno');
        } else if (contenedorHistorial) {
            // Si no está disponible la función, cargar el script
            const scriptHistorial = document.createElement('script');
            scriptHistorial.src = 'historial.js';
            scriptHistorial.onload = function() {
                if (typeof mostrarHistorialEncuestasAlumno === 'function') {
                    mostrarHistorialEncuestasAlumno(id, 'historial-encuestas-alumno');
                }
            };
            document.head.appendChild(scriptHistorial);
        }
        
    } catch (error) {
        console.error('Error al cargar detalles del alumno:', error);
        const detalleAlumno = document.getElementById('detalle-alumno');
        if (detalleAlumno) {
            detalleAlumno.innerHTML = `<p class="sin-resultados">Error: ${error.message}</p>`;
        }
    }
}



/**
 * Carga el contenido de la sección de encuestas
 */
function cargarContenidoEncuestas() {
    const seccionEncuestas = document.getElementById('seccion-encuestas');
    if (!seccionEncuestas) return;
    
    // Verificar si ya se ha cargado el contenido adecuado
    if (seccionEncuestas.querySelector('#administracion-encuestas')) {
        return; // Ya se ha cargado correctamente
    }
    
    // Crear HTML directamente
    seccionEncuestas.innerHTML = `
        <div id="administracion-encuestas" class="administracion-encuestas">
            <div class="encuestas-header">
                <h3>Períodos de Encuestas</h3>
                <button id="btn-nueva-encuesta" class="btn-nueva-encuesta">
                    <i class="fas fa-plus"></i> Nueva Encuesta
                </button>
            </div>
            
            <!-- Estadísticas generales -->
            <div id="estadisticas-encuestas" class="estadisticas-encuestas">
                <!-- Aquí se cargarán las estadísticas -->
                <p class="cargando">Cargando estadísticas...</p>
            </div>
            
            <!-- Formulario para nueva encuesta -->
            <div id="formulario-nueva-encuesta" class="formulario-nueva-encuesta">
                <h3>Crear Nueva Encuesta</h3>
                <form id="form-nueva-encuesta">
                    <div class="form-group">
                        <label for="titulo-encuesta">Título de la Encuesta:</label>
                        <input type="text" id="titulo-encuesta" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="descripcion-encuesta">Descripción:</label>
                        <textarea id="descripcion-encuesta" required></textarea>
                    </div>
                    
                    <h4>Periodo de Inicio</h4>
<div class="inline-datetime-container" id="inicio-datetime-container">
    <div class="calendar-container">
        <div class="calendar-header">
            <h5 id="inicio-calendar-title">Mayo 2025</h5>
            <div class="calendar-nav">
                <button id="inicio-prev-month" type="button">&lt;</button>
                <button id="inicio-next-month" type="button">&gt;</button>
            </div>
        </div>
        <div class="calendar-weekdays">
            <div>D</div><div>L</div><div>M</div><div>M</div><div>J</div><div>V</div><div>S</div>
        </div>
        <div class="calendar-days" id="inicio-calendar-days">
            <!-- Los días se generarán mediante JavaScript -->
        </div>
    </div>
    <div class="time-selector">
        <h5>Hora</h5>
        <div class="time-controls">
            <div class="time-spinner">
                <button type="button" id="inicio-hour-up">&#9650;</button>
                <div class="time-spinner-value" id="inicio-hour-value">12</div>
                <button type="button" id="inicio-hour-down">&#9660;</button>
            </div>
            <div class="time-separator">:</div>
            <div class="time-spinner">
                <button type="button" id="inicio-min-up">&#9650;</button>
                <div class="time-spinner-value" id="inicio-min-value">00</div>
                <button type="button" id="inicio-min-down">&#9660;</button>
            </div>
        </div>
        <div class="ampm-toggle">
            <div class="ampm-btn active" id="inicio-am-btn">AM</div>
            <div class="ampm-btn" id="inicio-pm-btn">PM</div>
        </div>
    </div>
    <input type="hidden" id="fecha-inicio-encuesta" name="fecha-inicio-encuesta" required>
    <input type="hidden" id="hora-inicio-encuesta" name="hora-inicio-encuesta" required>
</div>
                    
                    <h4>Periodo de Fin</h4>
                    <div class="fecha-hora-container">
                        <div class="form-group">
                            <label for="fecha-fin-encuesta">Fecha de Fin:</label>
                            <input type="date" id="fecha-fin-encuesta" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="hora-fin-encuesta">Hora de Fin:</label>
                            <input type="time" id="hora-fin-encuesta" value="23:59" required>
                        </div>
                    </div>
                    
                    <span id="error-encuesta" class="error-mensaje"></span>
                    
                    <div class="form-buttons">
                        <button type="button" id="btn-cancelar-encuesta" class="btn-cancelar">Cancelar</button>
                        <button type="submit" class="btn-guardar">Guardar Encuesta</button>
                    </div>
                </form>
            </div>
            
            <!-- Tabla de encuestas activas -->
            <div class="tabla-encuestas">
                <h3>Encuestas Configuradas</h3>
                <div id="tabla-encuestas-activas">
                    <!-- Aquí se cargará la tabla de encuestas -->
                    <p class="cargando">Cargando encuestas...</p>
                </div>
            </div>
        </div>
    `;
    
    // Importar CSS para el calendario inline si no está cargado
    if (!document.querySelector('link[href*="inline-calendar.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '../../../../css/admin/opciones_admin/alumnos/inline-calendar.css';
        document.head.appendChild(link);
    }

    // Inicializar el calendario y selector de hora inline para periodo de inicio
    (function initCalendarioInlineInicio() {
        // Funciones utilidad
        const pad = n => n.toString().padStart(2, '0');
        const formatoFecha = (date) => `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
        
        // Elementos DOM
        const inputFecha = document.getElementById('fecha-inicio-encuesta');
        const inputHora = document.getElementById('hora-inicio-encuesta');
        const calendarTitle = document.getElementById('inicio-calendar-title');
        const calendarDays = document.getElementById('inicio-calendar-days');
        const prevMonthBtn = document.getElementById('inicio-prev-month');
        const nextMonthBtn = document.getElementById('inicio-next-month');
        const hourValue = document.getElementById('inicio-hour-value');
        const minValue = document.getElementById('inicio-min-value');
        const hourUpBtn = document.getElementById('inicio-hour-up');
        const hourDownBtn = document.getElementById('inicio-hour-down');
        const minUpBtn = document.getElementById('inicio-min-up');
        const minDownBtn = document.getElementById('inicio-min-down');
        const amBtn = document.getElementById('inicio-am-btn');
        const pmBtn = document.getElementById('inicio-pm-btn');
        
        // Estado inicial: fecha y hora actual
        const now = new Date();
        let currentDate = new Date(now);
        let selectedDate = new Date(now);
        let hour = now.getHours();
        let min = now.getMinutes() - (now.getMinutes() % 5); // Redondear a intervalos de 5 min
        let ampm = hour >= 12 ? 'PM' : 'AM';
        let hour12 = hour % 12; if (hour12 === 0) hour12 = 12;
        
        // Nombres de meses
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        
        // Establecer valores iniciales
        hourValue.textContent = pad(hour12);
        minValue.textContent = pad(min);
        if (ampm === 'PM') {
            amBtn.classList.remove('active');
            pmBtn.classList.add('active');
        } else {
            amBtn.classList.add('active');
            pmBtn.classList.remove('active');
        }
        
        // Actualizar valores ocultos
        function updateInputValues() {
            // Calcular hora 24h
            let h = hour12;
            if (ampm === 'PM' && h !== 12) h += 12;
            if (ampm === 'AM' && h === 12) h = 0;
            
            inputFecha.value = formatoFecha(selectedDate);
            inputHora.value = `${pad(h)}:${pad(min)}`;
        }
        
        // Inicializar los inputs con los valores predeterminados
        updateInputValues();
        
        // Generar título del calendario
        function updateCalendarTitle() {
            calendarTitle.textContent = `${meses[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        }
        
        // Generar días del calendario
        function generateCalendarDays() {
            calendarDays.innerHTML = '';
            
            // Primer día del mes actual
            const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            // Último día del mes
            const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            // Día de la semana del primer día (0 = domingo, 6 = sábado)
            const firstDayOfWeek = firstDay.getDay();
            
            // Añadir días del mes anterior para completar la primera semana
            const prevMonthLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
            for (let i = 0; i < firstDayOfWeek; i++) {
                const dayElement = document.createElement('div');
                dayElement.classList.add('calendar-day', 'other-month');
                dayElement.textContent = prevMonthLastDay - firstDayOfWeek + i + 1;
                calendarDays.appendChild(dayElement);
            }
            
            // Añadir días del mes actual
            const today = new Date();
            for (let i = 1; i <= lastDay.getDate(); i++) {
                const dayElement = document.createElement('div');
                dayElement.classList.add('calendar-day');
                dayElement.textContent = i;
                
                // Marcar día actual
                if (currentDate.getFullYear() === today.getFullYear() && 
                    currentDate.getMonth() === today.getMonth() && 
                    i === today.getDate()) {
                    dayElement.classList.add('today');
                }
                
                // Marcar día seleccionado
                if (currentDate.getFullYear() === selectedDate.getFullYear() && 
                    currentDate.getMonth() === selectedDate.getMonth() && 
                    i === selectedDate.getDate()) {
                    dayElement.classList.add('selected');
                }
                
                // Evento al hacer click en un día
                dayElement.addEventListener('click', function() {
                    // Eliminar clase 'selected' del día anteriormente seleccionado
                    const prevSelected = calendarDays.querySelector('.calendar-day.selected');
                    if (prevSelected) {
                        prevSelected.classList.remove('selected');
                    }
                    
                    // Marcar este día como seleccionado
                    dayElement.classList.add('selected');
                    
                    // Actualizar fecha seleccionada
                    selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
                    
                    // Actualizar valores de los inputs
                    updateInputValues();
                });
                
                calendarDays.appendChild(dayElement);
            }
            
            // Añadir días del mes siguiente para completar la última semana
            const totalCells = 42; // 6 filas * 7 columnas
            const cellsToAdd = totalCells - (firstDayOfWeek + lastDay.getDate());
            for (let i = 1; i <= cellsToAdd; i++) {
                const dayElement = document.createElement('div');
                dayElement.classList.add('calendar-day', 'other-month');
                dayElement.textContent = i;
                calendarDays.appendChild(dayElement);
            }
        }
        
        // Iniciar el calendario
        updateCalendarTitle();
        generateCalendarDays();
        
        // Eventos de navegación entre meses
        prevMonthBtn.addEventListener('click', function() {
            currentDate.setMonth(currentDate.getMonth() - 1);
            updateCalendarTitle();
            generateCalendarDays();
        });
        
        nextMonthBtn.addEventListener('click', function() {
            currentDate.setMonth(currentDate.getMonth() + 1);
            updateCalendarTitle();
            generateCalendarDays();
        });
        
        // Control de hora
        hourUpBtn.addEventListener('click', function() {
            hour12 = hour12 === 12 ? 1 : hour12 + 1;
            hourValue.textContent = pad(hour12);
            updateInputValues();
        });
        
        hourDownBtn.addEventListener('click', function() {
            hour12 = hour12 === 1 ? 12 : hour12 - 1;
            hourValue.textContent = pad(hour12);
            updateInputValues();
        });
        
        // Control de minutos
        minUpBtn.addEventListener('click', function() {
            min = (min + 5) % 60;
            minValue.textContent = pad(min);
            updateInputValues();
        });
        
        minDownBtn.addEventListener('click', function() {
            min = (min - 5 + 60) % 60; // Suma 60 para evitar números negativos
            minValue.textContent = pad(min);
            updateInputValues();
        });
        
        // Control de AM/PM
        amBtn.addEventListener('click', function() {
            if (ampm !== 'AM') {
                ampm = 'AM';
                amBtn.classList.add('active');
                pmBtn.classList.remove('active');
                updateInputValues();
            }
        });
        
        pmBtn.addEventListener('click', function() {
            if (ampm !== 'PM') {
                ampm = 'PM';
                pmBtn.classList.add('active');
                amBtn.classList.remove('active');
                updateInputValues();
            }
        });
    })();

    // Pre-cargar fechas y horas para el periodo de fin (como antes)
    (function precargarFechasEncuestaFin() {
        const now = new Date();
        const pad = n => n.toString().padStart(2, '0');
        // Fecha y hora de fin (30 min después)
        const fin = new Date(now.getTime() + 30*60000);
        const fechaFin = `${fin.getFullYear()}-${pad(fin.getMonth()+1)}-${pad(fin.getDate())}`;
        const horaFin = `${pad(fin.getHours())}:${pad(fin.getMinutes())}`;
        const inputFechaFin = document.getElementById('fecha-fin-encuesta');
        const inputHoraFin = document.getElementById('hora-fin-encuesta');
        if (inputFechaFin && inputHoraFin) {
            inputFechaFin.value = fechaFin;
            inputHoraFin.value = horaFin;
        }
    })();

    // Crear modal para estadísticas
    if (!document.getElementById('modal-estadisticas-encuesta')) {
        const modalHTML = `
            <div id="modal-estadisticas-encuesta" class="modal-estadisticas">
                <div class="modal-contenido">
                    <span class="cerrar-modal">&times;</span>
                    <div id="contenido-estadisticas-encuesta">
                        <!-- Aquí se cargarán las estadísticas de la encuesta -->
                    </div>
                </div>
            </div>
        `;
        
        // Añadir modal al final del body
        const modalDiv = document.createElement('div');
        modalDiv.innerHTML = modalHTML;
        document.body.appendChild(modalDiv.firstElementChild);
        
        // Añadir eventos al modal
        document.querySelector('.cerrar-modal').addEventListener('click', function() {
            document.getElementById('modal-estadisticas-encuesta').style.display = 'none';
        });
        
        window.addEventListener('click', function(event) {
            if (event.target == document.getElementById('modal-estadisticas-encuesta')) {
                document.getElementById('modal-estadisticas-encuesta').style.display = 'none';
            }
        });
    }
    
    // Cargar estilos si no existen
    if (!document.querySelector('link[href*="../../../../css/admin/opciones_admin/alumnos/encuesta.css"]')) {
        const linkEstilos = document.createElement('link');
        linkEstilos.rel = 'stylesheet';
        linkEstilos.href = '../../../../css/admin/opciones_admin/alumnos/encuesta.css';
        document.head.appendChild(linkEstilos);
    }
    
    // Cargar estilos para horas de encuestas
    if (!document.querySelector('link[href*="../../../../css/admin/opciones_admin/alumnos/hora_encuesta.css"]')) {
        const linkHoraEstilos = document.createElement('link');
        linkHoraEstilos.rel = 'stylesheet';
        linkHoraEstilos.href = '../../../../css/admin/opciones_admin/alumnos/hora_encuesta.css';
        document.head.appendChild(linkHoraEstilos);
    }
    
    // Cargar el script
    const scriptEncuestas = document.createElement('script');
    scriptEncuestas.src = 'encuesta.js';
    scriptEncuestas.onload = function() {
        // Inicializar el gestor de encuestas si está disponible
        if (typeof inicializarGestorEncuestas === 'function') {
            inicializarGestorEncuestas();
        }
    };
    document.head.appendChild(scriptEncuestas);
}

// Exponer la función para que sea accesible desde el HTML
window.verDetalles = verDetalles;

// Inicializar cuando el DOM está listo
document.addEventListener('DOMContentLoaded', inicializarGestorAlumnos);
