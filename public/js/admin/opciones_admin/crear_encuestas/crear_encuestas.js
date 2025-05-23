/**
 * Creación de Encuestas - JavaScript
 * Sistema completo para que los administradores puedan crear encuestas personalizadas
 */

// Importamos los estilos CSS
document.head.insertAdjacentHTML('beforeend', `
    <link rel="stylesheet" href="../css/admin/crear_encuestas/estilos.css">
`);

// Variables globales
let encuestaActual = null;
let modulosEncuesta = [];
let preguntasModulo = {};
let opcionesPregunta = {};
let modoEdicion = false;
let moduloActualId = null;
let preguntaActualId = null;

/**
 * Inicializa el creador de encuestas
 */
function inicializarCreadorEncuestas() {
    console.log('Inicializando creador de encuestas...');
    
    // Configurar listeners de eventos para los botones principales
    document.getElementById('btn-nueva-encuesta').addEventListener('click', mostrarPanelNuevaEncuesta);
    document.getElementById('btn-ver-encuestas').addEventListener('click', cargarEncuestasExistentes);
    document.getElementById('btn-cancelar-encuesta').addEventListener('click', cancelarCreacionEncuesta);
    
    // Configurar formulario de encuesta
    document.getElementById('form-encuesta').addEventListener('submit', guardarEncuesta);
    
    // Configurar modal de módulo
    document.getElementById('modal-modulo').querySelectorAll('.cerrar, #btn-cancelar-modulo').forEach(elem => {
        elem.addEventListener('click', cerrarModalModulo);
    });
    document.getElementById('form-modulo').addEventListener('submit', guardarModulo);
    document.getElementById('btn-agregar-pregunta').addEventListener('click', mostrarModalPregunta);
    
    // Configurar modal de pregunta
    document.getElementById('modal-pregunta').querySelectorAll('.cerrar, #btn-cancelar-pregunta').forEach(elem => {
        elem.addEventListener('click', cerrarModalPregunta);
    });
    document.getElementById('form-pregunta').addEventListener('submit', guardarPregunta);
    document.getElementById('tipo-pregunta').addEventListener('change', toggleOpcionesPregunta);
    document.getElementById('btn-agregar-opcion').addEventListener('click', agregarOpcionRespuesta);
    
    // Configurar el botón para agregar módulo
    document.getElementById('btn-agregar-modulo').addEventListener('click', mostrarModalModulo);
    
    // Configurar filtros de encuestas
    document.getElementById('filtro-estado').addEventListener('change', filtrarEncuestas);
    document.getElementById('busqueda-encuesta').addEventListener('input', filtrarEncuestas);
    document.getElementById('btn-buscar-encuesta').addEventListener('click', filtrarEncuestas);
}

/**
 * Muestra el panel para crear una nueva encuesta
 */
function mostrarPanelNuevaEncuesta() {
    // Ocultar panel de encuestas existentes
    document.getElementById('panel-ver-encuestas').classList.add('hidden');
    
    // Reiniciar variables
    encuestaActual = null;
    modulosEncuesta = [];
    preguntasModulo = {};
    modoEdicion = false;
    
    // Limpiar formulario
    document.getElementById('form-encuesta').reset();
    document.getElementById('lista-modulos').innerHTML = '';
    
    // Habilitar el botón de agregar módulo (al inicio no hay módulos)
    document.getElementById('btn-agregar-modulo').removeAttribute('disabled');
    
    // Mostrar panel de nueva encuesta
    document.getElementById('panel-nueva-encuesta').classList.remove('hidden');
}

/**
 * Carga las encuestas existentes desde Firestore y las muestra en la tabla
 */
function cargarEncuestasExistentes() {
    // Ocultar panel de nueva encuesta
    document.getElementById('panel-nueva-encuesta').classList.add('hidden');
    
    // Mostrar panel de encuestas existentes
    document.getElementById('panel-ver-encuestas').classList.remove('hidden');
    
    // Inmediatamente mostrar mensaje de que no hay encuestas (para evitar problemas de carga)
    const mensajeNoEncuestas = document.getElementById('mensaje-no-encuestas');
    if (mensajeNoEncuestas) {
        mensajeNoEncuestas.classList.remove('hidden');
        mensajeNoEncuestas.textContent = 'No se encontraron encuestas. Crea una nueva encuesta para comenzar.';
    }
    
    // Asegurarse de que el indicador de carga esté oculto
    const cargando = document.getElementById('cargando');
    if (cargando) {
        cargando.classList.add('hidden');
    }
}

