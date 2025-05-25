/**
 * Gestor de Preguntas Condicionales
 * Gestiona la creación, edición y eliminación de preguntas condicionales que dependen de opciones específicas
 */

// Evitar redeclaraciones usando un patrón de módulo autoejecutable
(function() {
    // Variables globales
    let preguntasCondicionales = {}; // Formato: {preguntaId_opcionIndice: {datos de la pregunta}}
    let preguntaParentId = null;
    let opcionParentIndex = null;
    
    /**
     * Inicializa el gestor de preguntas condicionales
     */
    function inicializarGestorPreguntasCondicionales() {
        console.log('Inicializando gestor de preguntas condicionales...');
        
        // Verificar si existe el modal, si no, crearlo
        let modalPreguntaCondicional = document.getElementById('modal-pregunta-condicional');
        
        if (!modalPreguntaCondicional) {
            // Crear el modal para preguntas condicionales
            modalPreguntaCondicional = document.createElement('div');
            modalPreguntaCondicional.id = 'modal-pregunta-condicional';
            modalPreguntaCondicional.className = 'modal';
            
            modalPreguntaCondicional.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="titulo-pregunta-condicional">Pregunta condicional</h3>
                        <span class="cerrar-modal">&times;</span>
                    </div>
                    <div class="modal-body">
                        <form id="form-pregunta-condicional">
                            <div class="form-group">
                                <label for="texto-pregunta-condicional">Texto de la pregunta:</label>
                                <input type="text" id="texto-pregunta-condicional" required>
                            </div>
                            <div class="form-group">
                                <label for="tipo-pregunta-condicional">Tipo de pregunta:</label>
                                <select id="tipo-pregunta-condicional" onchange="window.gestorPreguntasCondicionales.toggleOpcionesCondicional()">
                                    <option value="abierta">Abierta (texto)</option>
                                    <option value="opcion_multiple">Opción múltiple</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="obligatoria-pregunta-condicional">Obligatoria:</label>
                                <select id="obligatoria-pregunta-condicional">
                                    <option value="true">Sí</option>
                                    <option value="false">No</option>
                                </select>
                            </div>
                            
                            <div id="seccion-opciones-condicional" class="hidden">
                                <h4>Opciones de respuesta</h4>
                                <div id="lista-opciones-condicional"></div>
                                <button type="button" class="btn-agregar-opcion" id="btn-agregar-opcion-condicional">
                                    <i class="fas fa-plus"></i> Agregar opción
                                </button>
                            </div>
                            
                            <div class="form-actions">
                                <button type="button" id="btn-cancelar-pregunta-condicional" class="btn-cancelar">Cancelar</button>
                                <button type="submit" id="btn-guardar-pregunta-condicional" class="btn-guardar">Guardar pregunta</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modalPreguntaCondicional);
            
            // Configurar eventos para el modal
            const cerrarModal = modalPreguntaCondicional.querySelector('.cerrar-modal');
            const btnCancelarPregunta = modalPreguntaCondicional.querySelector('#btn-cancelar-pregunta-condicional');
            const formPregunta = modalPreguntaCondicional.querySelector('#form-pregunta-condicional');
            const btnAgregarOpcion = modalPreguntaCondicional.querySelector('#btn-agregar-opcion-condicional');
            
            if (cerrarModal) {
                cerrarModal.addEventListener('click', cerrarModalPreguntaCondicional);
            }
            
            if (btnCancelarPregunta) {
                btnCancelarPregunta.addEventListener('click', cerrarModalPreguntaCondicional);
            }
            
            if (formPregunta) {
                formPregunta.addEventListener('submit', function(e) {
                    e.preventDefault();
                    guardarPreguntaCondicional();
                });
            }
            
            if (btnAgregarOpcion) {
                btnAgregarOpcion.addEventListener('click', agregarOpcionRespuestaCondicional);
            }
        }
    }
    
    /**
     * Muestra el modal para configurar una pregunta condicional
     * @param {string} preguntaId - ID de la pregunta principal
     * @param {number} opcionIndice - Índice de la opción a la que se asociará la pregunta condicional
     */
    function mostrarModalPreguntaCondicional(preguntaId, opcionIndice) {
        console.log(`Mostrando modal para pregunta ${preguntaId}, opción ${opcionIndice}`);
        
        // Guardar referencia a la pregunta y opción padre
        preguntaParentId = preguntaId;
        opcionParentIndex = opcionIndice;
        
        // Obtener texto de la opción para mostrar en el título
        const opcionesParent = window.opcionesPregunta || {};
        const opcionTexto = opcionesParent[preguntaId] && opcionesParent[preguntaId][opcionIndice] 
            ? opcionesParent[preguntaId][opcionIndice] 
            : `Opción ${opcionIndice + 1}`;
            
        const tituloModal = document.getElementById('titulo-pregunta-condicional');
        if (tituloModal) {
            tituloModal.textContent = `Pregunta condicional para: "${opcionTexto}"`;
        }
        
        // Resetear formulario
        const form = document.getElementById('form-pregunta-condicional');
        if (form) form.reset();
        
        // Limpiar opciones condicionales si existen
        const listaOpcionesCondicional = document.getElementById('lista-opciones-condicional');
        if (listaOpcionesCondicional) {
            listaOpcionesCondicional.innerHTML = '';
        }
        
        // Ocultar sección de opciones inicialmente
        const seccionOpcionesCondicional = document.getElementById('seccion-opciones-condicional');
        if (seccionOpcionesCondicional) {
            seccionOpcionesCondicional.classList.add('hidden');
        }
        
        // Cargar pregunta condicional si ya existe
        const preguntaCondicionalKey = `${preguntaId}_${opcionIndice}`;
        if (preguntasCondicionales[preguntaCondicionalKey]) {
            const preguntaCondicional = preguntasCondicionales[preguntaCondicionalKey];
            
            // Llenar campos
            document.getElementById('texto-pregunta-condicional').value = preguntaCondicional.texto || '';
            document.getElementById('tipo-pregunta-condicional').value = preguntaCondicional.tipo || 'abierta';
            document.getElementById('obligatoria-pregunta-condicional').value = preguntaCondicional.obligatoria ? 'true' : 'false';
            
            // Mostrar opciones si es de tipo opción múltiple
            if (preguntaCondicional.tipo === 'opcion_multiple') {
                seccionOpcionesCondicional.classList.remove('hidden');
                
                // Cargar opciones
                if (preguntaCondicional.opciones && preguntaCondicional.opciones.length > 0) {
                    preguntaCondicional.opciones.forEach(opcion => {
                        agregarOpcionRespuestaCondicionalUI(opcion);
                    });
                }
            }
        }
        
        // Mostrar modal
        document.getElementById('modal-pregunta-condicional').style.display = 'flex';
    }
    
    /**
     * Cierra el modal de pregunta condicional
     */
    function cerrarModalPreguntaCondicional() {
        document.getElementById('modal-pregunta-condicional').style.display = 'none';
        
        // Limpiar variables
        preguntaParentId = null;
        opcionParentIndex = null;
    }
    
    /**
     * Alterna la visibilidad de la sección de opciones múltiples según el tipo de pregunta seleccionado
     */
    function toggleOpcionesCondicional() {
        const tipoPregunta = document.getElementById('tipo-pregunta-condicional').value;
        const seccionOpciones = document.getElementById('seccion-opciones-condicional');
        
        if (seccionOpciones) {
            if (tipoPregunta === 'opcion_multiple') {
                seccionOpciones.classList.remove('hidden');
            } else {
                seccionOpciones.classList.add('hidden');
            }
        }
    }
    
    /**
     * Agrega una opción de respuesta para la pregunta condicional
     */
    function agregarOpcionRespuestaCondicional() {
        const listaOpciones = document.getElementById('lista-opciones-condicional');
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
        agregarOpcionRespuestaCondicionalUI(nuevaOpcion);
    }
    
    /**
     * Agrega una opción de respuesta a la interfaz de la pregunta condicional
     * @param {string} textoOpcion - Texto de la opción
     */
    function agregarOpcionRespuestaCondicionalUI(textoOpcion) {
        const listaOpciones = document.getElementById('lista-opciones-condicional');
        if (!listaOpciones) return;
        
        const indice = listaOpciones.children.length;
        
        // Crear elemento de opción
        const opcionElement = document.createElement('div');
        opcionElement.className = 'opcion-respuesta-condicional';
        opcionElement.dataset.indice = indice;
        
        opcionElement.innerHTML = `
            <input type="text" value="${textoOpcion}" placeholder="Texto de la opción">
            <button type="button" class="btn-eliminar-opcion-condicional">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        // Configurar evento de eliminación
        opcionElement.querySelector('.btn-eliminar-opcion-condicional').addEventListener('click', function() {
            opcionElement.remove();
            
            // Reordenar índices
            actualizarIndicesOpcionesCondicionales();
        });
        
        // Agregar al DOM
        listaOpciones.appendChild(opcionElement);
    }
    
    /**
     * Actualiza los índices de las opciones condicionales después de eliminar una
     */
    function actualizarIndicesOpcionesCondicionales() {
        const listaOpciones = document.getElementById('lista-opciones-condicional');
        if (!listaOpciones) return;
        
        Array.from(listaOpciones.children).forEach((opcion, indice) => {
            opcion.dataset.indice = indice;
        });
    }
    
    /**
     * Guarda la pregunta condicional configurada
     */
    function guardarPreguntaCondicional() {
        if (!preguntaParentId || opcionParentIndex === null) {
            console.error('No se ha configurado correctamente la pregunta o la opción padre');
            if (window.gestorEncuestas && window.gestorEncuestas.mostrarAlerta) {
                window.gestorEncuestas.mostrarAlerta('Error al configurar la pregunta condicional', 'error');
            }
            return false;
        }
        
        // Obtener datos del formulario
        const textoPregunta = document.getElementById('texto-pregunta-condicional').value.trim();
        const tipoPregunta = document.getElementById('tipo-pregunta-condicional').value;
        const obligatoria = document.getElementById('obligatoria-pregunta-condicional').value === 'true';
        
        // Validar
        if (!textoPregunta) {
            if (window.gestorEncuestas && window.gestorEncuestas.mostrarAlerta) {
                window.gestorEncuestas.mostrarAlerta('El texto de la pregunta es obligatorio', 'error');
            } else {
                alert('El texto de la pregunta es obligatorio');
            }
            return false;
        }
        
        // Crear objeto de pregunta condicional
        const preguntaCondicional = {
            texto: textoPregunta,
            tipo: tipoPregunta,
            obligatoria: obligatoria
        };
        
        // Agregar opciones si es pregunta de opción múltiple
        if (tipoPregunta === 'opcion_multiple') {
            const listaOpciones = document.getElementById('lista-opciones-condicional');
            const opciones = [];
            
            // Verificar que haya al menos 2 opciones
            if (listaOpciones.children.length < 2) {
                if (window.gestorEncuestas && window.gestorEncuestas.mostrarAlerta) {
                    window.gestorEncuestas.mostrarAlerta('Las preguntas de opción múltiple deben tener al menos 2 opciones', 'error');
                } else {
                    alert('Las preguntas de opción múltiple deben tener al menos 2 opciones');
                }
                return false;
            }
            
            // Recopilar opciones
            Array.from(listaOpciones.children).forEach(opcionElement => {
                const textoOpcion = opcionElement.querySelector('input').value.trim();
                if (textoOpcion) {
                    opciones.push(textoOpcion);
                }
            });
            
            preguntaCondicional.opciones = opciones;
        }
        
        // Guardar pregunta condicional
        const preguntaCondicionalKey = `${preguntaParentId}_${opcionParentIndex}`;
        preguntasCondicionales[preguntaCondicionalKey] = preguntaCondicional;
        
        // Actualizar indicador visual para mostrar que la opción tiene pregunta condicional
        actualizarIndicadorPreguntaCondicional(preguntaParentId, opcionParentIndex, true);
        
        // Cerrar modal
        cerrarModalPreguntaCondicional();
        
        // Mostrar mensaje de éxito
        if (window.gestorEncuestas && window.gestorEncuestas.mostrarAlerta) {
            window.gestorEncuestas.mostrarAlerta('Pregunta condicional guardada correctamente', 'success');
        } else {
            alert('Pregunta condicional guardada correctamente');
        }
        
        return true;
    }
    
    /**
     * Actualiza el indicador visual de pregunta condicional en una opción
     * @param {string} preguntaId - ID de la pregunta padre
     * @param {number} opcionIndice - Índice de la opción
     * @param {boolean} tieneCondicional - Indica si la opción tiene pregunta condicional
     */
    function actualizarIndicadorPreguntaCondicional(preguntaId, opcionIndice, tieneCondicional) {
        // Esta función se llamaría desde el contexto donde se están mostrando las opciones
        // de la pregunta principal. Aquí solo definimos la lógica.
        
        // Para implementación futura, podríamos agregar un indicador visual
        // por ejemplo, cambiar el color del botón de subpregunta
        const btnSubpreguntas = document.querySelectorAll('.opcion-respuesta');
        if (btnSubpreguntas && btnSubpreguntas[opcionIndice]) {
            const btnCondicional = btnSubpreguntas[opcionIndice].querySelector('.btn-condicional-opcion');
            if (btnCondicional) {
                if (tieneCondicional) {
                    btnCondicional.classList.add('btn-condicional-activo');
                } else {
                    btnCondicional.classList.remove('btn-condicional-activo');
                }
            }
        }
    }
    
    /**
     * Obtiene las preguntas condicionales para una pregunta
     * @param {string} preguntaId - ID de la pregunta
     * @returns {Object} Objeto con las preguntas condicionales por opción
     */
    function obtenerPreguntasCondicionales(preguntaId) {
        const preguntasDeEstaPregunta = {};
        
        // Filtrar preguntas condicionales que pertenecen a esta pregunta
        Object.keys(preguntasCondicionales).forEach(key => {
            if (key.startsWith(`${preguntaId}_`)) {
                const opcionIndice = parseInt(key.split('_')[1]);
                preguntasDeEstaPregunta[opcionIndice] = preguntasCondicionales[key];
            }
        });
        
        return Object.keys(preguntasDeEstaPregunta).length > 0 ? preguntasDeEstaPregunta : null;
    }
    
    // Exportar funciones para uso en otros módulos
    window.gestorPreguntasCondicionales = {
        inicializar: inicializarGestorPreguntasCondicionales,
        mostrarModalPreguntaCondicional: mostrarModalPreguntaCondicional,
        cerrarModalPreguntaCondicional: cerrarModalPreguntaCondicional,
        toggleOpcionesCondicional: toggleOpcionesCondicional,
        agregarOpcionRespuestaCondicional: agregarOpcionRespuestaCondicional,
        obtenerPreguntasCondicionales: obtenerPreguntasCondicionales
    };
    
    // Inicializar cuando el DOM esté cargado
    document.addEventListener('DOMContentLoaded', inicializarGestorPreguntasCondicionales);
})();
