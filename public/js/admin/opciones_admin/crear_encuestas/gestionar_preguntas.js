/**
 * Módulo para gestionar las preguntas de encuestas
 * Este archivo maneja la creación, actualización, eliminación y visualización de preguntas.
 */

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
 * Muestra el modal para editar una pregunta existente
 * @param {string} moduloId - ID del módulo que contiene la pregunta
 * @param {string} preguntaId - ID de la pregunta a editar
 */
function editarPregunta(moduloId, preguntaId) {
    // Verificar que exista el módulo y la pregunta
    if (!preguntasModulo[moduloId]) {
        console.error('No se encontró el módulo con ID:', moduloId);
        return;
    }
    
    const pregunta = preguntasModulo[moduloId].find(p => p.id === preguntaId);
    
    if (!pregunta) {
        console.error('No se encontró la pregunta con ID:', preguntaId);
        return;
    }
    
    // Establecer modo edición
    modoEdicion = true;
    moduloActualId = moduloId;
    preguntaActualId = preguntaId;
    
    // Cargar datos en el formulario
    document.getElementById('texto-pregunta').value = pregunta.texto || '';
    document.getElementById('tipo-pregunta').value = pregunta.tipo || 'abierta';
    document.getElementById('obligatoria-pregunta').value = pregunta.obligatoria ? 'true' : 'false';
    
    // Manejar opciones de respuesta para preguntas de opción múltiple
    if (pregunta.tipo === 'opcion_multiple') {
        document.getElementById('seccion-opciones').classList.remove('hidden');
        
        // Mostrar opciones existentes
        document.getElementById('lista-opciones').innerHTML = '';
        
        // Inicializar el array de opciones si no existe
        if (!opcionesPregunta[preguntaId]) {
            opcionesPregunta[preguntaId] = pregunta.opciones || [];
        }
        
        opcionesPregunta[preguntaId].forEach((opcion, index) => {
            agregarOpcionRespuestaUI(opcion, preguntaId);
        });
    } else {
        document.getElementById('seccion-opciones').classList.add('hidden');
    }
    
    // Mostrar modal
    document.getElementById('modal-pregunta').style.display = 'block';
}

/**
 * Cierra el modal de pregunta
 */
function cerrarModalPregunta() {
    // Si estamos creando una nueva pregunta y cancelamos, eliminar el array de opciones
    if (!modoEdicion && preguntaActualId) {
        delete opcionesPregunta[preguntaActualId];
    }
    
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
    
    if (modoEdicion) {
        // Actualizar pregunta existente
        const indice = preguntasModulo[moduloActualId].findIndex(p => p.id === preguntaActualId);
        
        if (indice !== -1) {
            preguntasModulo[moduloActualId][indice] = pregunta;
            
            // Actualizar visualización
            actualizarVisualizacionPregunta(pregunta, indice + 1);
        }
    } else {
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
    }
    
    // Cerrar modal
    document.getElementById('modal-pregunta').style.display = 'none';
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
 * Actualiza la visualización de una pregunta en la interfaz
 * @param {Object} pregunta - Datos de la pregunta
 * @param {number} numero - Número de la pregunta
 */
function actualizarVisualizacionPregunta(pregunta, numero) {
    const preguntaElement = document.querySelector(`.pregunta[data-pregunta-id="${pregunta.id}"]`);
    
    if (preguntaElement) {
        preguntaElement.querySelector('.texto-pregunta').textContent = pregunta.texto;
        preguntaElement.querySelector('.tipo-pregunta').textContent = `Tipo: ${pregunta.tipo === 'abierta' ? 'Abierta' : 'Opción Múltiple'}`;
        preguntaElement.querySelector('.estado-pregunta').textContent = `Obligatoria: ${pregunta.obligatoria ? 'Sí' : 'No'}`;
    }
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
    agregarOpcionRespuestaUI(nuevaOpcion, preguntaActualId);
}

/**
 * Agrega una opción de respuesta a la interfaz
 * @param {string} textoOpcion - Texto de la opción
 * @param {string} preguntaId - ID de la pregunta
 */
function agregarOpcionRespuestaUI(textoOpcion, preguntaId) {
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
        opcionesPregunta[preguntaId][indice] = event.target.value;
    });
    
    // Configurar evento de eliminación
    opcionElement.querySelector('.btn-eliminar-opcion').addEventListener('click', () => {
        eliminarOpcionRespuesta(preguntaId, indice);
    });
    
    // Agregar al DOM
    listaOpciones.appendChild(opcionElement);
}

/**
 * Elimina una opción de respuesta
 * @param {string} preguntaId - ID de la pregunta
 * @param {number} indice - Índice de la opción a eliminar
 */
function eliminarOpcionRespuesta(preguntaId, indice) {
    // Verificar que haya al menos dos opciones
    if (opcionesPregunta[preguntaId].length <= 2) {
        mostrarAlerta('Debe haber al menos 2 opciones de respuesta', 'error');
        return;
    }
    
    // Eliminar opción del array
    opcionesPregunta[preguntaId].splice(indice, 1);
    
    // Actualizar interfaz
    const listaOpciones = document.getElementById('lista-opciones');
    listaOpciones.innerHTML = '';
    
    // Renderizar opciones actualizadas
    opcionesPregunta[preguntaId].forEach((opcion) => {
        agregarOpcionRespuestaUI(opcion, preguntaId);
    });
}
