/**
 * Funciones para actualizar visualización - JavaScript
 * Este script contiene funciones para actualizar la visualización de preguntas y preguntas condicionales
 */

// Evitar redeclaraciones
if (typeof window.visualizacionCargada === 'undefined') {
    window.visualizacionCargada = true;

    /**
     * Actualiza la visualización de todas las preguntas en el módulo actual
     */
    function actualizarVisualizacionPreguntas() {
        // Limpiar lista de preguntas
        const listaPreguntas = document.getElementById('lista-preguntas');
        if (!listaPreguntas) return;
        
        listaPreguntas.innerHTML = '';
        
        // Verificar si hay preguntas para este módulo
        if (!preguntasModulo[moduloActualId] || preguntasModulo[moduloActualId].length === 0) {
            listaPreguntas.innerHTML = '<p class="sin-preguntas">No hay preguntas en este módulo. Agrega preguntas usando el botón de abajo.</p>';
            return;
        }
        
        // Renderizar cada pregunta
        preguntasModulo[moduloActualId].forEach((pregunta, index) => {
            renderizarPregunta(pregunta, index + 1);
        });
    }

    /**
     * Renderiza una pregunta en la lista de preguntas
     * @param {Object} pregunta - Objeto de pregunta a renderizar
     * @param {number} numero - Número de pregunta (para mostrar en UI)
     */
    function renderizarPregunta(pregunta, numero) {
        // Obtener el contenedor de preguntas
        const listaPreguntas = document.getElementById('lista-preguntas');
        if (!listaPreguntas) return;
        
        // Clonar template
        const template = document.getElementById('template-pregunta');
        if (!template) {
            console.error('No se encontró el template de pregunta');
            return;
        }
        
        const preguntaElement = template.content.cloneNode(true).firstElementChild;
        
        // Configurar pregunta
        preguntaElement.dataset.preguntaId = pregunta.id;
        preguntaElement.querySelector('.numero-pregunta').textContent = numero;
        
        // Configurar texto y detalles
        const textoPregunta = preguntaElement.querySelector('.texto-pregunta');
        if (textoPregunta) textoPregunta.textContent = pregunta.texto;
        
        const tipoPregunta = preguntaElement.querySelector('.tipo-pregunta');
        if (tipoPregunta) {
            tipoPregunta.textContent = pregunta.tipo === 'abierta' ? 'Respuesta abierta' : 'Opción múltiple';
        }
        
        const estadoPregunta = preguntaElement.querySelector('.estado-pregunta');
        if (estadoPregunta) {
            estadoPregunta.textContent = pregunta.obligatoria ? 'Obligatoria' : 'Opcional';
        }
        
        // Mostrar indicador de preguntas condicionales si las tiene
        if (pregunta.tipo === 'opcion_multiple' && pregunta.opciones) {
            let tieneCondicionales = false;
            
            // Verificar si alguna opción tiene pregunta condicional
            pregunta.opciones.forEach(opcion => {
                if (opcion.preguntaCondicional) {
                    tieneCondicionales = true;
                }
            });
            
            // Si tiene condicionales, agregar un indicador
            if (tieneCondicionales) {
                const indicadorCondicional = document.createElement('div');
                indicadorCondicional.className = 'indicador-condicional-pregunta';
                indicadorCondicional.innerHTML = '<i class="fas fa-level-down-alt"></i> Tiene preguntas condicionales';
                preguntaElement.querySelector('.contenido-pregunta').appendChild(indicadorCondicional);
            }
        }
        
        // Configurar botones de acción
        const btnEditar = preguntaElement.querySelector('.btn-editar-pregunta');
        if (btnEditar) {
            btnEditar.addEventListener('click', () => editarPregunta(pregunta.id));
        }
        
        const btnEliminar = preguntaElement.querySelector('.btn-eliminar-pregunta');
        if (btnEliminar) {
            btnEliminar.addEventListener('click', () => eliminarPregunta(pregunta.id));
        }
        
        // Agregar a la lista
        listaPreguntas.appendChild(preguntaElement);
    }

    /**
     * Función para editar una pregunta existente
     * @param {string} preguntaId - ID de la pregunta a editar
     */
    function editarPregunta(preguntaId) {
        // Buscar la pregunta en el módulo actual
        const pregunta = preguntasModulo[moduloActualId]?.find(p => p.id === preguntaId);
        if (!pregunta) {
            mostrarAlerta('No se encontró la pregunta especificada', 'error');
            return;
        }
        
        // Activar modo edición
        modoEdicion = true;
        preguntaActualId = preguntaId;
        
        // Cargar datos en el modal
        const formPregunta = document.getElementById('form-pregunta');
        formPregunta.dataset.preguntaId = preguntaId;
        
        document.getElementById('texto-pregunta').value = pregunta.texto;
        document.getElementById('tipo-pregunta').value = pregunta.tipo;
        document.getElementById('obligatoria-pregunta').value = pregunta.obligatoria.toString();
        
        // Si es opción múltiple, cargar opciones
        if (pregunta.tipo === 'opcion_multiple' && pregunta.opciones) {
            // Limpiar lista de opciones
            const listaOpciones = document.getElementById('lista-opciones');
            listaOpciones.innerHTML = '';
            
            // Mostrar sección de opciones
            document.getElementById('seccion-opciones').classList.remove('hidden');
            
            // Agregar cada opción
            pregunta.opciones.forEach(opcion => {
                // Crear elemento de opción
                const divOpcion = document.createElement('div');
                divOpcion.className = 'opcion-respuesta';
                divOpcion.dataset.opcionId = opcion.id;
                
                divOpcion.innerHTML = `
                    <input type="text" class="texto-opcion" value="${opcion.texto}" placeholder="Texto de la opción">
                    <button type="button" class="btn-eliminar-opcion">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                
                // Agregar evento para eliminar opción
                divOpcion.querySelector('.btn-eliminar-opcion').addEventListener('click', function() {
                    divOpcion.remove();
                });
                
                // Si tiene pregunta condicional, agregar indicador
                if (opcion.preguntaCondicional) {
                    const indicador = document.createElement('span');
                    indicador.className = 'indicador-condicional';
                    indicador.innerHTML = '<i class="fas fa-level-down-alt"></i>';
                    indicador.title = 'Esta opción tiene una pregunta condicional';
                    divOpcion.appendChild(indicador);
                }
                
                // Agregar a la lista
                listaOpciones.appendChild(divOpcion);
                
                // Si window.CondicionalIntegrator existe, agregar botón condicional
                if (window.CondicionalIntegrator) {
                    setTimeout(() => {
                        // Agregar botón para pregunta condicional
                        const btnCondicional = document.createElement('button');
                        btnCondicional.type = 'button';
                        btnCondicional.className = 'btn-agregar-condicional';
                        btnCondicional.innerHTML = '<i class="fas fa-level-down-alt"></i> Agregar subpregunta';
                        btnCondicional.title = 'Agregar pregunta condicional para esta opción';
                        
                        // Agregar evento
                        btnCondicional.addEventListener('click', function(event) {
                            event.preventDefault();
                            event.stopPropagation();
                            
                            // Mostrar modal
                            PreguntasCondicionales.mostrarModalPreguntaCondicional(preguntaId, opcion.id);
                        });
                        
                        // Buscar el contenedor adecuado dentro de la opción
                        const inputContainer = divOpcion.querySelector('.texto-opcion').parentNode;
                        
                        // Insertar después del input
                        inputContainer.appendChild(btnCondicional);
                    }, 100);
                }
            });
        } else {
            // Si no es opción múltiple, ocultar sección de opciones
            document.getElementById('seccion-opciones').classList.add('hidden');
        }
        
        // Mostrar modal
        document.getElementById('modal-pregunta').style.display = 'block';
    }

    // Exportar funciones a window para que sean accesibles desde otros scripts
    window.actualizarVisualizacionPreguntas = actualizarVisualizacionPreguntas;
    window.renderizarPregunta = renderizarPregunta;
    window.editarPregunta = editarPregunta;
}
