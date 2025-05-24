/**
 * Integración de Preguntas Condicionales - JavaScript
 * Este script se encarga de integrar la funcionalidad de preguntas condicionales
 * con el sistema existente de creación de encuestas.
 */

// Evitar redeclaraciones usando un patrón de módulo autoejecutable
(function() {
    // Verificar si ya se ha cargado el script
    if (window.condicionalIntegratorLoaded) {
        console.log('Integrador de condicionales ya cargado anteriormente');
        return;
    }
    
    // Marcar como cargado
    window.condicionalIntegratorLoaded = true;

    /**
     * Inicializa la integración de preguntas condicionales
     */
    function inicializar() {
        console.log('Inicializando integración de preguntas condicionales...');
        
        // Inyectar modal de pregunta condicional en el DOM
        inyectarModalCondicional();
        
        // Cargar estilos CSS
        cargarEstilosCondicionales();
        
        // Configurar eventos
        configurarEventos();
    }
    
    /**
     * Inyecta el modal de pregunta condicional en el DOM
     */
    function inyectarModalCondicional() {
        // Cargar HTML del modal mediante fetch
        fetch('modal_pregunta_condicional.html')
            .then(response => response.text())
            .then(html => {
                // Crear elemento contenedor
                const div = document.createElement('div');
                div.innerHTML = html;
                
                // Añadir al final del body
                document.body.appendChild(div.firstElementChild);
                
                // Configurar eventos del modal
                configurarEventosModal();
            })
            .catch(error => {
                console.error('Error al cargar el modal de pregunta condicional:', error);
                // Alternativa: crear el modal manualmente si falla la carga
                crearModalManualmente();
            });
    }
    
    /**
     * Crea el modal manualmente en caso de que falle la carga del HTML
     */
    function crearModalManualmente() {
        const modalHTML = `
            <div id="modal-pregunta-condicional" class="modal">
                <div class="modal-contenido">
                    <span class="cerrar">&times;</span>
                    <h2>Configurar Pregunta Condicional</h2>
                    <form id="form-pregunta-condicional">
                        <div class="form-group">
                            <label for="texto-pregunta-condicional">Texto de la Pregunta Condicional:</label>
                            <input type="text" id="texto-pregunta-condicional" required placeholder="Ej: ¿Por qué elegiste esta opción?">
                        </div>
                        <div class="form-group">
                            <label for="tipo-pregunta-condicional">Tipo de Pregunta:</label>
                            <select id="tipo-pregunta-condicional">
                                <option value="abierta">Abierta (Texto libre)</option>
                                <option value="opcion_multiple">Opción Múltiple</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="obligatoria-pregunta-condicional">¿Es obligatoria?</label>
                            <select id="obligatoria-pregunta-condicional">
                                <option value="true">Sí</option>
                                <option value="false">No</option>
                            </select>
                        </div>

                        <!-- Sección para opciones múltiples -->
                        <div id="seccion-opciones-condicional" class="hidden">
                            <h3>Opciones de Respuesta <span class="texto-info">(Máximo 5)</span></h3>
                            <div id="lista-opciones-condicional">
                                <!-- Aquí se insertarán las opciones dinámicamente -->
                            </div>
                            <button type="button" id="btn-agregar-opcion-condicional" class="btn-agregar">
                                <i class="fas fa-plus"></i> Agregar Opción
                            </button>
                        </div>

                        <div class="acciones-pregunta">
                            <button type="submit" class="btn-guardar">
                                <i class="fas fa-save"></i> Guardar Pregunta Condicional
                            </button>
                            <button type="button" id="btn-cancelar-pregunta-condicional" class="btn-cancelar">
                                <i class="fas fa-times"></i> Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // Crear elemento contenedor
        const div = document.createElement('div');
        div.innerHTML = modalHTML;
        
        // Añadir al final del body
        document.body.appendChild(div.firstElementChild);
        
        // Configurar eventos del modal
        configurarEventosModal();
    }
    
    /**
     * Configura los eventos del modal de pregunta condicional
     */
    function configurarEventosModal() {
        // Obtener referencias
        const modal = document.getElementById('modal-pregunta-condicional');
        if (!modal) return;
        
        // Configurar botón cerrar
        const btnCerrar = modal.querySelector('.cerrar');
        const btnCancelar = modal.querySelector('#btn-cancelar-pregunta-condicional');
        
        if (btnCerrar) {
            btnCerrar.addEventListener('click', () => {
                PreguntasCondicionales.cerrarModalPreguntaCondicional();
            });
        }
        
        if (btnCancelar) {
            btnCancelar.addEventListener('click', () => {
                PreguntasCondicionales.cerrarModalPreguntaCondicional();
            });
        }
        
        // Configurar formulario
        const form = modal.querySelector('#form-pregunta-condicional');
        if (form) {
            form.addEventListener('submit', event => {
                PreguntasCondicionales.guardarPreguntaCondicional(event);
            });
        }
        
        // Configurar selector de tipo de pregunta
        const tipoSelect = modal.querySelector('#tipo-pregunta-condicional');
        if (tipoSelect) {
            tipoSelect.addEventListener('change', () => {
                toggleOpcionesCondicional();
            });
        }
        
        // Configurar botón agregar opción
        const btnAgregarOpcion = modal.querySelector('#btn-agregar-opcion-condicional');
        if (btnAgregarOpcion) {
            btnAgregarOpcion.addEventListener('click', () => {
                PreguntasCondicionales.agregarOpcionRespuestaCondicional();
            });
        }
    }
    
    /**
     * Muestra u oculta la sección de opciones según el tipo de pregunta condicional
     */
    function toggleOpcionesCondicional() {
        const tipoSelect = document.getElementById('tipo-pregunta-condicional');
        const seccionOpciones = document.getElementById('seccion-opciones-condicional');
        
        if (!tipoSelect || !seccionOpciones) return;
        
        if (tipoSelect.value === 'opcion_multiple') {
            seccionOpciones.classList.remove('hidden');
            
            // Agregar opciones iniciales si no hay ninguna
            const listaOpciones = document.getElementById('lista-opciones-condicional');
            if (listaOpciones && listaOpciones.children.length === 0) {
                PreguntasCondicionales.agregarOpcionRespuestaCondicional('');
                PreguntasCondicionales.agregarOpcionRespuestaCondicional('');
            }
        } else {
            seccionOpciones.classList.add('hidden');
        }
    }
    
    /**
     * Carga los estilos CSS para preguntas condicionales
     */
    function cargarEstilosCondicionales() {
        if (!document.querySelector('link[href*="preguntas_condicionales.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '../../../../css/admin/opciones_admin/crear_encuestas/preguntas_condicionales.css';
            document.head.appendChild(link);
        }
    }
    
    /**
     * Configura los eventos generales para la integración
     */
    function configurarEventos() {
        // Extender la función de crear opción para agregar botón de condicional
        extenderCreacionOpciones();
    }
    
    /**
     * Extiende la funcionalidad de creación de opciones para agregar botones de pregunta condicional
     */
    function extenderCreacionOpciones() {
        // Guardar referencia original a la función agregarOpcionRespuesta
        if (typeof window.agregarOpcionRespuestaOriginal !== 'function' && typeof window.agregarOpcionRespuesta === 'function') {
            window.agregarOpcionRespuestaOriginal = window.agregarOpcionRespuesta;
            
            // Sobrescribir con nuestra versión extendida
            window.agregarOpcionRespuesta = function(textoOpcion = '') {
                // Llamar a la función original
                window.agregarOpcionRespuestaOriginal(textoOpcion);
                
                // Obtener la opción recién creada
                const listaOpciones = document.getElementById('lista-opciones');
                if (!listaOpciones || !listaOpciones.lastElementChild) return;
                
                const nuevaOpcion = listaOpciones.lastElementChild;
                
                // Generar ID único para la opción si no tiene
                if (!nuevaOpcion.dataset.opcionId) {
                    nuevaOpcion.dataset.opcionId = 'opt_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
                }
                
                // Agregar botón para pregunta condicional
                agregarBotonCondicional(nuevaOpcion);
            };
        }
        
        // También modificar función existente para editar pregunta (si existe)
        if (typeof window.editarPreguntaOriginal !== 'function' && typeof window.editarPregunta === 'function') {
            window.editarPreguntaOriginal = window.editarPregunta;
            
            window.editarPregunta = function(preguntaId) {
                // Llamar a la función original
                window.editarPreguntaOriginal(preguntaId);
                
                // Después de cargar los datos, agregar botones condicionales a las opciones
                setTimeout(() => {
                    const listaOpciones = document.getElementById('lista-opciones');
                    if (!listaOpciones) return;
                    
                    Array.from(listaOpciones.children).forEach(opcion => {
                        // Generar ID único para la opción si no tiene
                        if (!opcion.dataset.opcionId) {
                            opcion.dataset.opcionId = 'opt_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
                        }
                        
                        // Agregar botón para pregunta condicional
                        agregarBotonCondicional(opcion);
                    });
                }, 100);
            };
        }
    }
    
    /**
     * Agrega un botón para crear pregunta condicional a una opción
     * @param {HTMLElement} opcionElement - Elemento DOM de la opción
     */
    function agregarBotonCondicional(opcionElement) {
        // Verificar si ya tiene botón
        if (opcionElement.querySelector('.btn-agregar-condicional')) return;
        
        // Crear botón
        const btnCondicional = document.createElement('button');
        btnCondicional.type = 'button';
        btnCondicional.className = 'btn-agregar-condicional';
        btnCondicional.innerHTML = '<i class="fas fa-level-down-alt"></i> Agregar subpregunta';
        btnCondicional.title = 'Agregar pregunta condicional para esta opción';
        
        // Agregar evento
        btnCondicional.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            
            // Obtener IDs
            const opcionId = opcionElement.dataset.opcionId;
            const preguntaId = document.getElementById('form-pregunta').dataset.preguntaId || 'pregunta_actual';
            
            // Mostrar modal
            PreguntasCondicionales.mostrarModalPreguntaCondicional(preguntaId, opcionId);
        });
        
        // Buscar el contenedor adecuado dentro de la opción
        const inputContainer = opcionElement.querySelector('.texto-opcion').parentNode;
        
        // Insertar después del input
        inputContainer.appendChild(btnCondicional);
    }
    
    /**
     * Función para modificar la estructura de datos de preguntas y incluir las condicionales
     * @param {Object} pregunta - Objeto de pregunta a modificar
     * @returns {Object} - Pregunta modificada con sus condicionales
     */
    function incluirCondicionales(pregunta) {
        // Si no es de opción múltiple, no tiene condicionales
        if (pregunta.tipo !== 'opcion_multiple' || !pregunta.opciones) {
            return pregunta;
        }
        
        // Buscar condicionales para esta pregunta
        const condicionales = PreguntasCondicionales.obtenerTodasPreguntasCondicionales();
        
        if (!condicionales[pregunta.id]) {
            return pregunta;
        }
        
        // Añadir preguntas condicionales a cada opción correspondiente
        pregunta.opciones.forEach(opcion => {
            if (condicionales[pregunta.id][opcion.id]) {
                opcion.preguntaCondicional = condicionales[pregunta.id][opcion.id];
            }
        });
        
        return pregunta;
    }
    
    // Exportar funciones a window para que sean accesibles desde otros scripts
    window.CondicionalIntegrator = {
        inicializar,
        incluirCondicionales
    };
    
    // Inicializar cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', inicializar);
    
})();
