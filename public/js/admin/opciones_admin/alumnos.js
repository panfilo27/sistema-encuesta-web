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
                    
                    <div class="periodos-container">
                        <div class="periodo-seccion">
                            <h4>Periodo de Inicio</h4>
                            <div class="fecha-hora-container">
                                <input type="text" id="datetime-inicio" class="flatpickr-input" placeholder="Seleccionar fecha y hora de inicio" readonly>
                                <input type="hidden" id="fecha-inicio-encuesta" name="fecha-inicio-encuesta" required>
                                <input type="hidden" id="hora-inicio-encuesta" name="hora-inicio-encuesta" required>
                            </div>
                        </div>
                        
                        <div class="periodo-seccion">
                            <h4>Periodo de Fin</h4>
                            <div class="fecha-hora-container">
                                <input type="text" id="datetime-fin" class="flatpickr-input" placeholder="Seleccionar fecha y hora de fin" readonly>
                                <input type="hidden" id="fecha-fin-encuesta" name="fecha-fin-encuesta" required>
                                <input type="hidden" id="hora-fin-encuesta" name="hora-fin-encuesta" required>
                            </div>
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
    
    // Importar CSS personalizado para los selectores de fecha/hora
    if (!document.querySelector('link[href*="datetime-custom.css"]')) {
        const customCSS = document.createElement('link');
        customCSS.rel = 'stylesheet';
        customCSS.href = '../../../../css/admin/opciones_admin/alumnos/datetime-custom.css';
        document.head.appendChild(customCSS);
    }
    
    // Importar Flatpickr CSS y JS si no está cargado
    if (!document.querySelector('link[href*="flatpickr.min.css"]')) {
        const flatpickrCSS = document.createElement('link');
        flatpickrCSS.rel = 'stylesheet';
        flatpickrCSS.href = 'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css';
        document.head.appendChild(flatpickrCSS);
        
        // Añadir tema azul para un aspecto más moderno
        const flatpickrTheme = document.createElement('link');
        flatpickrTheme.rel = 'stylesheet';
        flatpickrTheme.href = 'https://cdn.jsdelivr.net/npm/flatpickr/dist/themes/material_blue.css';
        document.head.appendChild(flatpickrTheme);
    }
    
    // Cargar el script de Flatpickr si no está cargado
    if (!window.flatpickr && !document.querySelector('script[src*="flatpickr.min.js"]')) {
        const flatpickrScript = document.createElement('script');
        flatpickrScript.src = 'https://cdn.jsdelivr.net/npm/flatpickr';
        flatpickrScript.onload = function() {
            // Configurar Flatpickr en español
            if (window.flatpickr && !window.flatpickr.l10ns.es) {
                const spanishScript = document.createElement('script');
                spanishScript.src = 'https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/es.js';
                spanishScript.onload = initializeDateTimePickers;
                document.head.appendChild(spanishScript);
            } else {
                initializeDateTimePickers();
            }
        };
        document.head.appendChild(flatpickrScript);
    } else if (window.flatpickr) {
        initializeDateTimePickers();
    }

    // Función para inicializar los selectores de fecha/hora
    function initializeDateTimePickers() {
        if (!window.flatpickr) return;
        
        // Función para dar formato a fecha y hora para los inputs ocultos
        const formatoFechaHora = (dateObj) => {
            if (!dateObj) return { fecha: '', hora: '' };
            
            const pad = n => n.toString().padStart(2, '0');
            const fecha = `${dateObj.getFullYear()}-${pad(dateObj.getMonth()+1)}-${pad(dateObj.getDate())}`;
            const hora = `${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;
            
            return { fecha, hora };
        };
        
        // Obtener la fecha actual y 30 minutos después
        const now = new Date();
        const nowPlus30 = new Date(now.getTime() + 30 * 60000);
        
        // Configuración para el selector de inicio
        const datetimeInicio = document.getElementById('datetime-inicio');
        const inputFechaInicio = document.getElementById('fecha-inicio-encuesta');
        const inputHoraInicio = document.getElementById('hora-inicio-encuesta');
        
        if (datetimeInicio) {
            const fpInicio = flatpickr(datetimeInicio, {
                enableTime: true,
                dateFormat: "d M Y, H:i",
                time_24hr: false, // Usar formato 12h con AM/PM
                minuteIncrement: 5,
                defaultDate: now,
                locale: 'es',
                allowInput: false,
                disableMobile: true, // Usar siempre nuestro datepicker personalizado
                position: "auto",
                static: true,
                onClose: function(selectedDates, dateStr, instance) {
                    if (selectedDates.length > 0) {
                        const { fecha, hora } = formatoFechaHora(selectedDates[0]);
                        inputFechaInicio.value = fecha;
                        inputHoraInicio.value = hora;
                    }
                },
                onChange: function(selectedDates, dateStr) {
                    if (selectedDates.length > 0) {
                        const { fecha, hora } = formatoFechaHora(selectedDates[0]);
                        inputFechaInicio.value = fecha;
                        inputHoraInicio.value = hora;
                    }
                }
            });
            
            // Establecer valores iniciales
            const { fecha, hora } = formatoFechaHora(now);
            inputFechaInicio.value = fecha;
            inputHoraInicio.value = hora;
        }
        
        // Configuración para el selector de fin
        const datetimeFin = document.getElementById('datetime-fin');
        const inputFechaFin = document.getElementById('fecha-fin-encuesta');
        const inputHoraFin = document.getElementById('hora-fin-encuesta');
        
        if (datetimeFin) {
            const fpFin = flatpickr(datetimeFin, {
                enableTime: true,
                dateFormat: "d M Y, H:i",
                time_24hr: false, // Usar formato 12h con AM/PM
                minuteIncrement: 5,
                defaultDate: nowPlus30, // 30 minutos después del inicio
                locale: 'es',
                allowInput: false,
                disableMobile: true,
                position: "auto",
                static: true,
                onClose: function(selectedDates, dateStr, instance) {
                    if (selectedDates.length > 0) {
                        const { fecha, hora } = formatoFechaHora(selectedDates[0]);
                        inputFechaFin.value = fecha;
                        inputHoraFin.value = hora;
                    }
                },
                onChange: function(selectedDates, dateStr) {
                    if (selectedDates.length > 0) {
                        const { fecha, hora } = formatoFechaHora(selectedDates[0]);
                        inputFechaFin.value = fecha;
                        inputHoraFin.value = hora;
                    }
                }
            });
            
            // Establecer valores iniciales
            const { fecha, hora } = formatoFechaHora(nowPlus30);
            inputFechaFin.value = fecha;
            inputHoraFin.value = hora;
        }
    }
    
    // Intentar inicializar si flatpickr ya está disponible
    if (window.flatpickr) {
        initializeDateTimePickers();
    }

    // La pre-carga de valores para el periodo de fin ahora se maneja dentro de initializeDateTimePickers()

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
