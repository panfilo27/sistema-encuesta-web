// Gestión de Carreras - JavaScript
// Módulo encapsulado para evitar conflictos con otras partes de la aplicación

// Evitar redeclarar el módulo si ya existe
if (typeof window.CarrerasModule !== 'undefined') {
    // Si el módulo ya existe, solo actualizar la inicialización global y salir
    window.inicializarGestionCarreras = function() {
        window.CarrerasModule.inicializar();
    };
    
    window.editarCarrera = function(id) {
        window.CarrerasModule.editar(id);
    };
    
    window.confirmarEliminar = function(id) {
        window.CarrerasModule.eliminar(id);
    };
    
    console.log('CarrerasModule ya existe, no se redeclara.');
} else {
    // Si el módulo no existe, crearlo
    window.CarrerasModule = (function() {
    // Variables privadas del módulo
    let elementos = null;
    let carreraActual = null;
    let modoEdicion = false;
    let jefes = [];

    /**
     * Modelo para la gestión de carreras
     * 
     * Este modelo define la estructura de una carrera y proporciona métodos
     * para convertir entre objetos JavaScript y documentos de Firestore.
     */
    class Carrera {
        /**
         * Constructor para crear una nueva carrera
         * @param {string} id - ID de la carrera (opcional, generado por Firestore)
         * @param {string} nombre - Nombre de la carrera
         * @param {string} jefeDepartamentoId - ID del jefe de departamento asignado
         * @param {Date} fechaCreacion - Fecha de creación (opcional)
         * @param {Date} fechaActualizacion - Fecha de última actualización (opcional)
         */
        constructor(id = null, nombre = '', jefeDepartamentoId = '', fechaCreacion = null, fechaActualizacion = null) {
            this.id = id;
            this.nombre = nombre;
            this.jefeDepartamentoId = jefeDepartamentoId;
            this.fechaCreacion = fechaCreacion || new Date();
            this.fechaActualizacion = fechaActualizacion || new Date();
        }

        /**
         * Convierte un objeto de Firestore a una instancia de Carrera
         * @param {Object} doc - Documento de Firestore
         * @returns {Carrera} Una instancia de carrera
         */
        static fromFirestore(doc) {
            if (!doc) return null;
            
            const data = doc.data();
            return new Carrera(
                doc.id,
                data.nombre,
                data.jefeDepartamentoId,
                data.fechaCreacion ? data.fechaCreacion.toDate() : new Date(),
                data.fechaActualizacion ? data.fechaActualizacion.toDate() : new Date()
            );
        }

        /**
         * Convierte una instancia de Carrera a un objeto para guardar en Firestore
         * @returns {Object} Objeto para guardar en Firestore
         */
        toFirestore() {
            return {
                nombre: this.nombre,
                jefeDepartamentoId: this.jefeDepartamentoId,
                fechaCreacion: this.fechaCreacion,
                fechaActualizacion: new Date() // Siempre actualizamos esta fecha al guardar
            };
        }
    }

    // Función para obtener referencias a elementos DOM
    function obtenerReferencias() {
        return {
            form: document.getElementById('form-carrera'),
            tablaCarreras: document.getElementById('tabla-carreras'),
            btnBuscar: document.getElementById('btn-buscar-carrera'),
            inputBuscar: document.getElementById('buscar-carrera'),
            btnCancelar: document.getElementById('cancelar-carrera'),
            selectJefeDepartamento: document.getElementById('jefe-departamento'),
            inputId: document.getElementById('id-carrera')
        };
    }
    
    // Función para verificar si un elemento existe
    function elementoExiste(elemento) {
        return elemento !== null && elemento !== undefined;
    }

    // Función de inicialización que se ejecuta una vez que la página está cargada
    function inicializarGestionCarreras() {
        console.log('Inicializando gestión de carreras...');
        
        // Obtener referencias a los elementos DOM
        elementos = obtenerReferencias();
        
        // Verificar si los elementos están disponibles
        if (!elementos.form || !elementos.tablaCarreras) {
            console.error('No se pudieron obtener los elementos DOM necesarios');
            return;
        }
        
        console.log('Elementos DOM obtenidos correctamente');
        
        // Cargar jefes de departamento disponibles
        cargarJefesDepartamento();
        
        // Cargar lista de carreras
        cargarCarreras();
        
        // Event Listeners - Verificar que cada elemento existe antes de agregar el listener
        if (elementoExiste(elementos.form)) {
            elementos.form.addEventListener('submit', guardarCarrera);
        } else {
            console.error('Elemento form-carrera no encontrado');
        }
        
        if (elementoExiste(elementos.btnBuscar)) {
            elementos.btnBuscar.addEventListener('click', buscarCarrera);
        }
        
        if (elementoExiste(elementos.inputBuscar)) {
            elementos.inputBuscar.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') buscarCarrera();
            });
        }
        
        if (elementoExiste(elementos.btnCancelar)) {
            elementos.btnCancelar.addEventListener('click', cancelarEdicion);
        }
        
        console.log('Inicialización de gestión de carreras completada');
    }

    // Función para cargar jefes de departamento desde Firestore
    async function cargarJefesDepartamento() {
        try {
            if (!elementos.selectJefeDepartamento) {
                console.error('No se pudo acceder al selector de jefes de departamento');
                return;
            }
            
            elementos.selectJefeDepartamento.innerHTML = '<option value="">Sin asignar</option>';
            console.log('Consultando jefes de departamento en Firestore...');
            
            const snapshot = await db.collection('usuario')
                .where('rolUser', '==', 'jefedepartamento')
                .get();
            
            console.log(`Se encontraron ${snapshot.size} jefes de departamento`);
            
            if (snapshot.empty) {
                elementos.selectJefeDepartamento.innerHTML += '<option value="" disabled>No hay jefes disponibles</option>';
                return;
            }
            
            // Ordenar jefes por nombre
            jefes = [];
            snapshot.forEach(doc => {
                jefes.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            jefes.sort((a, b) => a.nombre.localeCompare(b.nombre));
            
            // Añadir jefes al selector
            for (const jefe of jefes) {
                // Verificar si el jefe ya tiene departamento asignado
                let infoAsignacion = '';
                if (jefe.departamento) {
                    infoAsignacion = ` (Asignado a: ${jefe.departamento})`;
                }
                
                const nombreCompleto = `${jefe.nombre} ${jefe.apellidoPaterno || ''} ${jefe.apellidoMaterno || ''}`.trim();
                elementos.selectJefeDepartamento.innerHTML += `<option value="${jefe.id}">${nombreCompleto}${infoAsignacion}</option>`;
            }
        } catch (error) {
            console.error("Error al cargar jefes de departamento:", error);
            elementos.selectJefeDepartamento.innerHTML += '<option value="" disabled>Error al cargar jefes</option>';
        }
    }

    // Función para cargar carreras desde Firestore
    async function cargarCarreras(busqueda = '') {
        try {
            elementos.tablaCarreras.innerHTML = '<div class="loading-message">Cargando carreras...</div>';
            
            let snapshot = await db.collection('carreras').get();
            
            if (snapshot.empty) {
                elementos.tablaCarreras.innerHTML = `
                    <div class="empty-message">
                        <p>No se encontraron carreras${busqueda ? ' para la búsqueda: ' + busqueda : ''}.</p>
                    </div>
                `;
                return;
            }
            
            // Filtrar por búsqueda si se proporciona
            let carreras = [];
            snapshot.forEach(doc => {
                carreras.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            if (busqueda) {
                const busquedaLower = busqueda.toLowerCase();
                carreras = carreras.filter(carrera => 
                    carrera.nombre.toLowerCase().includes(busquedaLower)
                );
                
                if (carreras.length === 0) {
                    elementos.tablaCarreras.innerHTML = `
                        <div class="empty-message">
                            <p>No se encontraron carreras para: "${busqueda}".</p>
                        </div>
                    `;
                    return;
                }
            }
            
            mostrarTablaCarreras(carreras);
            
        } catch (error) {
            console.error("Error al cargar carreras:", error);
            elementos.tablaCarreras.innerHTML = `<div class="error-message">Error al cargar datos: ${error.message}</div>`;
        }
    }

    // Función para mostrar la tabla de carreras
    async function mostrarTablaCarreras(datos) {
        // Para cada carrera, necesitamos obtener el nombre del jefe de departamento
        const carrerasPromises = datos.map(async carrera => {
            let nombreJefe = 'No asignado';
            
            if (carrera.jefeDepartamentoId) {
                // Buscar primero en la lista de jefes que ya tenemos cargados
                const jefeEncontrado = jefes.find(jefe => jefe.id === carrera.jefeDepartamentoId);
                
                if (jefeEncontrado) {
                    nombreJefe = `${jefeEncontrado.nombre} ${jefeEncontrado.apellidoPaterno || ''}`.trim();
                } else {
                    // Si no lo encontramos en la lista, hacer consulta a Firestore
                    try {
                        const jefeDoc = await db.collection('usuario').doc(carrera.jefeDepartamentoId).get();
                        if (jefeDoc.exists) {
                            const jefeData = jefeDoc.data();
                            nombreJefe = `${jefeData.nombre} ${jefeData.apellidoPaterno || ''}`.trim();
                        }
                    } catch (error) {
                        console.error('Error al obtener jefe:', error);
                    }
                }
            }
            
            return {
                ...carrera,
                nombreJefe
            };
        });
        
        // Esperar a que todas las promesas se resuelvan
        const carrerasConJefes = await Promise.all(carrerasPromises);
        
        // Generar HTML para la tabla
        const html = carrerasConJefes.map(carrera => {
            return `
                <tr>
                    <td>${carrera.nombre}</td>
                    <td>${carrera.nombreJefe}</td>
                    <td>
                        <button class="acciones-btn btn-editar" onclick="editarCarrera('${carrera.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="acciones-btn btn-eliminar" onclick="confirmarEliminar('${carrera.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        elementos.tablaCarreras.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Nombre de la Carrera</th>
                        <th>Jefe de Departamento</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${html}
                </tbody>
            </table>
        `;
    }

    // Función para buscar carrera por nombre
    function buscarCarrera() {
        const busqueda = elementos.inputBuscar.value.trim();
        cargarCarreras(busqueda);
    }

    // Función para guardar una nueva carrera o actualizar una existente
    async function guardarCarrera(e) {
        e.preventDefault();
        
        if (!elementos) {
            console.error('No se pudo acceder a los elementos del formulario');
            return;
        }
        
        // Obtenemos los datos del formulario
        const nombre = elementos.form.elements['nombre-carrera'].value.trim();
        const jefeDepartamentoId = elementos.selectJefeDepartamento.value;
        const id = elementos.inputId.value;
        
        // Validar que el nombre no esté vacío
        if (!nombre) {
            alert('El nombre de la carrera es obligatorio');
            return;
        }
        
        try {
            const carreraData = {
                nombre,
                jefeDepartamentoId,
                fechaActualizacion: new Date()
            };
            
            if (modoEdicion) {
                // Actualización de una carrera existente
                await db.collection('carreras').doc(id).update(carreraData);
                alert('Carrera actualizada correctamente');
            } else {
                // Creación de una nueva carrera
                carreraData.fechaCreacion = new Date();
                
                // Verificar si ya existe una carrera con ese nombre
                const existingCarreras = await db.collection('carreras')
                    .where('nombre', '==', nombre)
                    .get();
                
                if (!existingCarreras.empty) {
                    alert('Ya existe una carrera con ese nombre');
                    return;
                }
                
                const docRef = await db.collection('carreras').add(carreraData);
                id = docRef.id; // Actualizar el ID para usarlo en sincronización
                alert('Carrera agregada correctamente');
            }
            
            // Sincronizar con el personal (jefe de departamento)
            if (jefeDepartamentoId) {
                // Primero verificar si había un jefe asignado anteriormente
                if (carreraActual && carreraActual.jefeDepartamentoId && carreraActual.jefeDepartamentoId !== jefeDepartamentoId) {
                    // Quitar la asignación de departamento al jefe anterior
                    await db.collection('usuario').doc(carreraActual.jefeDepartamentoId).update({
                        departamento: ''
                    });
                }
                
                // Actualizar el departamento del nuevo jefe
                await db.collection('usuario').doc(jefeDepartamentoId).update({
                    departamento: nombre
                });
            } else if (carreraActual && carreraActual.jefeDepartamentoId) {
                // Si quitamos el jefe, actualizar su registro también
                await db.collection('usuario').doc(carreraActual.jefeDepartamentoId).update({
                    departamento: ''
                });
            }
            
            // Limpiar formulario y recargar datos
            limpiarFormulario();
            cargarCarreras();
            cargarJefesDepartamento(); // Recargar jefes para actualizar las asignaciones
            
        } catch (error) {
            console.error('Error al guardar carrera:', error);
            alert(`Error al guardar: ${error.message}`);
        }
    }

    // Función para editar una carrera existente
    async function editarCarrera(id) {
        try {
            const doc = await db.collection('carreras').doc(id).get();
            
            if (!doc.exists) {
                alert('No se encontró la carrera solicitada');
                return;
            }
            
            // Convertir fechas a objetos Date de forma segura
            let fechaCreacion = new Date();
            let fechaActualizacion = new Date();
            
            try {
                // Intentar convertir fechaCreacion si existe y es un Timestamp
                if (doc.data().fechaCreacion) {
                    if (typeof doc.data().fechaCreacion.toDate === 'function') {
                        fechaCreacion = doc.data().fechaCreacion.toDate();
                    } else if (doc.data().fechaCreacion instanceof Date) {
                        fechaCreacion = doc.data().fechaCreacion;
                    } else if (doc.data().fechaCreacion.seconds) {
                        // Si tiene seconds, probablemente es un timestamp de Firestore
                        fechaCreacion = new Date(doc.data().fechaCreacion.seconds * 1000);
                    }
                }
                
                // Intentar convertir fechaActualizacion si existe y es un Timestamp
                if (doc.data().fechaActualizacion) {
                    if (typeof doc.data().fechaActualizacion.toDate === 'function') {
                        fechaActualizacion = doc.data().fechaActualizacion.toDate();
                    } else if (doc.data().fechaActualizacion instanceof Date) {
                        fechaActualizacion = doc.data().fechaActualizacion;
                    } else if (doc.data().fechaActualizacion.seconds) {
                        // Si tiene seconds, probablemente es un timestamp de Firestore
                        fechaActualizacion = new Date(doc.data().fechaActualizacion.seconds * 1000);
                    }
                }
            } catch (e) {
                console.warn('Error al convertir fechas:', e);
                // Usar fechas actuales como respaldo si hay error
            }
            
            carreraActual = new Carrera(
                doc.id,
                doc.data().nombre,
                doc.data().jefeDepartamentoId,
                fechaCreacion,
                fechaActualizacion
            );
            
            // Llenar el formulario con los datos usando document.getElementById
            document.getElementById('nombre-carrera').value = carreraActual.nombre;
            
            // Seleccionar el jefe de departamento si existe
            if (carreraActual.jefeDepartamentoId) {
                Array.from(elementos.selectJefeDepartamento.options).forEach(option => {
                    if (option.value === carreraActual.jefeDepartamentoId) {
                        option.selected = true;
                    }
                });
            } else {
                elementos.selectJefeDepartamento.selectedIndex = 0;
            }
            
            // Actualizar el ID oculto y cambiar a modo edición
            elementos.inputId.value = id;
            modoEdicion = true;
            
            // Cambiar texto del botón de submit
            const submitBtn = elementos.form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = 'Actualizar';
            }
            
            // Hacer foco en el primer campo
            elementos.form.elements['nombre-carrera'].focus();
            
        } catch (error) {
            console.error('Error al cargar datos para editar:', error);
            alert(`Error al cargar datos: ${error.message}`);
        }
    }

    // Función para limpiar el formulario y salir del modo edición
    function limpiarFormulario() {
        elementos.form.reset();
        elementos.inputId.value = '';
        
        // Restaurar texto del botón
        const submitBtn = elementos.form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Guardar';
        }
        
        // Limpiar variable de carrera actual y modo edición
        carreraActual = null;
        modoEdicion = false;
    }

    // Función para cancelar la edición
    function cancelarEdicion() {
        limpiarFormulario();
    }

    // Función para confirmar eliminación de una carrera
    function confirmarEliminar(id) {
        if (confirm('¿Está seguro de eliminar esta carrera? Esta acción no se puede deshacer.')) {
            eliminarCarrera(id);
        }
    }

    // Función para eliminar una carrera de Firestore
    async function eliminarCarrera(id) {
        try {
            // Obtener los datos de la carrera antes de eliminarla
            const docCarrera = await db.collection('carreras').doc(id).get();
            
            if (!docCarrera.exists) {
                alert('No se encontró la carrera a eliminar');
                return;
            }
            
            const carrera = docCarrera.data();
            
            // Eliminar la carrera
            await db.collection('carreras').doc(id).delete();
            
            // Si tiene jefe asignado, actualizar su registro
            if (carrera.jefeDepartamentoId) {
                await db.collection('usuario').doc(carrera.jefeDepartamentoId).update({
                    departamento: ''
                });
            }
            
            alert('Carrera eliminada correctamente');
            cargarCarreras();
            cargarJefesDepartamento();
            
        } catch (error) {
            console.error('Error al eliminar carrera:', error);
            alert(`Error al eliminar: ${error.message}`);
        }
    }

    // Retornar las funciones públicas que queremos exponer
    return {
        inicializar: inicializarGestionCarreras,
        editar: editarCarrera,
        eliminar: confirmarEliminar
    };
})();

// Exponer funciones globalmente para eventos HTML
window.inicializarGestionCarreras = function() {
    window.CarrerasModule.inicializar();
};

window.editarCarrera = function(id) {
    window.CarrerasModule.editar(id);
};

window.confirmarEliminar = function(id) {
    window.CarrerasModule.eliminar(id);
};
}
