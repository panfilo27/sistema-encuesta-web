/**
 * Gestor de Preguntas - Sistema de Encuestas
 * 
 * Este archivo maneja la creación, edición y eliminación de preguntas en los módulos.
 * Las preguntas pueden ser de respuesta abierta o de opción múltiple.
 */

// Variables globales
let preguntasModulo = {};  // Objetos con key = moduloId, value = array de preguntas
let opcionesPregunta = {}; // Objetos con key = preguntaId, value = array de opciones
let preguntaActualId = null;
let moduloActualId = null;

/**
 * Inicializa el gestor de preguntas
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando gestor de preguntas...');
    
    // Configurar eventos para el modal de preguntas
    const modalPregunta = document.getElementById('modal-pregunta');
    if (modalPregunta) {
        const cerrarModal = modalPregunta.querySelector('.cerrar-modal');
        if (cerrarModal) {
            cerrarModal.addEventListener('click', cerrarModalPregunta);
        }
        
        const btnCancelarPregunta = document.getElementById('btn-cancelar-pregunta');
        if (btnCancelarPregunta) {
            btnCancelarPregunta.addEventListener('click', cerrarModalPregunta);
        }
        
        const formPregunta = document.getElementById('form-pregunta');
        if (formPregunta) {
            formPregunta.addEventListener('submit', function(e) {
                e.preventDefault();
                guardarPregunta();
            });
        }
        
        // Evento para cambiar tipo de pregunta
        const tipoPregunta = document.getElementById('tipo-pregunta');
        if (tipoPregunta) {
            tipoPregunta.addEventListener('change', toggleOpcionesPregunta);
        }
        
        // Evento para agregar opción
        const btnAgregarOpcion = document.getElementById('btn-agregar-opcion');
        if (btnAgregarOpcion) {
            btnAgregarOpcion.addEventListener('click', agregarOpcionRespuesta);
        }
    }
});

/**
 * Muestra el modal para crear o editar una pregunta
 * @param {string} moduloId - ID del módulo al que pertenece la pregunta
 * @param {string} preguntaId - ID de la pregunta a editar (null si es nueva)
 */
function mostrarModalPregunta(moduloId, preguntaId = null) {
    console.log(`Mostrando modal de pregunta para módulo ${moduloId}, pregunta ${preguntaId}`);
    
    // Guardar referencias
    moduloActualId = moduloId;
    preguntaActualId = preguntaId;
    
    // Limpiar el formulario
    const formPregunta = document.getElementById('form-pregunta');
    if (formPregunta) {
        formPregunta.reset();
    }
    
    // Limpiar opciones
    const listaOpciones = document.getElementById('lista-opciones');
    if (listaOpciones) {
        listaOpciones.innerHTML = '';
    }
    
    // Inicializar array de opciones si no existe
    if (!opcionesPregunta[preguntaActualId]) {
        opcionesPregunta[preguntaActualId] = [];
    }
    
    // Si estamos editando una pregunta existente, cargar sus datos
    if (preguntaId) {
        const modulo = window.modulosEncuesta.find(m => m.id === moduloId);
        if (modulo && modulo.preguntas) {
            const pregunta = modulo.preguntas.find(p => p.id === preguntaId);
            if (pregunta) {
                document.getElementById('texto-pregunta').value = pregunta.texto || '';
                document.getElementById('tipo-pregunta').value = pregunta.tipo || 'abierta';
                document.getElementById('obligatoria').value = pregunta.obligatoria ? 'true' : 'false';
                
                // Si es de opción múltiple, cargar opciones
                if (pregunta.tipo === 'opcion_multiple' && pregunta.opciones) {
                    // Mostrar sección de opciones
                    document.getElementById('seccion-opciones').classList.remove('hidden');
                    
                    // Cargar opciones existentes
                    opcionesPregunta[preguntaActualId] = [...pregunta.opciones];
                    pregunta.opciones.forEach(opcion => {
                        agregarOpcionRespuestaUI(opcion);
                    });
                }
            }
        }
    }
    
    // Asegurar que la sección de opciones esté visible/oculta según corresponda
    toggleOpcionesPregunta();
    
    // Mostrar el modal
    const modal = document.getElementById('modal-pregunta');
    if (modal) {
        modal.style.display = 'flex';
    }
}