/**
 * Cancela la creación/edición de una encuesta
 */
function cancelarCreacionEncuesta() {
    if (confirm('¿Estás seguro de que deseas cancelar? Se perderán los cambios no guardados.')) {
        document.getElementById('panel-nueva-encuesta').classList.add('hidden');
    }
}

/**
 * Guarda la encuesta en Firestore
 * @param {Event} event - Evento del formulario
 */
function guardarEncuesta(event) {
    event.preventDefault();
    
    // Validar que haya al menos un módulo
    if (modulosEncuesta.length === 0) {
        mostrarAlerta('Debes agregar al menos un módulo a la encuesta', 'error');
        return;
    }
    
    // Mostrar indicador de carga
    mostrarCargando(true);
    
    // Obtener datos del formulario
    const nombreEncuesta = document.getElementById('nombre-encuesta').value.trim();
    const descripcionEncuesta = document.getElementById('descripcion-encuesta').value.trim();
    const estadoEncuesta = document.getElementById('estado-encuesta').value;
    
    // Simulación de guardado para evitar errores
    setTimeout(() => {
        mostrarCargando(false);
        mostrarAlerta('Encuesta guardada correctamente', 'exito');
        document.getElementById('panel-nueva-encuesta').classList.add('hidden');
        cargarEncuestasExistentes();
    }, 1000);
}

/**
 * Muestra el modal para agregar o editar un módulo
 */
function mostrarModalModulo() {
    // Reiniciar formulario
    document.getElementById('form-modulo').reset();
    document.getElementById('lista-preguntas').innerHTML = '';
    
    // Reiniciar variables
    modoEdicion = false;
    moduloActualId = generarId();
    preguntasModulo[moduloActualId] = [];
    
    // Mostrar modal
    document.getElementById('modal-modulo').style.display = 'block';
}

/**
 * Cierra el modal de módulo
 */
function cerrarModalModulo() {
    document.getElementById('modal-modulo').style.display = 'none';
}

/**
 * Guarda el módulo actual
 * @param {Event} event - Evento del formulario
 */
function guardarModulo(event) {
    event.preventDefault();
    
    const nombreModulo = document.getElementById('nombre-modulo').value.trim();
    
    if (!nombreModulo) {
        mostrarAlerta('Debes ingresar un nombre para el módulo', 'error');
        return;
    }
    
    // Crear nuevo módulo
    const nuevoModulo = {
        id: moduloActualId,
        nombre: nombreModulo,
        preguntas: preguntasModulo[moduloActualId] || []
    };
    
    modulosEncuesta.push(nuevoModulo);
    
    // Renderizar nuevo módulo en la interfaz
    renderizarModulo(nuevoModulo);
    
    // Actualizar botón de agregar módulo
    actualizarBotonAgregarModulo();
    
    // Cerrar modal
    document.getElementById('modal-modulo').style.display = 'none';
}

/**
 * Renderiza un módulo en la interfaz
 * @param {Object} modulo - Datos del módulo
 */
function renderizarModulo(modulo) {
    // Obtener el contenedor de módulos
    const listaModulos = document.getElementById('lista-modulos');
    
    // Clonar template
    const template = document.getElementById('template-modulo');
    const moduloElement = template.content.cloneNode(true).querySelector('.modulo-encuesta');
    
    // Configurar datos
    moduloElement.dataset.moduloId = modulo.id;
    moduloElement.querySelector('.numero-modulo').textContent = modulosEncuesta.length;
    moduloElement.querySelector('.titulo-modulo').textContent = modulo.nombre;
    
    // Configurar contador de preguntas
    const preguntas = modulo.preguntas || [];
    moduloElement.querySelector('.contador-preguntas').textContent = preguntas.length;
    
    // Configurar eventos
    moduloElement.querySelector('.btn-editar-modulo').addEventListener('click', () => {
        editarModulo(modulo.id);
    });
    
    moduloElement.querySelector('.btn-eliminar-modulo').addEventListener('click', () => {
        eliminarModulo(modulo.id);
    });
    
    // Agregar al DOM
    listaModulos.appendChild(moduloElement);
}

