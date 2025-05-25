/**
 * Gestor de Preguntas
 * Gestiona la creación, edición y eliminación de preguntas para los módulos
 */

// Evitar redeclaraciones usando un patrón de módulo autoejecutable
(function() {
    // Variables globales
    let preguntaActualId = null;
    let modoEdicionPregunta = false;
    let opcionesPregunta = {}; // Almacena las opciones de respuesta para preguntas de opción múltiple
    
    /**
     * Inicializa el gestor de preguntas
     */
    function inicializarGestorPreguntas() {
        console.log('Inicializando gestor de preguntas...');
        
        // Las funciones de inicialización se llamarán cuando se cargue el contenido del módulo
        document.addEventListener('click', function(event) {
            // Delegar eventos para botones que se crean dinámicamente
            if (event.target.matches('#btn-agregar-pregunta') || event.target.closest('#btn-agregar-pregunta')) {
                mostrarModalPregunta();
            }
        });
    }
    
    /**
     * Muestra el modal para crear/editar una pregunta
     */
    function mostrarModalPregunta(preguntaId = null) {
        // Verificar si existe el modal, si no, crearlo
        let modalPregunta = document.getElementById('modal-pregunta');
        
        if (!modalPregunta) {
            // Crear el modal para preguntas
            modalPregunta = document.createElement('div');
            modalPregunta.id = 'modal-pregunta';
            modalPregunta.className = 'modal';
            
            modalPregunta.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="titulo-modal-pregunta">Nueva pregunta</h3>
                        <span class="cerrar-modal">&times;</span>
                    </div>
                    <div class="modal-body">
                        <form id="form-pregunta">
                            <div class="form-group">
                                <label for="texto-pregunta">Texto de la pregunta:</label>
                                <input type="text" id="texto-pregunta" required>
                            </div>
                            <div class="form-group">
                                <label for="tipo-pregunta">Tipo de pregunta:</label>
                                <select id="tipo-pregunta" onchange="window.gestorPreguntas.toggleOpcionesPregunta()">
                                    <option value="abierta">Abierta (texto)</option>
                                    <option value="opcion_multiple">Opción múltiple</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="obligatoria-pregunta">Obligatoria:</label>
                                <select id="obligatoria-pregunta">
                                    <option value="true">Sí</option>
                                    <option value="false">No</option>
                                </select>
                            </div>
                            
                            <div id="seccion-opciones" class="hidden">
                                <h4>Opciones de respuesta</h4>
                                <div id="lista-opciones"></div>
                                <button type="button" class="btn-agregar-opcion" id="btn-agregar-opcion">
                                    <i class="fas fa-plus"></i> Agregar opción
                                </button>
                            </div>
                            
                            <div class="form-actions">
                                <button type="button" id="btn-cancelar-pregunta" class="btn-cancelar">Cancelar</button>
                                <button type="submit" id="btn-guardar-pregunta" class="btn-guardar">Guardar pregunta</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modalPregunta);
            
            // Configurar eventos para el modal
            const cerrarModal = modalPregunta.querySelector('.cerrar-modal');
            const btnCancelarPregunta = modalPregunta.querySelector('#btn-cancelar-pregunta');
            const formPregunta = modalPregunta.querySelector('#form-pregunta');
            const btnAgregarOpcion = modalPregunta.querySelector('#btn-agregar-opcion');
            
            if (cerrarModal) {
                cerrarModal.addEventListener('click', cerrarModalPregunta);
            }
            
            if (btnCancelarPregunta) {
                btnCancelarPregunta.addEventListener('click', cerrarModalPregunta);
            }
            
            if (formPregunta) {
                formPregunta.addEventListener('submit', guardarPregunta);
            }
            
            if (btnAgregarOpcion) {
                btnAgregarOpcion.addEventListener('click', agregarOpcionRespuesta);
            }
        }
        
        // Resetear formulario
        const formPregunta = document.getElementById('form-pregunta');
        const tituloModal = document.getElementById('titulo-modal-pregunta');
        
        if (formPregunta) {
            formPregunta.reset();
        }
        
        // Limpiar lista de opciones
        const listaOpciones = document.getElementById('lista-opciones');
        if (listaOpciones) {
            listaOpciones.innerHTML = '';
        }
        
        // Ocultar sección de opciones inicialmente
        const seccionOpciones = document.getElementById('seccion-opciones');
        if (seccionOpciones) {
            seccionOpciones.classList.add('hidden');
        }
        
        // Configurar modo edición o creación
        if (preguntaId) {
            // Modo edición
            modoEdicionPregunta = true;
            preguntaActualId = preguntaId;
            
            // En una implementación real, aquí cargaríamos los datos de la pregunta
            // Por ahora, dejamos el título en "Editar pregunta"
            if (tituloModal) {
                tituloModal.textContent = 'Editar pregunta';
            }
        } else {
            // Modo creación
            modoEdicionPregunta = false;
            preguntaActualId = 'pregunta_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            // Inicializar array de opciones
            opcionesPregunta[preguntaActualId] = [];
            
            if (tituloModal) {
                tituloModal.textContent = 'Nueva pregunta';
            }
        }
        
        // Mostrar modal
        modalPregunta.style.display = 'flex';
    }
    
    /**
     * Cierra el modal de pregunta
     */
    function cerrarModalPregunta() {
        const modalPregunta = document.getElementById('modal-pregunta');
        if (modalPregunta) {
            modalPregunta.style.display = 'none';
        }
        
        // Limpiar estado
        modoEdicionPregunta = false;
        
        // No limpiamos preguntaActualId aquí para que pueda ser accedido por otras funciones
    }
    
    /**
     * Alterna la visibilidad de la sección de opciones según el tipo de pregunta
     */
    function toggleOpcionesPregunta() {
        const tipoPregunta = document.getElementById('tipo-pregunta').value;
        const seccionOpciones = document.getElementById('seccion-opciones');
        
        if (seccionOpciones) {
            if (tipoPregunta === 'opcion_multiple') {
                seccionOpciones.classList.remove('hidden');
            } else {
                seccionOpciones.classList.add('hidden');
            }
        }
    }
    
    /**
     * Agrega una opción de respuesta para pregunta de opción múltiple
     */
    function agregarOpcionRespuesta() {
        const listaOpciones = document.getElementById('lista-opciones');
        if (!listaOpciones) return;
        
        // Verificar límite de opciones
        if (listaOpciones.children.length >= 5) {
            if (window.gestorEncuestas && window.gestorEncuestas.mostrarAlerta) {
                window.gestorEncuestas.mostrarAlerta('No se pueden agregar más de 5 opciones', 'error');
            } else {
                alert('No se pueden agregar más de 5 opciones');
            }
            return;
        }
        
        // Crear nueva opción
        const nuevaOpcion = `Opción ${listaOpciones.children.length + 1}`;
        agregarOpcionRespuestaUI(nuevaOpcion);
    }
    
    /**
     * Agrega una opción de respuesta a la interfaz
     */
    function agregarOpcionRespuestaUI(textoOpcion) {
        const listaOpciones = document.getElementById('lista-opciones');
        if (!listaOpciones) return;
        
        const indice = listaOpciones.children.length;
        
        // Crear elemento de opción
        const opcionElement = document.createElement('div');
        opcionElement.className = 'opcion-respuesta';
        opcionElement.dataset.indice = indice;
        
        opcionElement.innerHTML = `
            <input type="text" value="${textoOpcion}" placeholder="Texto de la opción">
            <button type="button" class="btn-condicional-opcion" title="Agregar pregunta condicional">
                <i class="fas fa-question-circle"></i> Subpregunta
            </button>
            <button type="button" class="btn-eliminar-opcion">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        // Configurar evento de cambio de texto
        opcionElement.querySelector('input').addEventListener('input', (event) => {
            const indice = parseInt(opcionElement.dataset.indice);
            const valor = event.target.value.trim();
            
            // Actualizar el valor en el array de opciones
            if (indice < opcionesPregunta[preguntaActualId].length) {
                opcionesPregunta[preguntaActualId][indice] = valor;
            } else {
                opcionesPregunta[preguntaActualId].push(valor);
            }
        });
        
        // Configurar evento para agregar pregunta condicional
        opcionElement.querySelector('.btn-condicional-opcion').addEventListener('click', () => {
            const indice = parseInt(opcionElement.dataset.indice);
            
            // Llamar a la función del gestor de preguntas condicionales
            if (window.gestorPreguntasCondicionales && window.gestorPreguntasCondicionales.mostrarModalPreguntaCondicional) {
                window.gestorPreguntasCondicionales.mostrarModalPreguntaCondicional(preguntaActualId, indice);
            } else {
                console.error('El gestor de preguntas condicionales no está disponible');
                if (window.gestorEncuestas && window.gestorEncuestas.mostrarAlerta) {
                    window.gestorEncuestas.mostrarAlerta('La funcionalidad de preguntas condicionales no está disponible', 'error');
                }
            }
        });
        
        // Configurar evento de eliminación
        opcionElement.querySelector('.btn-eliminar-opcion').addEventListener('click', () => {
            eliminarOpcionRespuesta(opcionElement);
        });
        
        // Agregar al DOM
        listaOpciones.appendChild(opcionElement);
        
        // Agregar al array de opciones
        opcionesPregunta[preguntaActualId].push(textoOpcion);
    }
    
    /**
     * Elimina una opción de respuesta
     */
    function eliminarOpcionRespuesta(opcionElement) {
        const listaOpciones = document.getElementById('lista-opciones');
        if (!listaOpciones) return;
        
        // Verificar que haya al menos dos opciones
        if (listaOpciones.children.length <= 2) {
            if (window.gestorEncuestas && window.gestorEncuestas.mostrarAlerta) {
                window.gestorEncuestas.mostrarAlerta('Debe haber al menos 2 opciones de respuesta', 'error');
            } else {
                alert('Debe haber al menos 2 opciones de respuesta');
            }
            return;
        }
        
        // Obtener índice
        const indice = parseInt(opcionElement.dataset.indice);
        
        // Eliminar del array
        if (opcionesPregunta[preguntaActualId] && indice < opcionesPregunta[preguntaActualId].length) {
            opcionesPregunta[preguntaActualId].splice(indice, 1);
        }
        
        // Eliminar del DOM
        opcionElement.remove();
        
        // Actualizar índices
        Array.from(listaOpciones.children).forEach((elem, i) => {
            elem.dataset.indice = i;
        });
    }
    
    /**
     * Guarda la pregunta
     */
    function guardarPregunta(event) {
        event.preventDefault();
        
        // Obtener el módulo actual
        const moduloActualId = window.obtenerModuloActualId ? window.obtenerModuloActualId() : null;
        
        if (!moduloActualId) {
            if (window.gestorEncuestas && window.gestorEncuestas.mostrarAlerta) {
                window.gestorEncuestas.mostrarAlerta('No se ha seleccionado ningún módulo', 'error');
            } else {
                alert('No se ha seleccionado ningún módulo');
            }
            return;
        }
        
        // Obtener datos del formulario
        const textoPregunta = document.getElementById('texto-pregunta').value.trim();
        const tipoPregunta = document.getElementById('tipo-pregunta').value;
        const obligatoria = document.getElementById('obligatoria-pregunta').value === 'true';
        
        // Validar
        if (!textoPregunta) {
            if (window.gestorEncuestas && window.gestorEncuestas.mostrarAlerta) {
                window.gestorEncuestas.mostrarAlerta('El texto de la pregunta es obligatorio', 'error');
            } else {
                alert('El texto de la pregunta es obligatorio');
            }
            return;
        }
        
        // Validar opciones para preguntas de opción múltiple
        if (tipoPregunta === 'opcion_multiple') {
            const listaOpciones = document.getElementById('lista-opciones');
            
            if (!listaOpciones || listaOpciones.children.length < 2) {
                if (window.gestorEncuestas && window.gestorEncuestas.mostrarAlerta) {
                    window.gestorEncuestas.mostrarAlerta('Las preguntas de opción múltiple deben tener al menos 2 opciones', 'error');
                } else {
                    alert('Las preguntas de opción múltiple deben tener al menos 2 opciones');
                }
                return;
            }
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
            
            // Agregar preguntas condicionales si existen
            if (window.gestorPreguntasCondicionales && window.gestorPreguntasCondicionales.obtenerPreguntasCondicionales) {
                const preguntasCondicionalesData = window.gestorPreguntasCondicionales.obtenerPreguntasCondicionales(preguntaActualId);
                if (preguntasCondicionalesData) {
                    pregunta.preguntasCondicionales = preguntasCondicionalesData;
                }
            }
        }
        
        // Obtener módulos
        const modulos = window.obtenerModulos ? window.obtenerModulos() : [];
        
        // Encontrar el módulo actual
        const moduloIndex = modulos.findIndex(m => m.id === moduloActualId);
        
        if (moduloIndex !== -1) {
            // Inicializar array de preguntas si no existe
            if (!modulos[moduloIndex].preguntas) {
                modulos[moduloIndex].preguntas = [];
            }
            
            if (modoEdicionPregunta) {
                // Actualizar pregunta existente
                const preguntaIndex = modulos[moduloIndex].preguntas.findIndex(p => p.id === preguntaActualId);
                
                if (preguntaIndex !== -1) {
                    modulos[moduloIndex].preguntas[preguntaIndex] = pregunta;
                } else {
                    // La pregunta no existe, agregarla
                    modulos[moduloIndex].preguntas.push(pregunta);
                }
            } else {
                // Agregar nueva pregunta
                modulos[moduloIndex].preguntas.push(pregunta);
            }
            
            // En una implementación real, aquí actualizaríamos la visualización de las preguntas
            
            // Cerrar modal
            cerrarModalPregunta();
            
            // Mostrar mensaje de éxito
            if (window.gestorEncuestas && window.gestorEncuestas.mostrarAlerta) {
                window.gestorEncuestas.mostrarAlerta(
                    modoEdicionPregunta ? 'Pregunta actualizada correctamente' : 'Pregunta creada correctamente',
                    'success'
                );
            } else {
                alert(modoEdicionPregunta ? 'Pregunta actualizada correctamente' : 'Pregunta creada correctamente');
            }
            
            // Actualizar contenido del módulo para mostrar la nueva pregunta
            if (window.mostrarContenidoModulo) {
                const modulo = modulos[moduloIndex];
                window.mostrarContenidoModulo(modulo);
            }
        } else {
            if (window.gestorEncuestas && window.gestorEncuestas.mostrarAlerta) {
                window.gestorEncuestas.mostrarAlerta('No se encontró el módulo seleccionado', 'error');
            } else {
                alert('No se encontró el módulo seleccionado');
            }
        }
    }
    
    // Exportar funciones para uso en otros módulos
    window.gestorPreguntas = {
        inicializar: inicializarGestorPreguntas,
        mostrarModalPregunta: mostrarModalPregunta,
        cerrarModalPregunta: cerrarModalPregunta,
        toggleOpcionesPregunta: toggleOpcionesPregunta,
        agregarOpcionRespuesta: agregarOpcionRespuesta,
        obtenerPreguntaActualId: function() { return preguntaActualId; },
        obtenerOpcionesPregunta: function() { return opcionesPregunta; }
    };
    
    // Exponer variables para su uso en otros módulos
    window.preguntaActualId = preguntaActualId;
    window.opcionesPregunta = opcionesPregunta;
    
    // Inicializar cuando el DOM esté cargado
    document.addEventListener('DOMContentLoaded', inicializarGestorPreguntas);
})();