/**
 * Cierra el modal de pregunta
 */
function cerrarModalPregunta() {
    const modal = document.getElementById('modal-pregunta');
    if (modal) {
        modal.style.display = 'none';
    }
    moduloActualId = null;
    preguntaActualId = null;
}

/**
 * Alterna la visibilidad de la sección de opciones según el tipo de pregunta
 */
function toggleOpcionesPregunta() {
    const tipoPregunta = document.getElementById('tipo-pregunta').value;
    const seccionOpciones = document.getElementById('seccion-opciones');
    
    if (tipoPregunta === 'opcion_multiple') {
        seccionOpciones.classList.remove('hidden');
    } else {
        seccionOpciones.classList.add('hidden');
    }
}

/**
 * Agrega una nueva opción de respuesta
 */
function agregarOpcionRespuesta() {
    const listaOpciones = document.getElementById('lista-opciones');
    if (!listaOpciones) return;
    
    // Verificar si ya se alcanzó el límite de opciones
    if (listaOpciones.children.length >= 5) {
        window.mostrarAlerta('No se pueden agregar más de 5 opciones', 'error');
        return;
    }
    
    // Crear nueva opción
    const nuevaOpcion = `Opción ${listaOpciones.children.length + 1}`;
    
    // Agregar a la UI
    agregarOpcionRespuestaUI(nuevaOpcion);
}

/**
 * Agrega una opción de respuesta a la interfaz
 * @param {string} textoOpcion - Texto de la opción
 */