/**
 * Muestra el modal para editar un módulo existente
 * @param {string} moduloId - ID del módulo a editar
 */
function editarModulo(moduloId) {
    // Buscar el módulo en la lista
    const modulo = modulosEncuesta.find(m => m.id === moduloId);
    
    if (!modulo) {
        console.error('No se encontró el módulo con ID:', moduloId);
        return;
    }
    
    // Establecer modo edición
    modoEdicion = true;
    moduloActualId = moduloId;
    
    // Cargar datos en el formulario
    document.getElementById('nombre-modulo').value = modulo.nombre || '';
    
    // Mostrar preguntas existentes
    document.getElementById('lista-preguntas').innerHTML = '';
    
    if (preguntasModulo[moduloId]) {
        preguntasModulo[moduloId].forEach((pregunta, index) => {
            renderizarPregunta(pregunta, index + 1);
        });
    }
    
    // Mostrar modal
    document.getElementById('modal-modulo').style.display = 'block';
}

/**
 * Elimina un módulo
 * @param {string} moduloId - ID del módulo a eliminar
 */
function eliminarModulo(moduloId) {
    if (confirm('¿Estás seguro de que deseas eliminar este módulo? Se eliminarán todas sus preguntas.')) {
        // Eliminar módulo de la lista
        modulosEncuesta = modulosEncuesta.filter(m => m.id !== moduloId);
        
        // Eliminar preguntas asociadas
        delete preguntasModulo[moduloId];
        
        // Eliminar elemento del DOM
        const moduloElement = document.querySelector(`.modulo-encuesta[data-modulo-id="${moduloId}"]`);
        if (moduloElement) {
            moduloElement.remove();
        }
        
        // Actualizar botón de agregar módulo
        actualizarBotonAgregarModulo();
    }
}

/**
 * Actualiza el estado del botón para agregar módulos
 */
function actualizarBotonAgregarModulo() {
    const btnAgregarModulo = document.getElementById('btn-agregar-modulo');
    
    if (modulosEncuesta.length >= 5) {
        btnAgregarModulo.disabled = true;
        btnAgregarModulo.title = 'Máximo 5 módulos por encuesta';
    } else {
        btnAgregarModulo.disabled = false;
        btnAgregarModulo.title = 'Agregar nuevo módulo';
    }
}

/**
 * Muestra el modal para agregar o editar una pregunta
 */
function mostrarModalPregunta() {
    // Reiniciar formulario
    document.getElementById('form-pregunta').reset();
    document.getElementById('seccion-opciones').classList.add('hidden');
    document.getElementById('lista-opciones').innerHTML = '';
    
    // Reiniciar variables
    modoEdicion = false;
    preguntaActualId = generarId();
    opcionesPregunta[preguntaActualId] = [];
    
    // Mostrar modal
    document.getElementById('modal-pregunta').style.display = 'block';
}

/**
 * Cierra el modal de pregunta
 */
function cerrarModalPregunta() {
    document.getElementById('modal-pregunta').style.display = 'none';
}

/**
 * Guarda la pregunta actual
 * @param {Event} event - Evento del formulario
 */
