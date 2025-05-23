/**
 * Módulo para gestionar los módulos de encuestas
 * Este archivo maneja la creación, actualización, eliminación y visualización de módulos.
 */

/**
 * Muestra el modal para agregar o editar un módulo
 */
function mostrarModalModulo() {
    // Reiniciar formulario
    document.getElementById('form-modulo').reset();
    document.getElementById('lista-preguntas').innerHTML = '';
    
    // Reiniciar variables
    modoEdicion = false;
    moduloActualId = null;
    preguntasModulo[generarId()] = [];
    
    // Mostrar modal
    document.getElementById('modal-modulo').style.display = 'block';
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
 * Cierra el modal de módulo
 */
function cerrarModalModulo() {
    // Si estamos creando un nuevo módulo y cancelamos, eliminar el array de preguntas
    if (!modoEdicion && moduloActualId) {
        delete preguntasModulo[moduloActualId];
    }
    
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
    
    // Obtener preguntas para este módulo
    const preguntas = preguntasModulo[moduloActualId] || [];
    
    if (modoEdicion) {
        // Actualizar módulo existente
        const indice = modulosEncuesta.findIndex(m => m.id === moduloActualId);
        
        if (indice !== -1) {
            modulosEncuesta[indice] = {
                ...modulosEncuesta[indice],
                nombre: nombreModulo,
                preguntas: preguntas
            };
            
            // Actualizar visualización
            const moduloElement = document.querySelector(`.modulo-encuesta[data-modulo-id="${moduloActualId}"]`);
            if (moduloElement) {
                moduloElement.querySelector('.titulo-modulo').textContent = nombreModulo;
                moduloElement.querySelector('.contador-preguntas').textContent = preguntas.length;
            }
        }
    } else {
        // Crear nuevo módulo
        const nuevoModulo = {
            id: moduloActualId,
            nombre: nombreModulo,
            preguntas: preguntas
        };
        
        modulosEncuesta.push(nuevoModulo);
        
        // Renderizar nuevo módulo
        renderizarModulo(nuevoModulo);
    }
    
    // Actualizar botón de agregar módulo
    actualizarBotonAgregarModulo();
    
    // Cerrar modal
    document.getElementById('modal-modulo').style.display = 'none';
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
    moduloElement.querySelector('.numero-modulo').textContent = modulosEncuesta.findIndex(m => m.id === modulo.id) + 1;
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
 * Genera un ID único
 * @returns {string} ID generado
 */
function generarId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}
