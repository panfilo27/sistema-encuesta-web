/**
 * Creación de Encuestas - JavaScript (Versión arreglada)
 * Sistema completo para que los administradores puedan crear encuestas personalizadas
 */

// Evitar redeclaraciones usando un patrón de módulo autoejecutable
(function() {
    // Verificar si ya se ha cargado el script
    if (window.encuestasModuleLoaded) {
        console.log('Módulo de encuestas ya cargado anteriormente');
        return;
    }
    
    // Marcar como cargado
    window.encuestasModuleLoaded = true;

    // Variables globales
    let encuestaActual = null;
    let modulosEncuesta = [];
    let preguntasModulo = {};
    let opcionesPregunta = {};
    let subpreguntasOpciones = {}; // Para almacenar subpreguntas por opción
    let opcionesSubpregunta = {}; // Para almacenar opciones de subpreguntas
    let modoEdicion = false;
    let moduloActualId = null;
    let preguntaActualId = null;
    let opcionActualId = null; // ID de la opción que tendrá una subpregunta

    /**
     * Inicializa el creador de encuestas
     */
    function inicializarCreadorEncuestas() {
        console.log('Inicializando creador de encuestas correctamente...');
        
        // Ocultar inmediatamente el indicador de carga si está visible
        ocultarCargando();
        
        // Cargar CSS de subpreguntas
        if (!document.querySelector('link[href*="../../../../css/admin/opciones_admin/crear_encuestas/subpreguntas.css"]')) {
            const linkSubpreguntas = document.createElement('link');
            linkSubpreguntas.rel = 'stylesheet';
            linkSubpreguntas.href = '../../../../css/admin/opciones_admin/crear_encuestas/subpreguntas.css';
            document.head.appendChild(linkSubpreguntas);
        }
        
        // Cargar las carreras en el selector
        const selectorCarrera = document.getElementById('carrera-encuesta');
        if (selectorCarrera && typeof window.cargarCarrerasEnSelect === 'function') {
            window.cargarCarrerasEnSelect(selectorCarrera, true);
        } else {
            console.error('No se pudo cargar el selector de carreras o la función cargarCarrerasEnSelect no está disponible');
        }
        
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
        
        // Configurar eventos para subpreguntas (verificar que las funciones estén disponibles)
        if (typeof toggleOpcionesSubpregunta === 'function') {
            document.getElementById('tipo-subpregunta')?.addEventListener('change', toggleOpcionesSubpregunta);
            document.getElementById('btn-agregar-opcion-subpregunta')?.addEventListener('click', agregarOpcionSubpregunta);
            document.getElementById('btn-agregar-subpregunta')?.addEventListener('click', agregarSubpregunta);
            document.getElementById('opcion-condicional')?.addEventListener('change', seleccionarOpcionCondicional);
            console.log('Eventos de subpreguntas configurados correctamente');
        } else {
            console.warn('Las funciones de subpreguntas no están disponibles. Verifica que subpreguntas.js esté cargado.');
        }
        
        // Configurar el botón para agregar módulo
        document.getElementById('btn-agregar-modulo').addEventListener('click', mostrarModalModulo);
        
        // Configurar filtros de encuestas
        document.getElementById('filtro-estado').addEventListener('change', filtrarEncuestas);
        document.getElementById('busqueda-encuesta').addEventListener('input', filtrarEncuestas);
        document.getElementById('btn-buscar-encuesta').addEventListener('click', filtrarEncuestas);
        
        // Mostrar panel inicial
        document.getElementById('panel-ver-encuestas').classList.remove('hidden');
        
        // Mostrar mensaje inicial
        const mensajeNoEncuestas = document.getElementById('mensaje-no-encuestas');
        if (mensajeNoEncuestas) {
            mensajeNoEncuestas.classList.remove('hidden');
            mensajeNoEncuestas.textContent = 'No se encontraron encuestas. Crea una nueva encuesta para comenzar.';
        }
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
        
        // Mostrar indicador de carga
        const cargando = document.getElementById('cargando');
        if (cargando) {
            cargando.style.display = 'flex';
        }
        
        // Ocultar mensaje de no encuestas inicialmente
        const mensajeNoEncuestas = document.getElementById('mensaje-no-encuestas');
        if (mensajeNoEncuestas) {
            mensajeNoEncuestas.classList.add('hidden');
        }
        
        // Obtener referencia a la tabla
        const tablaEncuestas = document.getElementById('cuerpo-tabla-encuestas');
        if (tablaEncuestas) {
            tablaEncuestas.innerHTML = '';
        }
        
        try {
            // Verificar que firebase esté disponible
            if (!firebase || !firebase.firestore) {
                console.error("Firebase no está disponible");
                ocultarCargando();
                if (mensajeNoEncuestas) {
                    mensajeNoEncuestas.classList.remove('hidden');
                    mensajeNoEncuestas.textContent = 'Error: Firebase no está disponible';
                }
                return;
            }
            
            // Obtener encuestas desde Firestore
            firebase.firestore().collection('encuestascreadas')
                .get()
                .then((snapshot) => {
                    // Ocultar indicador de carga
                    ocultarCargando();
                    
                    // Verificar si hay encuestas
                    if (snapshot.empty) {
                        if (mensajeNoEncuestas) {
                            mensajeNoEncuestas.classList.remove('hidden');
                            mensajeNoEncuestas.textContent = 'No se encontraron encuestas. Crea una nueva encuesta para comenzar.';
                        }
                        return;
                    }
                    
                    // Mapeo de IDs de carrera a nombres (inicialmente vacío)
                    let mapeoCarreras = {
                        'todas': 'Todas las carreras (General)'
                    };
                    
                    // Ahora obtener los nombres de las carreras
                    if (typeof window.cargarCarreras === 'function') {
                        window.cargarCarreras()
                            .then(carreras => {
                                // Crear mapeo de ID a nombre
                                if (carreras && carreras.length > 0) {
                                    carreras.forEach(carrera => {
                                        mapeoCarreras[carrera.id] = carrera.nombre || `Carrera ${carrera.id}`;
                                    });
                                }
                                
                                // Mostrar las encuestas
                                mostrarEncuestasEnTabla(snapshot, mapeoCarreras, tablaEncuestas);
                            })
                            .catch(error => {
                                console.error("Error al cargar carreras:", error);
                                // Mostrar encuestas sin nombres de carrera
                                mostrarEncuestasEnTabla(snapshot, mapeoCarreras, tablaEncuestas);
                            });
                    } else {
                        // Mostrar encuestas sin nombres de carrera
                        mostrarEncuestasEnTabla(snapshot, mapeoCarreras, tablaEncuestas);
                    }
                })
                .catch((error) => {
                    console.error('Error al cargar encuestas:', error);
                    
                    // Ocultar indicador de carga
                    ocultarCargando();
                    
                    // Mostrar mensaje de error
                    if (mensajeNoEncuestas) {
                        mensajeNoEncuestas.classList.remove('hidden');
                        mensajeNoEncuestas.textContent = 'Error al cargar encuestas: ' + error.message;
                    }
                });
        } catch (error) {
            console.error("Error inesperado:", error);
            ocultarCargando();
            if (mensajeNoEncuestas) {
                mensajeNoEncuestas.classList.remove('hidden');
                mensajeNoEncuestas.textContent = 'Error inesperado al cargar encuestas';
            }
        }
    }
    
    /**
     * Muestra las encuestas en la tabla
     */
    function mostrarEncuestasEnTabla(snapshot, mapeoCarreras, tablaEncuestas) {
        if (!tablaEncuestas) return;
        
        snapshot.forEach((doc) => {
            const encuesta = doc.data();
            encuesta.id = doc.id;
            
            // Crear fila para la encuesta
            const tr = document.createElement('tr');
            
            // Nombre de la encuesta
            const tdNombre = document.createElement('td');
            tdNombre.textContent = encuesta.nombre || 'Sin nombre';
            tr.appendChild(tdNombre);
            
            // Número de módulos
            const tdModulos = document.createElement('td');
            tdModulos.textContent = encuesta.modulos ? encuesta.modulos.length : 0;
            tr.appendChild(tdModulos);
            
            // Estado de la encuesta
            const tdEstado = document.createElement('td');
            const estadoEncuesta = document.createElement('span');
            estadoEncuesta.className = `estado-encuesta ${encuesta.estado}`;
            estadoEncuesta.textContent = encuesta.estado === 'activa' ? 'Activa' : 'Borrador';
            tdEstado.appendChild(estadoEncuesta);
            tr.appendChild(tdEstado);
            
            // Carrera asignada
            const tdCarrera = document.createElement('td');
            const carreraId = encuesta.carrera || 'todas';
            tdCarrera.textContent = mapeoCarreras[carreraId] || 'Carrera desconocida';
            tr.appendChild(tdCarrera);
            
            // Fecha de creación
            const tdFecha = document.createElement('td');
            if (encuesta.fechaCreacion && encuesta.fechaCreacion.toDate) {
                const fecha = encuesta.fechaCreacion.toDate();
                tdFecha.textContent = fecha.toLocaleDateString();
            } else {
                tdFecha.textContent = 'Fecha desconocida';
            }
            tr.appendChild(tdFecha);
            
            // Acciones
            const tdAcciones = document.createElement('td');
            tdAcciones.className = 'acciones';
            
            // Botón editar
            const btnEditar = document.createElement('button');
            btnEditar.className = 'btn-accion editar';
            btnEditar.innerHTML = '<i class="fas fa-edit"></i>';
            btnEditar.title = 'Editar encuesta';
            btnEditar.addEventListener('click', () => editarEncuesta(encuesta.id));
            tdAcciones.appendChild(btnEditar);
            
            // Botón eliminar
            const btnEliminar = document.createElement('button');
            btnEliminar.className = 'btn-accion eliminar';
            btnEliminar.innerHTML = '<i class="fas fa-trash"></i>';
            btnEliminar.title = 'Eliminar encuesta';
            btnEliminar.addEventListener('click', () => eliminarEncuesta(encuesta.id));
            tdAcciones.appendChild(btnEliminar);
            
            tr.appendChild(tdAcciones);
            
            // Agregar fila a la tabla
            tablaEncuestas.appendChild(tr);
        });
    }

    /**
     * Oculta el indicador de carga de forma forzada
     */
    function ocultarCargando() {
        const cargando = document.getElementById('cargando');
        if (cargando) {
            cargando.style.display = 'none';
        }
    }

    /**
     * Funciones de gestión de encuestas, módulos y preguntas
     */
    function cancelarCreacionEncuesta() {
        if (confirm('¿Estás seguro de que deseas cancelar? Se perderán los cambios no guardados.')) {
            document.getElementById('panel-nueva-encuesta').classList.add('hidden');
            document.getElementById('panel-ver-encuestas').classList.remove('hidden');
        }
    }

    function guardarEncuesta(event) {
        event.preventDefault();
        
        // Validación básica
        if (modulosEncuesta.length === 0) {
            mostrarAlerta('Debes agregar al menos un módulo a la encuesta', 'error');
            return;
        }
        
        // Obtener datos del formulario
        const nombreEncuesta = document.getElementById('nombre-encuesta').value.trim();
        const descripcionEncuesta = document.getElementById('descripcion-encuesta').value.trim();
        const estadoEncuesta = document.getElementById('estado-encuesta').value;
        
        // Obtener múltiples carreras seleccionadas
        const selectCarreras = document.getElementById('carrera-encuesta');
        const carrerasSeleccionadas = Array.from(selectCarreras.selectedOptions).map(option => option.value);
        
        // Validar que se haya seleccionado al menos una carrera
        if (!carrerasSeleccionadas.length || carrerasSeleccionadas.includes('cargando')) {
            mostrarAlerta('Debes seleccionar al menos una carrera para la encuesta', 'error');
            return;
        }
        
        try {
            // Verificar que firebase esté disponible
            if (!firebase || !firebase.firestore) {
                mostrarAlerta('Firebase no está disponible. No se puede guardar la encuesta.', 'error');
                return;
            }
            
            // Mostrar indicador de carga
            const cargando = document.getElementById('cargando');
            if (cargando) {
                cargando.style.display = 'flex';
            }
            
            // Crear objeto de encuesta
            const nuevaEncuesta = {
                nombre: nombreEncuesta,
                descripcion: descripcionEncuesta,
                estado: estadoEncuesta,
                carreras: carrerasSeleccionadas,
                esGeneral: carrerasSeleccionadas.includes('todas'),
                fechaCreacion: new Date(),
                modulos: modulosEncuesta.map(modulo => ({
                    id: modulo.id,
                    nombre: modulo.nombre,
                    preguntas: modulo.preguntas.map(pregunta => {
                        const preguntaData = {
                            id: pregunta.id,
                            texto: pregunta.texto,
                            tipo: pregunta.tipo,
                            obligatoria: pregunta.obligatoria
                        };
                        
                        // Agregar opciones si es pregunta de opción múltiple
                        if (pregunta.tipo === 'opcion_multiple' && pregunta.opciones) {
                            preguntaData.opciones = pregunta.opciones;
                        }
                        
                        return preguntaData;
                    })
                }))
            };
            
            // Guardar en Firestore
            firebase.firestore().collection('encuestascreadas')
                .add(nuevaEncuesta)
                .then((docRef) => {
                    // Ocultar indicador de carga
                    ocultarCargando();
                    
                    mostrarAlerta(`Encuesta "${nombreEncuesta}" guardada correctamente`, 'exito');
                    document.getElementById('panel-nueva-encuesta').classList.add('hidden');
                    cargarEncuestasExistentes();
                })
                .catch((error) => {
                    // Ocultar indicador de carga
                    ocultarCargando();
                    
                    console.error('Error al guardar la encuesta:', error);
                    mostrarAlerta('Error al guardar la encuesta: ' + error.message, 'error');
                });
        } catch (error) {
            console.error("Error inesperado al guardar:", error);
            ocultarCargando();
            mostrarAlerta('Error inesperado al guardar la encuesta', 'error');
        }
    }

    /**
     * Funciones para módulos
     */
    function mostrarModalModulo() {
        // Implementación simplificada
        document.getElementById('form-modulo').reset();
        document.getElementById('lista-preguntas').innerHTML = '';
        
        moduloActualId = generarId();
        preguntasModulo[moduloActualId] = [];
        
        document.getElementById('modal-modulo').style.display = 'block';
    }

    function cerrarModalModulo() {
        document.getElementById('modal-modulo').style.display = 'none';
    }

    function guardarModulo(event) {
        event.preventDefault();
        
        // Implementación simplificada
        const nombreModulo = document.getElementById('nombre-modulo').value.trim();
        
        if (!nombreModulo) {
            mostrarAlerta('Debes ingresar un nombre para el módulo', 'error');
            return;
        }
        
        const nuevoModulo = {
            id: moduloActualId,
            nombre: nombreModulo,
            preguntas: preguntasModulo[moduloActualId] || []
        };
        
        modulosEncuesta.push(nuevoModulo);
        renderizarModulo(nuevoModulo);
        actualizarBotonAgregarModulo();
        
        document.getElementById('modal-modulo').style.display = 'none';
    }

    function renderizarModulo(modulo) {
        // Implementación simplificada
        const listaModulos = document.getElementById('lista-modulos');
        const template = document.getElementById('template-modulo');
        const moduloElement = template.content.cloneNode(true).querySelector('.modulo-encuesta');
        
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
        
        listaModulos.appendChild(moduloElement);
    }

    function editarModulo(moduloId) {
        // Implementación simplificada
        mostrarAlerta('Función de edición de módulo en desarrollo', 'info');
    }

    function eliminarModulo(moduloId) {
        // Implementación simplificada
        if (confirm('¿Estás seguro de que deseas eliminar este módulo?')) {
            modulosEncuesta = modulosEncuesta.filter(m => m.id !== moduloId);
            document.querySelector(`.modulo-encuesta[data-modulo-id="${moduloId}"]`).remove();
            actualizarBotonAgregarModulo();
        }
    }

    function actualizarBotonAgregarModulo() {
        const btnAgregarModulo = document.getElementById('btn-agregar-modulo');
        btnAgregarModulo.disabled = modulosEncuesta.length >= 5;
    }

    /**
     * Funciones para preguntas
     */
    function mostrarModalPregunta() {
        // Implementación simplificada
        document.getElementById('form-pregunta').reset();
        document.getElementById('seccion-opciones').classList.add('hidden');
        document.getElementById('lista-opciones').innerHTML = '';
        
        preguntaActualId = generarId();
        opcionesPregunta[preguntaActualId] = [];
        
        document.getElementById('modal-pregunta').style.display = 'block';
    }

    function cerrarModalPregunta() {
        document.getElementById('modal-pregunta').style.display = 'none';
    }

    function guardarPregunta(e) {
        e.preventDefault();
        
        const textoPregunta = document.getElementById('texto-pregunta').value.trim();
        const tipoPregunta = document.getElementById('tipo-pregunta').value;
        const obligatoria = document.getElementById('obligatoria-pregunta').value === 'true';
        
        if (!textoPregunta) {
            mostrarAlerta('Debes ingresar el texto de la pregunta', 'error');
            return;
        }
        
        // Obtener opciones si es de opción múltiple
        if (tipoPregunta === 'opcion_multiple') {
            const opcionesElements = document.getElementById('lista-opciones').children;
            
            if (opcionesElements.length === 0) {
                mostrarAlerta('Debes agregar al menos una opción para la pregunta', 'error');
                return;
            }
            
            // Limpiar opciones anteriores
            opcionesPregunta[preguntaActualId] = [];
            
            // Recopilar opciones
            Array.from(opcionesElements).forEach(opcionElement => {
                const textoOpcion = opcionElement.querySelector('.texto-opcion').value.trim();
                const opcionId = opcionElement.dataset.opcionId;
                
                if (textoOpcion) {
                    // Crear objeto de opción
                    const opcion = {
                        id: opcionId,
                        texto: textoOpcion
                    };
                    
                    // Si hay una subpregunta asociada a esta opción, añadir referencia
                    if (subpreguntasOpciones[opcionId]) {
                        opcion.tieneSubpregunta = true;
                        opcion.subpreguntaId = subpreguntasOpciones[opcionId].id;
                    }
                    
                    opcionesPregunta[preguntaActualId].push(opcion);
                }
            });
            
            // Verificar que haya al menos 2 opciones
            if (opcionesPregunta[preguntaActualId].length < 2) {
                mostrarAlerta('Debes agregar al menos 2 opciones de respuesta', 'error');
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
        if (tipoPregunta === 'opcion_multiple' && opcionesPregunta[preguntaActualId]) {
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
        
        // Agregar pregunta a la lista del módulo
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
        
        // Mostrar mensaje de éxito
        mostrarAlerta('Pregunta agregada correctamente', 'exito');
    }

    function renderizarPregunta(pregunta, numero) {
        // Obtener el contenedor de preguntas
        const listaPreguntas = document.getElementById('lista-preguntas');
        if (!listaPreguntas) return;
        
        // Clonar template
        const template = document.getElementById('template-pregunta');
        if (!template) {
            console.error('Template de pregunta no encontrado');
            return;
        }
        
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

    function toggleOpcionesPregunta() {
        // Implementación simplificada
        const tipoPregunta = document.getElementById('tipo-pregunta').value;
        const seccionOpciones = document.getElementById('seccion-opciones');
        
        if (tipoPregunta === 'opcion_multiple') {
            seccionOpciones.classList.remove('hidden');
        } else {
            seccionOpciones.classList.add('hidden');
        }
    }

    function agregarOpcionRespuesta() {
        // Verificar si ya se alcanzó el límite de opciones
        const listaOpciones = document.getElementById('lista-opciones');
        if (!listaOpciones) return;
        
        const numOpciones = listaOpciones.children.length;
        if (numOpciones >= 5) {
            mostrarAlerta('No se pueden agregar más de 5 opciones de respuesta', 'error');
            return;
        }
        
        // Inicializar array de opciones si no existe
        if (!opcionesPregunta[preguntaActualId]) {
            opcionesPregunta[preguntaActualId] = [];
        }
        
        // Crear nueva opción
        const nuevaOpcion = `Opción ${numOpciones + 1}`;
        
        // Crear elemento de opción
        const opcionElement = document.createElement('div');
        opcionElement.className = 'opcion-respuesta';
        opcionElement.dataset.indice = numOpciones;
        
        opcionElement.innerHTML = `
            <input type="text" value="${nuevaOpcion}" placeholder="Texto de la opción">
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
        
        // Configurar evento de eliminación
        opcionElement.querySelector('.btn-eliminar-opcion').addEventListener('click', () => {
            eliminarOpcionRespuesta(opcionElement);
        });
        
        // Agregar al DOM
        listaOpciones.appendChild(opcionElement);
        
        // Agregar al array de opciones
        opcionesPregunta[preguntaActualId].push(nuevaOpcion);
    }

    /**
     * Elimina una opción de respuesta de una pregunta de opción múltiple
     * @param {HTMLElement} opcionElement - Elemento DOM de la opción a eliminar
     */
    function eliminarOpcionRespuesta(opcionElement) {
        const listaOpciones = document.getElementById('lista-opciones');
        if (!listaOpciones) return;
        
        const numOpciones = listaOpciones.children.length;
        
        // Verificar que haya al menos dos opciones
        if (numOpciones <= 2) {
            mostrarAlerta('Debe haber al menos 2 opciones de respuesta', 'error');
            return;
        }
        
        // Obtener el índice de la opción a eliminar
        const indice = parseInt(opcionElement.dataset.indice);
        
        // Eliminar opción del array
        if (opcionesPregunta[preguntaActualId] && indice < opcionesPregunta[preguntaActualId].length) {
            opcionesPregunta[preguntaActualId].splice(indice, 1);
        }
        
        // Eliminar elemento del DOM
        opcionElement.remove();
        
        // Actualizar índices de las opciones restantes
        const opcionesRestantes = listaOpciones.querySelectorAll('.opcion-respuesta');
        opcionesRestantes.forEach((elem, i) => {
            elem.dataset.indice = i;
        });
    }
    
    /**
     * Edita una pregunta existente
     * @param {string} moduloId - ID del módulo que contiene la pregunta
     * @param {string} preguntaId - ID de la pregunta a editar
     */
    function editarPregunta(moduloId, preguntaId) {
        // Verificar que exista el módulo y la pregunta
        if (!preguntasModulo[moduloId]) {
            mostrarAlerta('No se encontró el módulo', 'error');
            return;
        }
        
        const pregunta = preguntasModulo[moduloId].find(p => p.id === preguntaId);
        if (!pregunta) {
            mostrarAlerta('No se encontró la pregunta', 'error');
            return;
        }
        
        // Establecer variables globales
        moduloActualId = moduloId;
        preguntaActualId = preguntaId;
        modoEdicion = true;
        
        // Cargar datos en el formulario
        document.getElementById('texto-pregunta').value = pregunta.texto || '';
        document.getElementById('tipo-pregunta').value = pregunta.tipo || 'abierta';
        document.getElementById('obligatoria-pregunta').value = pregunta.obligatoria ? 'true' : 'false';
        
        // Manejar opciones si es pregunta de opción múltiple
        document.getElementById('lista-opciones').innerHTML = '';
        if (pregunta.tipo === 'opcion_multiple' && pregunta.opciones) {
            // Mostrar sección de opciones
            document.getElementById('seccion-opciones').classList.remove('hidden');
            
            // Guardar opciones en el objeto global
            opcionesPregunta[preguntaId] = [...pregunta.opciones];
            
            // Crear elementos para cada opción
            pregunta.opciones.forEach((opcion, indice) => {
                const opcionElement = document.createElement('div');
                opcionElement.className = 'opcion-respuesta';
                opcionElement.dataset.indice = indice;
                
                opcionElement.innerHTML = `
                    <input type="text" value="${opcion}" placeholder="Texto de la opción">
                    <button type="button" class="btn-eliminar-opcion">
                        <i class="fas fa-trash"></i>
                    </button>
                `;
                
                // Configurar evento de cambio de texto
                opcionElement.querySelector('input').addEventListener('input', (event) => {
                    opcionesPregunta[preguntaId][indice] = event.target.value.trim();
                });
                
                // Configurar evento de eliminación
                opcionElement.querySelector('.btn-eliminar-opcion').addEventListener('click', () => {
                    eliminarOpcionRespuesta(opcionElement);
                });
                
                // Agregar al DOM
                document.getElementById('lista-opciones').appendChild(opcionElement);
            });
        } else {
            // Ocultar sección de opciones si no es de opción múltiple
            document.getElementById('seccion-opciones').classList.add('hidden');
        }
        
        // Mostrar modal
        document.getElementById('modal-pregunta').style.display = 'block';
    }
    
    /**
     * Elimina una pregunta
     * @param {string} moduloId - ID del módulo que contiene la pregunta
     * @param {string} preguntaId - ID de la pregunta a eliminar
     */
    function eliminarPregunta(moduloId, preguntaId) {
        if (confirm('¿Estás seguro de que deseas eliminar esta pregunta?')) {
            // Verificar que exista el módulo y la pregunta
            if (!preguntasModulo[moduloId]) {
                mostrarAlerta('No se encontró el módulo', 'error');
                return;
            }
            
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
            
            mostrarAlerta('Pregunta eliminada correctamente', 'exito');
        }
    }

    /**
     * Funciones para la gestión de encuestas
     */
    function editarEncuesta(encuestaId) {
        // Implementación simplificada
        mostrarAlerta('Función de edición de encuesta en desarrollo', 'info');
    }

    function eliminarEncuesta(encuestaId) {
        // Implementación simplificada
        if (confirm('¿Estás seguro de que deseas eliminar esta encuesta?')) {
            try {
                firebase.firestore().collection('encuestascreadas').doc(encuestaId)
                    .delete()
                    .then(() => {
                        mostrarAlerta('Encuesta eliminada correctamente', 'exito');
                        cargarEncuestasExistentes();
                    })
                    .catch((error) => {
                        console.error('Error al eliminar la encuesta:', error);
                        mostrarAlerta('Error al eliminar la encuesta: ' + error.message, 'error');
                    });
            } catch (error) {
                console.error("Error inesperado al eliminar:", error);
                mostrarAlerta('Error inesperado al eliminar la encuesta', 'error');
            }
        }
    }

    function filtrarEncuestas() {
        // Implementación simplificada
        console.log('Filtrando encuestas...');
    }

    /**
     * Funciones utilitarias
     */
    function generarId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

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

    // Exportar funciones para uso externo
    window.inicializarCreadorEncuestas = inicializarCreadorEncuestas;
})();