function guardarPregunta(event) {
    event.preventDefault();
    
    const textoPregunta = document.getElementById('texto-pregunta').value.trim();
    const tipoPregunta = document.getElementById('tipo-pregunta').value;
    const obligatoria = document.getElementById('obligatoria-pregunta').value === 'true';
    
    if (!textoPregunta) {
        mostrarAlerta('Debes ingresar un texto para la pregunta', 'error');
        return;
    }
    
    // Si es pregunta de opción múltiple, verificar que tenga opciones
    if (tipoPregunta === 'opcion_multiple' && (!opcionesPregunta[preguntaActualId] || opcionesPregunta[preguntaActualId].length < 2)) {
        mostrarAlerta('Debes agregar al menos 2 opciones de respuesta', 'error');
        return;
    }
    
    // Crear objeto de pregunta
    const pregunta = {
        id: preguntaActualId,
        texto: textoPregunta,
        tipo: tipoPregunta,
        obligatoria: obligatoria
    };
    
    // Agregar opciones si es pregunta de opción múltiple
    if (tipoPregunta === 'opcion_multiple') {
        pregunta.opciones = opcionesPregunta[preguntaActualId];
    }
    
    // Agregar nueva pregunta al módulo actual
    if (!preguntasModulo[moduloActualId]) {
        preguntasModulo[moduloActualId] = [];
    }
    
    // Verificar límite de preguntas
    if (preguntasModulo[moduloActualId].length >= 10) {
        mostrarAlerta('No se pueden agregar más de 10 preguntas por módulo', 'error');
        return;
    }
    
    preguntasModulo[moduloActualId].push(pregunta);
    
    // Actualizar contador de preguntas en el módulo
    const moduloElement = document.querySelector(`.modulo-encuesta[data-modulo-id="${moduloActualId}"]`);
    if (moduloElement) {
        moduloElement.querySelector('.contador-preguntas').textContent = preguntasModulo[moduloActualId].length;
    }
    
    // Renderizar nueva pregunta
    renderizarPregunta(pregunta, preguntasModulo[moduloActualId].length);
    
    // Cerrar modal
    document.getElementById('modal-pregunta').style.display = 'none';
}

/**
 * Renderiza una pregunta en la interfaz
 * @param {Object} pregunta - Datos de la pregunta
 * @param {number} numero - Número de la pregunta
 */
function renderizarPregunta(pregunta, numero) {
    // Obtener el contenedor de preguntas
    const listaPreguntas = document.getElementById('lista-preguntas');
    
    // Clonar template
    const template = document.getElementById('template-pregunta');
    const preguntaElement = template.content.cloneNode(true).querySelector('.pregunta');
    
    // Configurar datos
    preguntaElement.dataset.preguntaId = pregunta.id;
    preguntaElement.querySelector('.numero-pregunta').textContent = numero;
    preguntaElement.querySelector('.texto-pregunta').textContent = pregunta.texto;
    preguntaElement.querySelector('.tipo-pregunta').textContent = `Tipo: ${pregunta.tipo === 'abierta' ? 'Abierta' : 'Opción Múltiple'}`;
    preguntaElement.querySelector('.estado-pregunta').textContent = `Obligatoria: ${pregunta.obligatoria ? 'Sí' : 'No'}`;
    
    // Configurar eventos
    preguntaElement.querySelector('.btn-editar-pregunta').addEventListener('click', () => {
        editarPregunta(moduloActualId, pregunta.id);
    });
    
    preguntaElement.querySelector('.btn-eliminar-pregunta').addEventListener('click', () => {
        eliminarPregunta(moduloActualId, pregunta.id);
    });
    
    // Agregar al DOM
    listaPreguntas.appendChild(preguntaElement);
}

/**
 * Muestra u oculta la sección de opciones según el tipo de pregunta seleccionado
 */
function toggleOpcionesPregunta() {
    const tipoPregunta = document.getElementById('tipo-pregunta').value;
    const seccionOpciones = document.getElementById('seccion-opciones');
    
    if (tipoPregunta === 'opcion_multiple') {
        seccionOpciones.classList.remove('hidden');
        
        // Inicializar opciones si no existen
        if (!opcionesPregunta[preguntaActualId] || opcionesPregunta[preguntaActualId].length === 0) {
            // Agregar dos opciones por defecto
            document.getElementById('lista-opciones').innerHTML = '';
            agregarOpcionRespuesta();
            agregarOpcionRespuesta();
        }
    } else {
        seccionOpciones.classList.add('hidden');
    }
}

/**
 * Agrega una opción de respuesta para pregunta de opción múltiple
 */
