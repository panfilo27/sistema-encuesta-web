/**
 * Módulo para gestionar las encuestas
 * Este archivo maneja la creación, actualización, eliminación y visualización de encuestas.
 */

/**
 * Crea una nueva encuesta en Firestore
 * @param {Object} encuesta - Datos de la encuesta a crear
 */
function crearNuevaEncuesta(encuesta) {
    firebase.firestore().collection('encuestas')
        .add(encuesta)
        .then(docRef => {
            mostrarCargando(false);
            mostrarAlerta('Encuesta creada correctamente', 'exito');
            console.log('Encuesta creada con ID:', docRef.id);
            
            // Ocultar panel de creación
            document.getElementById('panel-nueva-encuesta').classList.add('hidden');
            
            // Cargar encuestas existentes para mostrar la nueva
            cargarEncuestasExistentes();
        })
        .catch(error => {
            mostrarCargando(false);
            mostrarAlerta('Error al crear la encuesta: ' + error.message, 'error');
            console.error('Error al crear encuesta:', error);
        });
}

/**
 * Actualiza una encuesta existente en Firestore
 * @param {string} encuestaId - ID de la encuesta a actualizar
 * @param {Object} encuesta - Nuevos datos de la encuesta
 */
function actualizarEncuesta(encuestaId, encuesta) {
    firebase.firestore().collection('encuestas')
        .doc(encuestaId)
        .update({
            nombre: encuesta.nombre,
            descripcion: encuesta.descripcion,
            estado: encuesta.estado,
            modulos: encuesta.modulos,
            fechaActualizacion: new Date()
        })
        .then(() => {
            mostrarCargando(false);
            mostrarAlerta('Encuesta actualizada correctamente', 'exito');
            console.log('Encuesta actualizada con ID:', encuestaId);
            
            // Ocultar panel de creación
            document.getElementById('panel-nueva-encuesta').classList.add('hidden');
            
            // Cargar encuestas existentes para mostrar los cambios
            cargarEncuestasExistentes();
        })
        .catch(error => {
            mostrarCargando(false);
            mostrarAlerta('Error al actualizar la encuesta: ' + error.message, 'error');
            console.error('Error al actualizar encuesta:', error);
        });
}

/**
 * Elimina una encuesta de Firestore
 * @param {string} encuestaId - ID de la encuesta a eliminar
 */
function eliminarEncuesta(encuestaId) {
    if (confirm('¿Estás seguro de que deseas eliminar esta encuesta? Esta acción no se puede deshacer.')) {
        mostrarCargando(true);
        
        firebase.firestore().collection('encuestas')
            .doc(encuestaId)
            .delete()
            .then(() => {
                mostrarCargando(false);
                mostrarAlerta('Encuesta eliminada correctamente', 'exito');
                console.log('Encuesta eliminada con ID:', encuestaId);
                
                // Recargar lista de encuestas
                cargarEncuestasExistentes();
            })
            .catch(error => {
                mostrarCargando(false);
                mostrarAlerta('Error al eliminar la encuesta: ' + error.message, 'error');
                console.error('Error al eliminar encuesta:', error);
            });
    }
}

/**
 * Cambia el estado de una encuesta (borrador/activa)
 * @param {string} encuestaId - ID de la encuesta a cambiar
 * @param {string} nuevoEstado - Nuevo estado ('borrador' o 'activa')
 */
function cambiarEstadoEncuesta(encuestaId, nuevoEstado) {
    mostrarCargando(true);
    
    firebase.firestore().collection('encuestas')
        .doc(encuestaId)
        .update({
            estado: nuevoEstado,
            fechaActualizacion: new Date()
        })
        .then(() => {
            mostrarCargando(false);
            mostrarAlerta(`Encuesta ${nuevoEstado === 'activa' ? 'activada' : 'desactivada'} correctamente`, 'exito');
            console.log(`Encuesta ${encuestaId} cambió a estado: ${nuevoEstado}`);
            
            // Recargar lista de encuestas
            cargarEncuestasExistentes();
        })
        .catch(error => {
            mostrarCargando(false);
            mostrarAlerta('Error al cambiar el estado de la encuesta: ' + error.message, 'error');
            console.error('Error al cambiar estado de encuesta:', error);
        });
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
    mostrarCargando(true);
    
    // Obtener encuestas de Firestore
    firebase.firestore().collection('encuestas')
        .orderBy('fechaCreacion', 'desc')
        .get()
        .then(querySnapshot => {
            mostrarCargando(false);
            
            const cuerpoTabla = document.getElementById('cuerpo-tabla-encuestas');
            const mensajeNoEncuestas = document.getElementById('mensaje-no-encuestas');
            
            // Limpiar tabla
            cuerpoTabla.innerHTML = '';
            
            if (querySnapshot.empty) {
                // Mostrar mensaje si no hay encuestas
                mensajeNoEncuestas.classList.remove('hidden');
                return;
            }
            
            // Ocultar mensaje si hay encuestas
            mensajeNoEncuestas.classList.add('hidden');
            
            // Almacenar todas las encuestas para filtrado posterior
            window.todasLasEncuestas = [];
            
            // Mostrar encuestas en la tabla
            querySnapshot.forEach(doc => {
                const encuesta = doc.data();
                encuesta.id = doc.id;
                
                window.todasLasEncuestas.push(encuesta);
                agregarFilaEncuesta(encuesta);
            });
        })
        .catch(error => {
            mostrarCargando(false);
            mostrarAlerta('Error al cargar las encuestas: ' + error.message, 'error');
            console.error('Error al cargar encuestas:', error);
        });
}

/**
 * Agrega una fila a la tabla de encuestas
 * @param {Object} encuesta - Datos de la encuesta
 */
