/**
 * Gestor de Módulos - Sistema de Encuestas
 * 
 * Este archivo maneja la creación, edición y eliminación de módulos en encuestas.
 * Un módulo es un grupo temático de preguntas dentro de una encuesta.
 */

// Variables globales
let modulosEncuesta = [];
let moduloEnEdicion = null;

/**
 * Inicializa el gestor de módulos
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando gestor de módulos...');
    
    // Configurar eventos para el modal de módulos
    const modalModulo = document.getElementById('modal-modulo');
    if (modalModulo) {
        const cerrarModal = modalModulo.querySelector('.cerrar-modal');
        if (cerrarModal) {
            cerrarModal.addEventListener('click', cerrarModalModulo);
        }
        
        const btnCancelarModulo = document.getElementById('btn-cancelar-modulo');
        if (btnCancelarModulo) {
            btnCancelarModulo.addEventListener('click', cerrarModalModulo);
        }
        
        const formModulo = document.getElementById('form-modulo');
        if (formModulo) {
            formModulo.addEventListener('submit', function(e) {
                e.preventDefault();
                guardarModulo();
            });
        }
    }
});

/**
 * Muestra el modal para crear o editar un módulo
 * @param {string} moduloId - ID del módulo a editar (null si es nuevo)
 */
function mostrarModalModulo(moduloId = null) {
    console.log('Mostrando modal de módulo:', moduloId);
    
    // Limpiar el formulario
    const formModulo = document.getElementById('form-modulo');
    if (formModulo) {
        formModulo.reset();
    }
    
    // Si estamos editando un módulo existente, cargar sus datos
    if (moduloId) {
        moduloEnEdicion = moduloId;
        const modulo = modulosEncuesta.find(m => m.id === moduloId);
        if (modulo) {
            document.getElementById('nombre-modulo').value = modulo.nombre || '';
            document.getElementById('descripcion-modulo').value = modulo.descripcion || '';
        }
    } else {
        moduloEnEdicion = null;
    }
    
    // Mostrar el modal
    const modal = document.getElementById('modal-modulo');
    if (modal) {
        modal.style.display = 'flex';
    }
}

/**
 * Cierra el modal de módulo
 */
function cerrarModalModulo() {
    const modal = document.getElementById('modal-modulo');
    if (modal) {
        modal.style.display = 'none';
    }
    moduloEnEdicion = null;
}

/**
 * Guarda el módulo actual
 */
function guardarModulo() {
    // Obtener datos del formulario
    const nombre = document.getElementById('nombre-modulo').value.trim();
    const descripcion = document.getElementById('descripcion-modulo').value.trim();
    
    // Validaciones básicas
    if (!nombre) {
        window.mostrarAlerta('El nombre del módulo es obligatorio', 'error');
        return;
    }
    
    // Crear o actualizar el módulo
    if (moduloEnEdicion) {
        // Actualizar módulo existente
        const indice = modulosEncuesta.findIndex(m => m.id === moduloEnEdicion);
        if (indice !== -1) {
            modulosEncuesta[indice].nombre = nombre;
            modulosEncuesta[indice].descripcion = descripcion;
            
            // Actualizar en la interfaz
            actualizarModuloEnUI(modulosEncuesta[indice]);
        }
    } else {
        // Crear nuevo módulo
        const nuevoModulo = {
            id: generarId(),
            nombre: nombre,
            descripcion: descripcion,
            preguntas: [],
            orden: modulosEncuesta.length + 1
        };
        
        modulosEncuesta.push(nuevoModulo);
        
        // Agregar a la interfaz
        renderizarModulo(nuevoModulo);
    }
    
    // Cerrar modal
    cerrarModalModulo();
    
    // Mostrar mensaje
    window.mostrarAlerta('Módulo guardado correctamente', 'success');
}

/**
 * Renderiza un módulo en la interfaz
 * @param {Object} modulo - Datos del módulo a renderizar
 */
function renderizarModulo(modulo) {
    const listaModulos = document.getElementById('lista-modulos');
    if (!listaModulos) return;
    
    // Verificar si ya existe el elemento para este módulo
    let moduloElement = document.querySelector(`.modulo-encuesta[data-modulo-id="${modulo.id}"]`);
    
    // Si no existe, crear nuevo elemento
    if (!moduloElement) {
        moduloElement = document.createElement('div');
        moduloElement.className = 'modulo-encuesta';
        moduloElement.dataset.moduloId = modulo.id;
        listaModulos.appendChild(moduloElement);
    }
    
    // Actualizar contenido
    moduloElement.innerHTML = `
        <div class="encabezado-modulo">
            <h4>${modulo.nombre}</h4>
            <div class="acciones-modulo">
                <button type="button" class="btn-agregar-pregunta" title="Agregar Pregunta">
                    <i class="fas fa-plus"></i> Pregunta
                </button>
                <button type="button" class="btn-editar-modulo" title="Editar Módulo">
                    <i class="fas fa-edit"></i>
                </button>
                <button type="button" class="btn-eliminar-modulo" title="Eliminar Módulo">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="detalles-modulo">
            <p>${modulo.descripcion || 'Sin descripción'}</p>
            <p class="contador-preguntas">
                <i class="fas fa-question-circle"></i> 
                ${modulo.preguntas.length} preguntas
            </p>
        </div>
        <div class="lista-preguntas" id="lista-preguntas-${modulo.id}">
            ${generarHTMLPreguntas(modulo.preguntas)}
        </div>
    `;
    
    // Configurar eventos para los botones
    configurarBotonesModulo(moduloElement, modulo.id);
}

