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
    scriptUsuario.src = './models/Usuario.js';
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

// Usamos la variable departamentoInfo del ámbito global (definida en pagina_jefes.js)

// Función para inicializar la gestión de alumnos
function inicializarGestorAlumnos(infoDeptoJefe) {
    // Si ya está inicializado, no hacer nada
    if (window.gestorAlumnosInicializado) return;
    
    // Guardar la información del departamento
    if (infoDeptoJefe) {
        departamentoInfo = infoDeptoJefe;
        console.log('Información de departamento recibida:', departamentoInfo);
    }
    
    // Verificar si el modelo Usuario está disponible
    if (!modeloCargado && !verificarModeloUsuario()) {
        // Si no está disponible y se está cargando, salir
        // La inicialización se retomará cuando el script termine de cargar
        return;
    }
    
    window.gestorAlumnosInicializado = true;
    console.log('Inicializando gestor de alumnos para jefe de departamento...');
    
    // Verificar autenticación
    verificarAutenticacion();
    
    // Configurar eventos
    configurarEventos();
    
    // Cargar datos (solo las carreras del departamento del jefe)
    cargarCarreras();
    cargarAlumnos();
    
    // Cargar contenido de encuestas
    cargarContenidoEncuestas();
}

/**
 * Verifica que el usuario esté autenticado y tenga rol de jefe de departamento
 */
