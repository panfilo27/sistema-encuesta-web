/**
 * Gestor de Encuestas
 * Archivo principal para gestionar la creación y edición de encuestas
 */

// Evitar redeclaraciones usando un patrón de módulo autoejecutable
(function() {
    // Variables globales
    let encuestaActual = null;
    let modoEdicion = false;
    
    // Referencias a elementos del DOM
    const formEncuesta = document.getElementById('form-encuesta');
    const btnCancelarEncuesta = document.getElementById('btn-cancelar-encuesta');
    const btnGuardarEncuesta = document.getElementById('btn-guardar-encuesta');
    const tablaEncuestas = document.getElementById('tabla-encuestas');
    const listaEncuestas = document.getElementById('lista-encuestas');
    const inputBuscarEncuesta = document.getElementById('buscar-encuesta');
    const selectFiltroCarrera = document.getElementById('filtro-carrera');
    
    /**
     * Inicializa el gestor de encuestas
     */
    function inicializarGestorEncuestas() {
        console.log('Inicializando gestor de encuestas...');
        
        // Cargar encuestas existentes
        cargarEncuestasExistentes();
        
        // Configurar eventos
        if (formEncuesta) {
            formEncuesta.addEventListener('submit', guardarEncuesta);
        }
        
        if (btnCancelarEncuesta) {
            btnCancelarEncuesta.addEventListener('click', cancelarCreacionEncuesta);
        }
        
        if (inputBuscarEncuesta) {
            inputBuscarEncuesta.addEventListener('input', filtrarEncuestas);
        }
        
        if (selectFiltroCarrera) {
            selectFiltroCarrera.addEventListener('change', filtrarEncuestas);
        }
        
        // Ocultar el indicador de carga
        ocultarCargando();
    }
    
    /**
     * Carga las encuestas existentes desde Firestore
     */
    function cargarEncuestasExistentes() {
        mostrarCargando();
        
        // Limpiar la lista de encuestas
        if (listaEncuestas) {
            listaEncuestas.innerHTML = '';
        }
        
        // Referencia a la colección de encuestas en Firestore
        const encuestasRef = firebase.firestore().collection('encuestascreadas');
        
        // Obtener todas las encuestas
        encuestasRef.get()
            .then((snapshot) => {
                if (snapshot.empty) {
                    listaEncuestas.innerHTML = '<tr><td colspan="4">No hay encuestas disponibles</td></tr>';
                    ocultarCargando();
                    return;
                }
                
                // Cargar carreras para mostrar nombres en lugar de IDs
                const carrerasRef = firebase.firestore().collection('carreras');
                carrerasRef.get()
                    .then((carrerasSnapshot) => {
                        const mapeoCarreras = {};
                        carrerasSnapshot.forEach((doc) => {
                            const carrera = doc.data();
                            mapeoCarreras[doc.id] = carrera.nombre;
                        });
                        
                        // Mostrar encuestas en la tabla
                        mostrarEncuestasEnTabla(snapshot, mapeoCarreras);
                        ocultarCargando();
                    })
                    .catch((error) => {
                        console.error('Error al obtener carreras:', error);
                        mostrarAlerta('Error al cargar las carreras', 'error');
                        ocultarCargando();
                    });
            })
            .catch((error) => {
                console.error('Error al obtener encuestas:', error);
                mostrarAlerta('Error al cargar las encuestas', 'error');
                ocultarCargando();
            });
    }
    
    /**
     * Muestra las encuestas en la tabla
     */
    function mostrarEncuestasEnTabla(snapshot, mapeoCarreras) {
        listaEncuestas.innerHTML = '';
        
        snapshot.forEach((doc) => {
            const encuesta = doc.data();
            encuesta.id = doc.id;
            
            // Crear fila para la encuesta
            const tr = document.createElement('tr');
            
            // Formatear fecha
            const fecha = encuesta.fechaCreacion ? new Date(encuesta.fechaCreacion.seconds * 1000) : new Date();
            const fechaFormateada = fecha.toLocaleDateString('es-MX');
            
            // Nombre de la carrera
            const nombreCarrera = mapeoCarreras[encuesta.carreraId] || 'Carrera no especificada';
            
            tr.innerHTML = `
                <td>${encuesta.nombre}</td>
                <td>${nombreCarrera}</td>
                <td>${fechaFormateada}</td>
                <td>
                    <div class="acciones-encuesta">
                        <button type="button" class="btn-accion btn-editar" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn-accion btn-eliminar" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            // Configurar eventos para los botones
            const btnEditar = tr.querySelector('.btn-editar');
            const btnEliminar = tr.querySelector('.btn-eliminar');
            
            if (btnEditar) {
                btnEditar.addEventListener('click', () => editarEncuesta(encuesta.id));
            }
            
            if (btnEliminar) {
                btnEliminar.addEventListener('click', () => eliminarEncuesta(encuesta.id));
            }
            
            listaEncuestas.appendChild(tr);
        });
    }
    
    /**
     * Filtra las encuestas según los criterios de búsqueda
     */
    function filtrarEncuestas() {
        const textoBusqueda = inputBuscarEncuesta.value.toLowerCase();
        const carreraFiltro = selectFiltroCarrera.value;
        
        const filas = listaEncuestas.querySelectorAll('tr');
        
        filas.forEach((fila) => {
            const nombre = fila.cells[0].textContent.toLowerCase();
            const carrera = fila.cells[1].textContent.toLowerCase();
            
            const coincideTexto = nombre.includes(textoBusqueda);
            const coincideCarrera = !carreraFiltro || carrera === carreraFiltro.toLowerCase();
            
            fila.style.display = (coincideTexto && coincideCarrera) ? '' : 'none';
        });
    }
    
    /**
     * Guarda la encuesta en Firestore
     */
    function guardarEncuesta(event) {
        event.preventDefault();
        
        // Validar formulario
        const nombreEncuesta = document.getElementById('nombre-encuesta').value.trim();
        const descripcionEncuesta = document.getElementById('descripcion-encuesta').value.trim();
        const carreraEncuesta = document.getElementById('carrera-encuesta').value;
        
        if (!nombreEncuesta) {
            mostrarAlerta('Debes ingresar un nombre para la encuesta', 'error');
            return;
        }
        
        if (!carreraEncuesta) {
            mostrarAlerta('Debes seleccionar una carrera', 'error');
            return;
        }
        
        // Verificar que haya al menos un módulo
        if (!window.obtenerModulos || window.obtenerModulos().length === 0) {
            mostrarAlerta('Debes crear al menos un módulo para la encuesta', 'error');
            return;
        }
        
        // Mostrar indicador de carga
        mostrarCargando();
        
        // Crear objeto de encuesta
        const encuesta = {
            nombre: nombreEncuesta,
            descripcion: descripcionEncuesta,
            carreraId: carreraEncuesta,
            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
            modulos: window.obtenerModulos()
        };
        
        // Guardar en Firestore
        const encuestasRef = firebase.firestore().collection('encuestascreadas');
        
        if (modoEdicion && encuestaActual) {
            // Actualizar encuesta existente
            encuestasRef.doc(encuestaActual).update(encuesta)
                .then(() => {
                    mostrarAlerta('Encuesta actualizada correctamente', 'success');
                    resetearFormulario();
                    cargarEncuestasExistentes();
                })
                .catch((error) => {
                    console.error('Error al actualizar la encuesta:', error);
                    mostrarAlerta('Error al actualizar la encuesta', 'error');
                })
                .finally(() => {
                    ocultarCargando();
                });
        } else {
            // Crear nueva encuesta
            encuestasRef.add(encuesta)
                .then(() => {
                    mostrarAlerta('Encuesta creada correctamente', 'success');
                    resetearFormulario();
                    cargarEncuestasExistentes();
                })
                .catch((error) => {
                    console.error('Error al crear la encuesta:', error);
                    mostrarAlerta('Error al crear la encuesta', 'error');
                })
                .finally(() => {
                    ocultarCargando();
                });
        }
    }
    
    /**
     * Edita una encuesta existente
     */
    function editarEncuesta(encuestaId) {
        mostrarCargando();
        
        // Obtener datos de la encuesta
        firebase.firestore().collection('encuestascreadas').doc(encuestaId)
            .get()
            .then((doc) => {
                if (doc.exists) {
                    const encuesta = doc.data();
                    encuestaActual = encuestaId;
                    modoEdicion = true;
                    
                    // Llenar formulario
                    document.getElementById('nombre-encuesta').value = encuesta.nombre || '';
                    document.getElementById('descripcion-encuesta').value = encuesta.descripcion || '';
                    document.getElementById('carrera-encuesta').value = encuesta.carreraId || '';
                    
                    // Cargar módulos
                    if (window.cargarModulosExistentes) {
                        window.cargarModulosExistentes(encuesta.modulos || []);
                    }
                    
                    // Cambiar texto del botón
                    btnGuardarEncuesta.textContent = 'Actualizar encuesta';
                    
                    // Hacer scroll al formulario
                    document.querySelector('.seccion-crear-encuesta').scrollIntoView({ behavior: 'smooth' });
                } else {
                    mostrarAlerta('No se encontró la encuesta', 'error');
                }
            })
            .catch((error) => {
                console.error('Error al obtener la encuesta:', error);
                mostrarAlerta('Error al cargar la encuesta', 'error');
            })
            .finally(() => {
                ocultarCargando();
            });
    }
    
    /**
     * Elimina una encuesta
     */
    function eliminarEncuesta(encuestaId) {
        if (confirm('¿Estás seguro de que deseas eliminar esta encuesta?')) {
            mostrarCargando();
            
            firebase.firestore().collection('encuestascreadas').doc(encuestaId)
                .delete()
                .then(() => {
                    mostrarAlerta('Encuesta eliminada correctamente', 'success');
                    cargarEncuestasExistentes();
                })
                .catch((error) => {
                    console.error('Error al eliminar la encuesta:', error);
                    mostrarAlerta('Error al eliminar la encuesta', 'error');
                })
                .finally(() => {
                    ocultarCargando();
                });
        }
    }
    
    /**
     * Cancela la creación/edición de la encuesta
     */
    function cancelarCreacionEncuesta() {
        if (confirm('¿Estás seguro de que deseas cancelar? Los cambios no guardados se perderán.')) {
            resetearFormulario();
        }
    }
    
    /**
     * Resetea el formulario de encuesta
     */
    function resetearFormulario() {
        formEncuesta.reset();
        encuestaActual = null;
        modoEdicion = false;
        btnGuardarEncuesta.textContent = 'Guardar encuesta';
        
        // Resetear módulos
        if (window.resetearModulos) {
            window.resetearModulos();
        }
    }
    
    /**
     * Muestra el indicador de carga
     */
    function mostrarCargando() {
        const cargando = document.getElementById('cargando');
        if (cargando) {
            cargando.style.display = 'flex';
        }
    }
    
    /**
     * Oculta el indicador de carga
     */
    function ocultarCargando() {
        const cargando = document.getElementById('cargando');
        if (cargando) {
            cargando.style.display = 'none';
        }
    }
    
    /**
     * Muestra una alerta al usuario
     */
    function mostrarAlerta(mensaje, tipo = 'info') {
        // Crear elemento de alerta
        const alerta = document.createElement('div');
        alerta.className = `alerta alerta-${tipo}`;
        alerta.textContent = mensaje;
        
        // Agregar al DOM
        document.body.appendChild(alerta);
        
        // Eliminar después de 3 segundos
        setTimeout(() => {
            alerta.remove();
        }, 3000);
    }
    
    // Exportar funciones para uso en otros módulos
    window.gestorEncuestas = {
        inicializar: inicializarGestorEncuestas,
        mostrarCargando: mostrarCargando,
        ocultarCargando: ocultarCargando,
        mostrarAlerta: mostrarAlerta
    };
    
    // Inicializar cuando el DOM esté cargado
    document.addEventListener('DOMContentLoaded', inicializarGestorEncuestas);
})();