/**
 * Actualiza un módulo existente en la interfaz
 * @param {Object} modulo - Datos del módulo actualizado
 */
function actualizarModuloEnUI(modulo) {
    // Simplemente volver a renderizar
    renderizarModulo(modulo);
}

/**
 * Configura los eventos para los botones de un módulo
 * @param {HTMLElement} moduloElement - Elemento del módulo
 * @param {string} moduloId - ID del módulo
 */
function configurarBotonesModulo(moduloElement, moduloId) {
    // Botón de agregar pregunta
    const btnAgregarPregunta = moduloElement.querySelector('.btn-agregar-pregunta');
    if (btnAgregarPregunta) {
        btnAgregarPregunta.addEventListener('click', function() {
            // Esta función se implementará en gestor_preguntas.js
            if (typeof mostrarModalPregunta === 'function') {
                mostrarModalPregunta(moduloId);
            } else {
                console.warn('Función mostrarModalPregunta no disponible');
            }
        });
    }
    
    // Botón de editar módulo
    const btnEditarModulo = moduloElement.querySelector('.btn-editar-modulo');
    if (btnEditarModulo) {
        btnEditarModulo.addEventListener('click', function() {
            mostrarModalModulo(moduloId);
        });
    }
    
    // Botón de eliminar módulo
    const btnEliminarModulo = moduloElement.querySelector('.btn-eliminar-modulo');
    if (btnEliminarModulo) {
        btnEliminarModulo.addEventListener('click', function() {
            eliminarModulo(moduloId);
        });
    }
}

/**
 * Elimina un módulo
 * @param {string} moduloId - ID del módulo a eliminar
 */
function eliminarModulo(moduloId) {
    if (confirm('¿Estás seguro de que deseas eliminar este módulo y todas sus preguntas?')) {
        // Eliminar el módulo del array
        modulosEncuesta = modulosEncuesta.filter(m => m.id !== moduloId);
        
        // Eliminar de la interfaz
        const moduloElement = document.querySelector(`.modulo-encuesta[data-modulo-id="${moduloId}"]`);
        if (moduloElement) {
            moduloElement.remove();
        }
        
        // Mostrar mensaje
        window.mostrarAlerta('Módulo eliminado correctamente', 'success');
    }
}

/**
 * Genera el HTML para las preguntas de un módulo
 * @param {Array} preguntas - Lista de preguntas del módulo
 * @returns {string} HTML generado
 */
function generarHTMLPreguntas(preguntas) {
    if (!preguntas || preguntas.length === 0) {
        return '<p class="sin-preguntas">No hay preguntas en este módulo</p>';
    }
    
    return preguntas.map((pregunta, index) => `
        <div class="pregunta" data-pregunta-id="${pregunta.id}">
            <div class="info-pregunta">
                <span class="numero-pregunta">${index + 1}</span>
                <span class="texto-pregunta">${pregunta.texto}</span>
                <span class="tipo-pregunta">${obtenerTipoPreguntaTexto(pregunta.tipo)}</span>
            </div>
            <div class="acciones-pregunta">
                <button type="button" class="btn-editar-pregunta" title="Editar Pregunta">
                    <i class="fas fa-edit"></i>
                </button>
                <button type="button" class="btn-eliminar-pregunta" title="Eliminar Pregunta">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Obtiene el texto descriptivo para un tipo de pregunta
 * @param {string} tipo - Tipo de pregunta (abierta, opcion_multiple, etc)
 * @returns {string} Texto descriptivo
 */
function obtenerTipoPreguntaTexto(tipo) {
    const tipos = {
        'abierta': 'Respuesta abierta',
        'opcion_multiple': 'Opción múltiple'
    };
    
    return tipos[tipo] || 'Desconocido';
}

/**
 * Genera un ID único para un nuevo elemento
 * @returns {string} ID generado
 */
function generarId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Exportar funciones que se usarán en otros módulos
window.mostrarModalModulo = mostrarModalModulo;
window.cerrarModalModulo = cerrarModalModulo;
window.modulosEncuesta = modulosEncuesta;
window.renderizarModulo = renderizarModulo;
window.generarId = generarId;