function agregarOpcionRespuestaUI(textoOpcion) {
    const listaOpciones = document.getElementById('lista-opciones');
    if (!listaOpciones) return;
    
    const numOpciones = listaOpciones.children.length;
    
    // Crear elemento de opción
    const opcionElement = document.createElement('div');
    opcionElement.className = 'opcion-respuesta';
    opcionElement.dataset.indice = numOpciones;
    
    opcionElement.innerHTML = `
        <input type="text" value="${textoOpcion}" placeholder="Texto de la opción">
        <button type="button" class="btn-condicional-opcion" title="Agregar pregunta condicional">
            <i class="fas fa-question-circle"></i> Subpregunta
        </button>
        <button type="button" class="btn-eliminar-opcion">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    // Configurar evento para cambios en el texto
    opcionElement.querySelector('input').addEventListener('input', function(event) {
        const indice = parseInt(opcionElement.dataset.indice);
        const valor = event.target.value.trim();
        
        // Actualizar el valor en el array de opciones
        if (indice < opcionesPregunta[preguntaActualId].length) {
            opcionesPregunta[preguntaActualId][indice] = valor;
        } else {
            opcionesPregunta[preguntaActualId].push(valor);
        }
    });
    
    // Configurar evento para botón de subpregunta
    opcionElement.querySelector('.btn-condicional-opcion').addEventListener('click', function() {
        const indice = parseInt(opcionElement.dataset.indice);
        
        // Esta función se implementará en gestor_preguntas_condicionales.js
        if (typeof mostrarModalPreguntaCondicional === 'function') {
            mostrarModalPreguntaCondicional(preguntaActualId, indice);
        } else {
            console.warn('Función mostrarModalPreguntaCondicional no disponible');
            window.mostrarAlerta('La funcionalidad de subpreguntas está en desarrollo', 'info');
        }
    });
    
    // Configurar evento para botón de eliminar
    opcionElement.querySelector('.btn-eliminar-opcion').addEventListener('click', function() {
        eliminarOpcionRespuesta(opcionElement);
    });
    
    // Agregar al DOM
    listaOpciones.appendChild(opcionElement);
    
    // Agregar al array de opciones
    if (numOpciones >= opcionesPregunta[preguntaActualId].length) {
        opcionesPregunta[preguntaActualId].push(textoOpcion);
    }
}

/**
 * Elimina una opción de respuesta
 * @param {HTMLElement} opcionElement - Elemento DOM de la opción
 */
function eliminarOpcionRespuesta(opcionElement) {
    const listaOpciones = document.getElementById('lista-opciones');
    if (!listaOpciones) return;
    
    // Verificar que queden al menos dos opciones
    if (listaOpciones.children.length <= 2) {
        window.mostrarAlerta('Debe haber al menos 2 opciones', 'error');
        return;
    }
    
    // Obtener índice
    const indice = parseInt(opcionElement.dataset.indice);
    
    // Eliminar del array de opciones
    if (opcionesPregunta[preguntaActualId] && indice < opcionesPregunta[preguntaActualId].length) {
        opcionesPregunta[preguntaActualId].splice(indice, 1);
    }
    
    // Eliminar del DOM
    opcionElement.remove();
    
    // Reindexar las opciones restantes
    Array.from(listaOpciones.children).forEach((elem, idx) => {
        elem.dataset.indice = idx;
    });
}

/**
 * Guarda la pregunta actual
 */
function guardarPregunta() {
    // Verificar que tenemos un módulo actual
    if (!moduloActualId) {
        window.mostrarAlerta('No se ha seleccionado un módulo', 'error');
        return;
    }
    
    // Obtener datos del formulario
    const textoPregunta = document.getElementById('texto-pregunta').value.trim();
    const tipoPregunta = document.getElementById('tipo-pregunta').value;
    const obligatoria = document.getElementById('obligatoria').value === 'true';
    
    // Validaciones básicas
    if (!textoPregunta) {
        window.mostrarAlerta('El texto de la pregunta es obligatorio', 'error');
        return;
    }
    
    // Si es de opción múltiple, validar opciones
    if (tipoPregunta === 'opcion_multiple') {
        const listaOpciones = document.getElementById('lista-opciones');
        
        // Verificar que haya al menos 2 opciones
        if (!listaOpciones || listaOpciones.children.length < 2) {
            window.mostrarAlerta('Las preguntas de opción múltiple deben tener al menos 2 opciones', 'error');
            return;
        }
        
        // Verificar que todas tengan texto
        let opcionesValidas = true;
        opcionesPregunta[preguntaActualId].forEach(opcion => {
            if (!opcion || opcion.trim() === '') {
                opcionesValidas = false;
            }
        });
        
        if (!opcionesValidas) {
            window.mostrarAlerta('Todas las opciones deben tener texto', 'error');
            return;
        }
    }
    
    // Crear o actualizar la pregunta
    const pregunta = {
        id: preguntaActualId || generarId(),
        texto: textoPregunta,
        tipo: tipoPregunta,
        obligatoria: obligatoria
    };
    
    // Si es de opción múltiple, agregar las opciones
    if (tipoPregunta === 'opcion_multiple') {
        pregunta.opciones = [...opcionesPregunta[preguntaActualId]];
    }
    
    // Buscar el módulo correspondiente
    const moduloIndex = window.modulosEncuesta.findIndex(m => m.id === moduloActualId);
    if (moduloIndex === -1) {
        window.mostrarAlerta('No se encontró el módulo seleccionado', 'error');
        return;
    }
    
    // Agregar o actualizar la pregunta en el módulo
    if (preguntaActualId) {
        // Actualizar pregunta existente
        const preguntaIndex = window.modulosEncuesta[moduloIndex].preguntas.findIndex(p => p.id === preguntaActualId);
        if (preguntaIndex !== -1) {
            window.modulosEncuesta[moduloIndex].preguntas[preguntaIndex] = pregunta;
        }
    } else {
        // Agregar nueva pregunta
        if (!window.modulosEncuesta[moduloIndex].preguntas) {
            window.modulosEncuesta[moduloIndex].preguntas = [];
        }
        window.modulosEncuesta[moduloIndex].preguntas.push(pregunta);
    }
    
    // Actualizar la interfaz
    actualizarPreguntasEnUI(moduloActualId);
    
    // Cerrar el modal
    cerrarModalPregunta();
    
    // Mostrar mensaje de éxito
    window.mostrarAlerta('Pregunta guardada correctamente', 'success');
}

/**
 * Actualiza la lista de preguntas en la UI para un módulo específico
 * @param {string} moduloId - ID del módulo
 */
function actualizarPreguntasEnUI(moduloId) {
    const modulo = window.modulosEncuesta.find(m => m.id === moduloId);
    if (!modulo) return;
    
    // Generar HTML para las preguntas
    const preguntasHTML = generarHTMLPreguntas(modulo.preguntas || []);
    
    // Actualizar en el DOM
    const listaPreguntas = document.getElementById(`lista-preguntas-${moduloId}`);
    if (listaPreguntas) {
        listaPreguntas.innerHTML = preguntasHTML;
        
        // Configurar eventos para los botones de las preguntas
        listaPreguntas.querySelectorAll('.pregunta').forEach(preguntaElement => {
            const preguntaId = preguntaElement.dataset.preguntaId;
            
            // Botón de editar
            const btnEditar = preguntaElement.querySelector('.btn-editar-pregunta');
            if (btnEditar) {
                btnEditar.addEventListener('click', function() {
                    mostrarModalPregunta(moduloId, preguntaId);
                });
            }
            
            // Botón de eliminar
            const btnEliminar = preguntaElement.querySelector('.btn-eliminar-pregunta');
            if (btnEliminar) {
                btnEliminar.addEventListener('click', function() {
                    eliminarPregunta(moduloId, preguntaId);
                });
            }
        });
    }
    
    // Actualizar contador de preguntas en el módulo
    const moduloElement = document.querySelector(`.modulo-encuesta[data-modulo-id="${moduloId}"]`);
    if (moduloElement) {
        const contadorPreguntas = moduloElement.querySelector('.contador-preguntas');
        if (contadorPreguntas) {
            contadorPreguntas.innerHTML = `
                <i class="fas fa-question-circle"></i> 
                ${modulo.preguntas ? modulo.preguntas.length : 0} preguntas
            `;
        }
    }
}

/**
 * Elimina una pregunta de un módulo
 * @param {string} moduloId - ID del módulo
 * @param {string} preguntaId - ID de la pregunta
 */
function eliminarPregunta(moduloId, preguntaId) {
    if (confirm('¿Estás seguro de que deseas eliminar esta pregunta?')) {
        // Buscar el módulo
        const moduloIndex = window.modulosEncuesta.findIndex(m => m.id === moduloId);
        if (moduloIndex === -1) return;
        
        // Eliminar la pregunta
        window.modulosEncuesta[moduloIndex].preguntas = 
            window.modulosEncuesta[moduloIndex].preguntas.filter(p => p.id !== preguntaId);
        
        // Limpiar opciones
        delete opcionesPregunta[preguntaId];
        
        // Actualizar interfaz
        actualizarPreguntasEnUI(moduloId);
        
        // Mostrar mensaje
        window.mostrarAlerta('Pregunta eliminada correctamente', 'success');
    }
}

/**
 * Genera el HTML para las preguntas
 * @param {Array} preguntas - Lista de preguntas
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
 * @param {string} tipo - Tipo de pregunta
 * @returns {string} Texto descriptivo
 */
function obtenerTipoPreguntaTexto(tipo) {
    const tipos = {
        'abierta': 'Respuesta abierta',
        'opcion_multiple': 'Opción múltiple'
    };
    
    return tipos[tipo] || 'Desconocido';
}

// Exportar funciones que se usarán en otros módulos
window.mostrarModalPregunta = mostrarModalPregunta;
window.cerrarModalPregunta = cerrarModalPregunta;
window.preguntasModulo = preguntasModulo;
window.opcionesPregunta = opcionesPregunta;