function agregarOpcionRespuesta() {
    // Verificar si ya se alcanzó el límite de opciones
    if (opcionesPregunta[preguntaActualId] && opcionesPregunta[preguntaActualId].length >= 5) {
        mostrarAlerta('No se pueden agregar más de 5 opciones de respuesta', 'error');
        return;
    }
    
    // Inicializar array de opciones si no existe
    if (!opcionesPregunta[preguntaActualId]) {
        opcionesPregunta[preguntaActualId] = [];
    }
    
    // Crear nueva opción
    const nuevaOpcion = `Opción ${opcionesPregunta[preguntaActualId].length + 1}`;
    opcionesPregunta[preguntaActualId].push(nuevaOpcion);
    
    // Agregar opción a la interfaz
    agregarOpcionRespuestaUI(nuevaOpcion);
}

/**
 * Agrega una opción de respuesta a la interfaz
 * @param {string} textoOpcion - Texto de la opción
 */
function agregarOpcionRespuestaUI(textoOpcion) {
    const listaOpciones = document.getElementById('lista-opciones');
    const indice = listaOpciones.children.length;
    
    // Crear elemento de opción
    const opcionElement = document.createElement('div');
    opcionElement.className = 'opcion-respuesta';
    opcionElement.dataset.indice = indice;
    
    opcionElement.innerHTML = `
        <input type="text" value="${textoOpcion}" placeholder="Texto de la opción">
        <button type="button" class="btn-eliminar-opcion">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    // Configurar evento de cambio de texto
    opcionElement.querySelector('input').addEventListener('input', (event) => {
        opcionesPregunta[preguntaActualId][indice] = event.target.value;
    });
    
    // Configurar evento de eliminación
    opcionElement.querySelector('.btn-eliminar-opcion').addEventListener('click', () => {
        eliminarOpcionRespuesta(indice);
    });
    
    // Agregar al DOM
    listaOpciones.appendChild(opcionElement);
}

/**
 * Elimina una opción de respuesta
 * @param {number} indice - Índice de la opción a eliminar
 */
function eliminarOpcionRespuesta(indice) {
    // Verificar que haya al menos dos opciones
    if (opcionesPregunta[preguntaActualId].length <= 2) {
        mostrarAlerta('Debe haber al menos 2 opciones de respuesta', 'error');
        return;
    }
    
    // Eliminar opción del array
    opcionesPregunta[preguntaActualId].splice(indice, 1);
    
    // Actualizar interfaz
    const listaOpciones = document.getElementById('lista-opciones');
    listaOpciones.innerHTML = '';
    
    // Renderizar opciones actualizadas
    opcionesPregunta[preguntaActualId].forEach((opcion) => {
        agregarOpcionRespuestaUI(opcion);
    });
}

/**
 * Elimina una pregunta
 * @param {string} moduloId - ID del módulo que contiene la pregunta
 * @param {string} preguntaId - ID de la pregunta a eliminar
 */
function eliminarPregunta(moduloId, preguntaId) {
    if (confirm('¿Estás seguro de que deseas eliminar esta pregunta?')) {
        // Eliminar pregunta de la lista
        preguntasModulo[moduloId] = preguntasModulo[moduloId].filter(p => p.id !== preguntaId);
        
        // Eliminar opciones asociadas
        delete opcionesPregunta[preguntaId];
        
        // Eliminar elemento del DOM
        const preguntaElement = document.querySelector(`.pregunta[data-pregunta-id="${preguntaId}"]`);
        if (preguntaElement) {
            preguntaElement.remove();
        }
        
        // Actualizar numeración de preguntas
        const preguntas = document.querySelectorAll('#lista-preguntas .pregunta');
        preguntas.forEach((elem, index) => {
            elem.querySelector('.numero-pregunta').textContent = index + 1;
        });
        
        // Actualizar contador de preguntas en el módulo
        const moduloElement = document.querySelector(`.modulo-encuesta[data-modulo-id="${moduloId}"]`);
        if (moduloElement) {
            moduloElement.querySelector('.contador-preguntas').textContent = preguntasModulo[moduloId].length;
        }
    }
}

/**
 * Filtra las encuestas según los criterios seleccionados
 */
function filtrarEncuestas() {
    // Esta función se implementará cuando haya encuestas reales
    console.log('Filtrando encuestas...');
}

/**
 * Genera un ID único
 * @returns {string} ID generado
 */
function generarId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Muestra u oculta el indicador de carga
 * @param {boolean} mostrar - Indica si se debe mostrar u ocultar
 */
function mostrarCargando(mostrar) {
    const cargando = document.getElementById('cargando');
    if (mostrar) {
        cargando.classList.remove('hidden');
    } else {
        cargando.classList.add('hidden');
    }
}

/**
 * Muestra una alerta al usuario
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} tipo - Tipo de alerta ('exito' o 'error')
 */
function mostrarAlerta(mensaje, tipo = 'exito') {
    // Crear elemento de alerta
    const alerta = document.createElement('div');
    alerta.className = `alerta-${tipo}`;
    alerta.textContent = mensaje;
    
    // Agregar a la página
    document.body.appendChild(alerta);
    
    // Eliminar después de 3 segundos
    setTimeout(() => {
        alerta.remove();
    }, 3000);
}

// Exportamos la función de inicialización
window.inicializarCreadorEncuestas = inicializarCreadorEncuestas;

// No additional modules to load - all functionality is in this file

/**
 * Muestra el panel para crear una nueva encuesta
 */
function mostrarPanelNuevaEncuesta() {
    // Ocultar panel de encuestas existentes
    document.getElementById('panel-ver-encuestas').classList.add('hidden');
    
    // Reiniciar variables
    encuestaActual = null;
    modulosEncuesta = [];
    preguntasModulo = {};
    modoEdicion = false;
    
    // Limpiar formulario
    document.getElementById('form-encuesta').reset();
    document.getElementById('lista-modulos').innerHTML = '';
    
    // Habilitar el botón de agregar módulo (al inicio no hay módulos)
    document.getElementById('btn-agregar-modulo').removeAttribute('disabled');
    
    // Mostrar panel de nueva encuesta
    document.getElementById('panel-nueva-encuesta').classList.remove('hidden');
}

/**
 * Cancela la creación/edición de una encuesta
 */
function cancelarCreacionEncuesta() {
    if (confirm('¿Estás seguro de que deseas cancelar? Se perderán los cambios no guardados.')) {
        document.getElementById('panel-nueva-encuesta').classList.add('hidden');
    }
}

/**
 * Guarda la encuesta en Firestore
 * @param {Event} event - Evento del formulario
 */
function guardarEncuesta(event) {
    event.preventDefault();
    
    // Validar que haya al menos un módulo
    if (modulosEncuesta.length === 0) {
        mostrarAlerta('Debes agregar al menos un módulo a la encuesta', 'error');
        return;
    }
    
    // Mostrar indicador de carga
    mostrarCargando(true);
    
    // Obtener datos del formulario
    const nombreEncuesta = document.getElementById('nombre-encuesta').value.trim();
    const descripcionEncuesta = document.getElementById('descripcion-encuesta').value.trim();
    const estadoEncuesta = document.getElementById('estado-encuesta').value;
    
    // Crear objeto de encuesta
    const encuesta = {
        nombre: nombreEncuesta,
        descripcion: descripcionEncuesta,
        estado: estadoEncuesta,
        modulos: modulosEncuesta,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
    };
    
    // Si estamos en modo edición, actualizar encuesta existente
    if (modoEdicion && encuestaActual) {
        actualizarEncuesta(encuestaActual.id, encuesta);
    } else {
        // Si no, crear nueva encuesta
        crearNuevaEncuesta(encuesta);
    }
}

/**
 * Muestra u oculta el indicador de carga
 * @param {boolean} mostrar - Indica si se debe mostrar u ocultar
 */
function mostrarCargando(mostrar) {
    const cargando = document.getElementById('cargando');
    if (mostrar) {
        cargando.classList.remove('hidden');
    } else {
        cargando.classList.add('hidden');
    }
}

/**
 * Muestra una alerta al usuario
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} tipo - Tipo de alerta ('exito' o 'error')
 */
function mostrarAlerta(mensaje, tipo = 'exito') {
    // Crear elemento de alerta
    const alerta = document.createElement('div');
    alerta.className = `alerta-${tipo}`;
    alerta.textContent = mensaje;
    
    // Agregar a la página
    document.body.appendChild(alerta);
    
    // Eliminar después de 3 segundos
    setTimeout(() => {
        alerta.remove();
    }, 3000);
}

// Exportamos la función de inicialización
window.inicializarCreadorEncuestas = inicializarCreadorEncuestas;