function agregarFilaEncuesta(encuesta) {
    const cuerpoTabla = document.getElementById('cuerpo-tabla-encuestas');
    const fila = document.createElement('tr');
    
    // Formatear fecha
    const fecha = encuesta.fechaCreacion ? new Date(encuesta.fechaCreacion.seconds * 1000) : new Date();
    const fechaFormateada = `${fecha.getDate()}/${fecha.getMonth() + 1}/${fecha.getFullYear()}`;
    
    // Crear contenido de la fila
    fila.innerHTML = `
        <td>${encuesta.nombre}</td>
        <td>${encuesta.modulos.length}</td>
        <td>
            <span class="estado-encuesta ${encuesta.estado}">
                ${encuesta.estado === 'activa' ? 'Activa' : 'Borrador'}
            </span>
        </td>
        <td>${fechaFormateada}</td>
        <td>
            <div class="acciones-tabla">
                <button class="btn-tabla btn-editar-tabla" title="Editar encuesta">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-tabla btn-eliminar-tabla" title="Eliminar encuesta">
                    <i class="fas fa-trash"></i>
                </button>
                ${encuesta.estado === 'borrador' ? 
                    `<button class="btn-tabla btn-activar-tabla" title="Activar encuesta">
                        <i class="fas fa-check-circle"></i>
                    </button>` : 
                    `<button class="btn-tabla btn-desactivar-tabla" title="Desactivar encuesta">
                        <i class="fas fa-times-circle"></i>
                    </button>`
                }
            </div>
        </td>
    `;
    
    // Configurar eventos para los botones
    fila.querySelector('.btn-editar-tabla').addEventListener('click', () => editarEncuesta(encuesta.id));
    fila.querySelector('.btn-eliminar-tabla').addEventListener('click', () => eliminarEncuesta(encuesta.id));
    
    if (encuesta.estado === 'borrador') {
        fila.querySelector('.btn-activar-tabla').addEventListener('click', () => cambiarEstadoEncuesta(encuesta.id, 'activa'));
    } else {
        fila.querySelector('.btn-desactivar-tabla').addEventListener('click', () => cambiarEstadoEncuesta(encuesta.id, 'borrador'));
    }
    
    // Agregar fila a la tabla
    cuerpoTabla.appendChild(fila);
}

/**
 * Edita una encuesta existente
 * @param {string} encuestaId - ID de la encuesta a editar
 */
function editarEncuesta(encuestaId) {
    mostrarCargando(true);
    
    firebase.firestore().collection('encuestas')
        .doc(encuestaId)
        .get()
        .then(doc => {
            mostrarCargando(false);
            
            if (doc.exists) {
                // Obtener datos de la encuesta
                const encuesta = doc.data();
                encuesta.id = doc.id;
                
                // Establecer variables globales
                encuestaActual = encuesta;
                modulosEncuesta = [...encuesta.modulos];
                modoEdicion = true;
                
                // Inicializar preguntasModulo con las preguntas de cada módulo
                preguntasModulo = {};
                modulosEncuesta.forEach(modulo => {
                    if (modulo.preguntas) {
                        preguntasModulo[modulo.id] = [...modulo.preguntas];
                    }
                });
                
                // Cargar datos en el formulario
                document.getElementById('nombre-encuesta').value = encuesta.nombre || '';
                document.getElementById('descripcion-encuesta').value = encuesta.descripcion || '';
                document.getElementById('estado-encuesta').value = encuesta.estado || 'borrador';
                
                // Renderizar módulos
                document.getElementById('lista-modulos').innerHTML = '';
                modulosEncuesta.forEach(modulo => renderizarModulo(modulo));
                
                // Actualizar botón de agregar módulo
                actualizarBotonAgregarModulo();
                
                // Ocultar panel de encuestas existentes
                document.getElementById('panel-ver-encuestas').classList.add('hidden');
                
                // Mostrar panel de edición
                document.getElementById('panel-nueva-encuesta').classList.remove('hidden');
            } else {
                mostrarAlerta('No se encontró la encuesta', 'error');
            }
        })
        .catch(error => {
            mostrarCargando(false);
            mostrarAlerta('Error al cargar la encuesta: ' + error.message, 'error');
            console.error('Error al cargar encuesta:', error);
        });
}

/**
 * Filtra las encuestas según los criterios seleccionados
 */
function filtrarEncuestas() {
    if (!window.todasLasEncuestas) return;
    
    const filtroEstado = document.getElementById('filtro-estado').value;
    const busqueda = document.getElementById('busqueda-encuesta').value.trim().toLowerCase();
    
    const encuestasFiltradas = window.todasLasEncuestas.filter(encuesta => {
        // Filtrar por estado
        if (filtroEstado !== 'todos' && encuesta.estado !== filtroEstado) {
            return false;
        }
        
        // Filtrar por texto de búsqueda
        if (busqueda && !encuesta.nombre.toLowerCase().includes(busqueda)) {
            return false;
        }
        
        return true;
    });
    
    // Limpiar tabla
    const cuerpoTabla = document.getElementById('cuerpo-tabla-encuestas');
    cuerpoTabla.innerHTML = '';
    
    const mensajeNoEncuestas = document.getElementById('mensaje-no-encuestas');
    
    if (encuestasFiltradas.length === 0) {
        // Mostrar mensaje si no hay encuestas
        mensajeNoEncuestas.classList.remove('hidden');
        mensajeNoEncuestas.textContent = 'No se encontraron encuestas con los filtros seleccionados.';
    } else {
        // Ocultar mensaje si hay encuestas
        mensajeNoEncuestas.classList.add('hidden');
        
        // Mostrar encuestas filtradas
        encuestasFiltradas.forEach(encuesta => {
            agregarFilaEncuesta(encuesta);
        });
    }
}