function verificarAutenticacion() {
    console.log('DEPURACIÓN COMPLETA - Iniciando verificación de autenticación en alumnos.js');
    
    // Habilitar modo de acceso directo para pruebas (descomentar para pruebas)
    // Comentar esta sección cuando no estés probando
    const MODO_PRUEBA = true;
    if (MODO_PRUEBA) {
        console.log('DEPURACIÓN COMPLETA - Ejecutando en modo de prueba, saltando verificación');
        return; // Saltar toda la verificación
    }
    
    // Verificamos la autenticación usando localStorage (igual que en pagina_jefes.js)
    const userSession = localStorage.getItem('userSession');
    console.log('DEPURACIÓN COMPLETA - Contenido de userSession:', userSession);
    
    if (!userSession) {
        console.log('DEPURACIÓN COMPLETA - No hay sesión de usuario en localStorage');
        alert('No se encontró sesión de usuario. Por favor inicie sesión.');
        // Comentar temporalmente para depuración
        //window.location.href = '/public/auth/login.html';
        return;
    }
    
    try {
        const userData = JSON.parse(userSession);
        
        // Mostrar todos los datos de la sesión para depurar
        console.log('DEPURACIÓN COMPLETA - Datos completos de usuario:', JSON.stringify(userData, null, 2));
        console.log('DEPURACIÓN COMPLETA - Rol detectado:', userData.rolUser);
        
        // Intentar leer el rol de diferentes formas posibles
        const posiblesRoles = [
            userData.rolUser,
            userData.rol,
            userData.role,
            userData.userRole,
            userData.tipo,
            userData.type
        ];
        
        console.log('DEPURACIÓN COMPLETA - Posibles roles detectados:', posiblesRoles.filter(Boolean));
        
        // Verificar si el usuario es jefedepartamento o admin (aceptamos ambos para pruebas)
        const rolValido = posiblesRoles.some(rol => 
            rol === 'jefedepartamento' || rol === 'admin' || rol === 'jefe_departamento');
        
        if (!rolValido) {
            console.log('DEPURACIÓN COMPLETA - No se encontró un rol válido');           
            alert('No tienes permisos para acceder a esta página. Se requiere rol: jefedepartamento');
            // Comentar temporalmente para depuración
            //window.location.href = '/public/auth/login.html';
            return;
        }
        
        console.log('DEPURACIÓN COMPLETA - Verificación de autenticación exitosa');
    } catch (error) {
        console.error('DEPURACIÓN COMPLETA - Error al procesar la sesión del usuario:', error);
        console.error('DEPURACIÓN COMPLETA - Contenido exacto de userSession:', userSession);
        alert('Error al procesar la sesión: ' + error.message);
        // Comentar temporalmente para depuración
        //localStorage.removeItem('userSession'); // Limpiar sesión corrupta
        //window.location.href = '/public/auth/login.html';
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
 * Carga la lista de carreras desde Firestore, filtrando solo las del departamento del jefe
 * Usando el ID del usuario en localStorage para obtener su departamento directamente
 */
async function cargarCarreras() {
    try {
        console.log('DEPURACIÓN - Iniciando carga de carreras desde Firestore');
        
        // 1. Obtener el ID del usuario desde localStorage
        const userSession = localStorage.getItem('userSession');
        if (!userSession) {
            throw new Error('No hay sesión de usuario en localStorage');
        }
        
        const userData = JSON.parse(userSession);
        if (!userData.id) {
            throw new Error('No se encontró ID de usuario en localStorage');
        }
        
        const userId = userData.id;
        console.log('DEPURACIÓN - ID del usuario en localStorage:', userId);
        
        // Verificar si ya tenemos información de departamento
        if (departamentoInfo && departamentoInfo.carrerasIds && departamentoInfo.carrerasIds.length > 0) {
            console.log('DEPURACIÓN - Usando información de departamento ya cargada:', departamentoInfo.nombreDepartamento);
            
            // Crear un array con las referencias a las carreras
            todasLasCarreras = departamentoInfo.carreras || [];
        } else {
            // 2. Cargar el usuario directamente de Firestore para obtener su departamento
            console.log('DEPURACIÓN - Cargando información del usuario desde Firestore');
            const userDoc = await firebase.firestore().collection('usuario').doc(userId).get();
            
            if (!userDoc.exists) {
                throw new Error('No se encontró el usuario en Firestore');
            }
            
            const userDataFirestore = userDoc.data();
            console.log('DEPURACIÓN - Datos del usuario en Firestore:', userDataFirestore);
            
            // 3. Cargar el departamento/carreras asociadas a este usuario
            let carrerasDelJefe = [];
            let departamentoId = userDataFirestore.departamentoId;
            let departamentoNombre = userDataFirestore.departamentoNombre || 'Departamento';
            
            // CORRECCIÓN: Usar directamente el ID del documento como jefeDepartamentoId
            console.log('DEPURACIÓN - Buscando carreras donde el usuario es jefe usando ID:', userId);
            const carrerasComoJefe = await firebase.firestore().collection('carreras')
                .where('jefeDepartamentoId', '==', userId)
                .get();
            
            if (!carrerasComoJefe.empty) {
                console.log(`DEPURACIÓN - Se encontraron ${carrerasComoJefe.size} carreras donde el usuario es jefe`);
                carrerasComoJefe.forEach(doc => {
                    carrerasDelJefe.push({
                        id: doc.id,
                        nombre: doc.data().nombre || 'Sin nombre',
                        ...doc.data()
                    });
                    
                    // Actualizar el nombre del departamento si no lo teníamos
                    if (departamentoNombre === 'Departamento' && doc.data().departamento) {
                        departamentoNombre = doc.data().departamento;
                    }
                });
            }
            // 3.2 Si no encontramos carreras como jefe, buscar por departamentoId
            else if (departamentoId) {
                console.log('DEPURACIÓN - Buscando carreras por departamentoId:', departamentoId);
                const carrerasPorDepartamento = await firebase.firestore().collection('carreras')
                    .where('departamentoId', '==', departamentoId)
                    .get();
                console.log('DEPURACIÓN - Carreras por departamentoId:', carrerasPorDepartamento.docs);
                if (!carrerasPorDepartamento.empty) {
                    console.log(`DEPURACIÓN - Se encontraron ${carrerasPorDepartamento.size} carreras por departamentoId`);
                    carrerasPorDepartamento.forEach(doc => {
                        carrerasDelJefe.push({
                            id: doc.id,
                            nombre: doc.data().nombre || 'Sin nombre',
                            ...doc.data()
                        });
                    });
                }
            }
            // 3.3 Como último recurso, si el usuario tiene una carrera asignada, usarla
            else if (userDataFirestore.carreraId) {
                console.log('DEPURACIÓN - Usando la carrera del usuario:', userDataFirestore.carreraId);
                const carreraDoc = await firebase.firestore().collection('carreras')
                    .doc(userDataFirestore.carreraId)
                    .get();
                
                if (carreraDoc.exists) {
                    carrerasDelJefe.push({
                        id: carreraDoc.id,
                        nombre: carreraDoc.data().nombre || 'Sin nombre',
                        ...carreraDoc.data()
                    });
                }
            }
            
            // 3.4 Si todavía no encontramos nada, cargar todas las carreras
            if (carrerasDelJefe.length === 0) {
                console.warn('DEPURACIÓN - No se encontraron carreras específicas, cargando todas');
                const todasCarreras = await firebase.firestore().collection('carreras').get();
                
                todasCarreras.forEach(doc => {
                    carrerasDelJefe.push({
                        id: doc.id,
                        nombre: doc.data().nombre || 'Sin nombre',
                        ...doc.data()
                    });
                });
            }
            
            // 4. Actualizar la información del departamento
            departamentoInfo = {
                jefeDepartamentoId: userId,
                nombreDepartamento: departamentoNombre,
                carreras: carrerasDelJefe.map(c => ({
                    id: c.id,
                    nombre: c.nombre || 'Sin nombre'
                })),
                carrerasIds: carrerasDelJefe.map(c => c.id),
                usuario: {
                    id: userId,
                    nombre: userDataFirestore.nombre || userData.nombre || '',
                    apellidoPaterno: userDataFirestore.apellidoPaterno || userData.apellidoPaterno || '',
                    apellidoMaterno: userDataFirestore.apellidoMaterno || userData.apellidoMaterno || '',
                    email: userDataFirestore.email || userData.email || ''
                }
            };
            
            console.log('DEPURACIÓN - Información del departamento actualizada:', departamentoInfo);
            
            // Actualizar carreras
            todasLasCarreras = departamentoInfo.carreras;
        }
        
        // Ordenar alfabéticamente
        todasLasCarreras.sort((a, b) => a.nombre.localeCompare(b.nombre));
        console.log('DEPURACIÓN - Carreras disponibles:', todasLasCarreras);
        
        // Llenar el select de filtro
        const options = todasLasCarreras.map(carrera => {
            return `<option value="${carrera.id}">${carrera.nombre}</option>`;
        }).join('');
        
        const filtroCarrera = document.getElementById('filtro-carrera');
        if (filtroCarrera) {
            if (todasLasCarreras.length > 1) {
                // Si hay más de una carrera, mostrar la opción de "Todas las carreras"
                filtroCarrera.innerHTML = '<option value="">Todas las carreras del departamento</option>' + options;
            } else {
                // Si solo hay una carrera, solo mostrar esa
                filtroCarrera.innerHTML = options;
            }
        }
        
    } catch (error) {
        console.error('Error al cargar carreras:', error);
        alert('Error al cargar carreras. Por favor, recarga la página.');
    }
}

/**
 * Carga los alumnos desde Firestore, filtrando solo los que pertenecen a las carreras del departamento
 */
async function cargarAlumnos() {
    try {
        const tablaAlumnos = document.getElementById('tabla-alumnos');
        if (!tablaAlumnos) return;
        
        tablaAlumnos.innerHTML = '<p class="cargando">Cargando alumnos...</p>';
        
        console.log('DEPURACIÓN - Iniciando carga de alumnos');
        
        // Obtener alumnos con rol 'alumno'
        const snapshot = await firebase.firestore()
            .collection('usuario')
            .where('rolUser', '==', 'alumno')
            .get();
        
        if (snapshot.empty) {
            tablaAlumnos.innerHTML = '<p class="sin-resultados">No hay alumnos registrados en el sistema.</p>';
            return;
        }
        
        // Verificar si tenemos información del departamento para filtrar
        let alumnosSnapshot = [];
        
        if (departamentoInfo && departamentoInfo.carreras && departamentoInfo.carreras.length > 0) {
            // Si tenemos información del departamento, filtrar por carreras
            const carrerasNombres = departamentoInfo.carreras.map(c => c.nombre.toLowerCase());
            console.log('DEPURACIÓN - Filtrando alumnos por nombres de carreras:', carrerasNombres);
            
            // Filtrar alumnos que pertenecen a las carreras del departamento (usando el campo 'carrera')
            console.log('DEPURACIÓN ESTRICTA - Filtrando SOLO alumnos del departamento:', departamentoInfo.nombreDepartamento);
            console.log('DEPURACIÓN ESTRICTA - Carreras a incluir:', departamentoInfo.carreras);
            
            alumnosSnapshot = snapshot.docs.filter(doc => {
                const data = doc.data();
                let incluir = false;
                
                // Verificar si el alumno tiene un nombre de carrera que coincide con alguna del departamento
                if (data.carrera) {
                    const carreraAlumno = data.carrera.toLowerCase();
                    
                    // Comprobar específicamente para Mecatrónica vs Sistemas
                    if (carreraAlumno.includes('mecatrónica')) {
                        incluir = carrerasNombres.some(c => c.includes('mecatrónica'));
                    }
                    else if (carreraAlumno.includes('sistemas computacionales')) {
                        incluir = carrerasNombres.some(c => c.includes('sistemas computacionales'));
                    }
                    else {
                        // Para otras carreras, comprobar coincidencia exacta o muy cercana
                        incluir = carrerasNombres.some(nombreCarrera => {
                            // Comparación más estricta: debe ser una coincidencia muy cercana
                            return carreraAlumno === nombreCarrera || 
                                   // O una carrera debe contener completamente a la otra
                                   (carreraAlumno.includes(nombreCarrera) && nombreCarrera.length > 5) || 
                                   (nombreCarrera.includes(carreraAlumno) && carreraAlumno.length > 5);
                        });
                    }
                    
                    if (incluir) {
                        console.log(`DEPURACIÓN ESTRICTA - INCLUIDO: Alumno ${data.nombre} con carrera ${data.carrera}`);
                    } else {
                        console.log(`DEPURACIÓN ESTRICTA - EXCLUIDO: Alumno ${data.nombre} con carrera ${data.carrera}`);
                    }
                }
                // Como respaldo, intentar por carreraId
                else if (data.carreraId && departamentoInfo.carrerasIds.includes(data.carreraId)) {
                    incluir = true;
                    console.log(`DEPURACIÓN ESTRICTA - INCLUIDO por ID: Alumno ${data.nombre} con carreraId ${data.carreraId}`);
                }
                
                return incluir;
            });
            
            if (alumnosSnapshot.length === 0) {
                console.log('DEPURACIÓN - No se encontraron alumnos para las carreras filtradas, mostrando todos');
                alumnosSnapshot = snapshot.docs; // Mostrar todos si el filtro no da resultados
            }
        } else {
            // Si no hay información del departamento, mostrar todos los alumnos
            console.log('DEPURACIÓN - No hay información de departamento, mostrando todos los alumnos');
            alumnosSnapshot = snapshot.docs;
        }
        
        console.log('DEPURACIÓN - Total de alumnos encontrados:', alumnosSnapshot.length);
        
        // Convertir documentos a instancias de Usuario
        todosLosAlumnos = await Promise.all(alumnosSnapshot.map(async doc => {
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
            tablaAlumnos.innerHTML = `<p class="sin-resultados">Error al cargar alumnos: ${error.message}. Por favor, recarga la página.</p>`;
        }
    }
}

/**
 * Filtra los alumnos según los criterios de búsqueda y filtros
 * (Se ha eliminado el filtro por carrera)
 */
function filtrarAlumnos() {
    const busqueda = document.getElementById('busqueda');
    const filtroVerificado = document.getElementById('filtro-verificado');
    
    if (!busqueda || !filtroVerificado) return;
    
    const textoBusqueda = busqueda.value.toLowerCase().trim();
    const estadoVerificacion = filtroVerificado.value;
    
    alumnosFiltrados = todosLosAlumnos.filter(alumno => {
        // Filtrar por texto de búsqueda
        const cumpleBusqueda = textoBusqueda === '' || 
            alumno.getNombreCompleto().toLowerCase().includes(textoBusqueda) ||
            alumno.usuario.toLowerCase().includes(textoBusqueda) ||
            (alumno.nombreCarrera && alumno.nombreCarrera.toLowerCase().includes(textoBusqueda));
        
        // Filtrar por estado de verificación
        const cumpleVerificacion = estadoVerificacion === '' || 
            alumno.emailVerificado.toString() === estadoVerificacion;
        
        return cumpleBusqueda && cumpleVerificacion;
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
            scriptHistorial.src = '/public/js/jefes/opciones_jefes/alumnos/historial.js';
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
                    
                    <div class="form-group">
                        <label for="fecha-inicio-encuesta">Fecha de Inicio:</label>
                        <input type="date" id="fecha-inicio-encuesta" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="fecha-fin-encuesta">Fecha de Fin:</label>
                        <input type="date" id="fecha-fin-encuesta" required>
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
    
    // Cargar los estilos
    if (!document.querySelector('link[href*="encuesta.css"]')) {
        const linkEstilos = document.createElement('link');
        linkEstilos.rel = 'stylesheet';
        linkEstilos.href = '/public/css/admin/opciones_admin/alumnos/encuesta.css';
        document.head.appendChild(linkEstilos);
    }
    
    // Cargar el script (usar la versión para jefes de departamento)
    const scriptEncuestas = document.createElement('script');
    scriptEncuestas.src = '/public/js/jefes/opciones_jefes/alumnos/encuesta.js';
    console.log('DEPURACIÓN - Cargando script de encuestas para jefes:', scriptEncuestas.src);
    scriptEncuestas.onload = function() {
        console.log('DEPURACIÓN - Script de encuestas cargado correctamente');
        // Inicializar el gestor de encuestas si está disponible
        if (typeof inicializarGestorEncuestas === 'function') {
            inicializarGestorEncuestas();
        } else {
            console.error('DEPURACIÓN - La función inicializarGestorEncuestas no está disponible');
        }
    };
    scriptEncuestas.onerror = function(error) {
        console.error('DEPURACIÓN - Error al cargar el script de encuestas:', error);
    };
    document.head.appendChild(scriptEncuestas);
}

// Exponer la función para que sea accesible desde el HTML
window.verDetalles = verDetalles;

// Inicializar cuando el DOM está listo
document.addEventListener('DOMContentLoaded', inicializarGestorAlumnos);
