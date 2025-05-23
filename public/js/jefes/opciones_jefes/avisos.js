// Gestión de Avisos - JavaScript para Jefe de Departamento
// Módulo encapsulado para evitar conflictos con otras partes de la aplicación

// Evitar redeclarar el módulo si ya existe
if (typeof window.AvisosModule !== 'undefined') {
    // Si el módulo ya existe, solo actualizar la inicialización global y salir
    window.inicializarGestionAvisos = function(infoDeptoJefe) {
        window.AvisosModule.inicializar(infoDeptoJefe);
    };
    
    window.editarAviso = function(id) {
        window.AvisosModule.editar(id);
    };
    
    window.confirmarEliminarAviso = function(id) {
        window.AvisosModule.eliminar(id);
    };
    
    console.log('AvisosModule ya existe, no se redeclara.');
} else {
    // Si el módulo no existe, crearlo
    window.AvisosModule = (function() {
    // Variables privadas del módulo
    let elementos = null;
    let avisoActual = null;
    let modoEdicion = false;
    let carreras = [];
    // Información del departamento del jefe
    let departamentoInfo = null;

    /**
     * Modelo para la gestión de avisos
     * 
     * Este modelo define la estructura de un aviso y proporciona métodos
     * para convertir entre objetos JavaScript y documentos de Firestore.
     */
    class Aviso {
        /**
         * Constructor para crear un nuevo aviso
         * @param {string} id - ID del aviso (opcional, generado por Firestore)
         * @param {string} titulo - Título del aviso
         * @param {string} descripcion - Descripción detallada del aviso
         * @param {string} carreraId - ID de la carrera a la que va dirigido (opcional)
         * @param {string} imagenURL - URL de la imagen del aviso (opcional)
         * @param {Date} fechaInicio - Fecha de inicio de vigencia
         * @param {Date} fechaFin - Fecha de fin de vigencia
         * @param {Date} fechaCreacion - Fecha de creación (opcional)
         * @param {Date} fechaActualizacion - Fecha de última actualización (opcional)
         */
        constructor(id = null, titulo = '', descripcion = '', carreraId = '', imagenURL = '', fechaInicio = null, fechaFin = null, fechaCreacion = null, fechaActualizacion = null) {
            this.id = id;
            this.titulo = titulo;
            this.descripcion = descripcion;
            this.carreraId = carreraId;
            this.imagenURL = imagenURL;
            this.fechaInicio = fechaInicio || new Date();
            this.fechaFin = fechaFin || new Date(new Date().setDate(new Date().getDate() + 7)); // Por defecto, una semana
            this.fechaCreacion = fechaCreacion || new Date();
            this.fechaActualizacion = fechaActualizacion || new Date();
        }

        /**
         * Convierte un objeto de Firestore a una instancia de Aviso
         * @param {Object} doc - Documento de Firestore
         * @returns {Aviso} Una instancia de aviso
         */
        static fromFirestore(doc) {
            if (!doc) return null;
            
            const data = doc.data();
            return new Aviso(
                doc.id,
                data.titulo,
                data.descripcion,
                data.carreraId || '',
                data.imagenURL || '',
                data.fechaInicio ? data.fechaInicio.toDate() : new Date(),
                data.fechaFin ? data.fechaFin.toDate() : new Date(new Date().setDate(new Date().getDate() + 7)),
                data.fechaCreacion ? data.fechaCreacion.toDate() : new Date(),
                data.fechaActualizacion ? data.fechaActualizacion.toDate() : new Date()
            );
        }

        /**
         * Convierte una instancia de Aviso a un objeto para guardar en Firestore
         * @returns {Object} Objeto para guardar en Firestore
         */
        toFirestore() {
            return {
                titulo: this.titulo,
                descripcion: this.descripcion,
                carreraId: this.carreraId,
                imagenURL: this.imagenURL,
                fechaInicio: firebase.firestore.Timestamp.fromDate(this.fechaInicio),
                fechaFin: firebase.firestore.Timestamp.fromDate(this.fechaFin),
                fechaCreacion: firebase.firestore.Timestamp.fromDate(this.fechaCreacion),
                fechaActualizacion: firebase.firestore.Timestamp.fromDate(new Date()) // Siempre actualizamos esta fecha al guardar
            };
        }
    }

    // Función para obtener referencias a elementos DOM
    function obtenerReferencias() {
        return {
            form: document.getElementById('form-aviso'),
            tablaAvisos: document.getElementById('tabla-avisos'),
            btnBuscar: document.getElementById('btn-buscar-aviso'),
            inputBuscar: document.getElementById('buscar-aviso'),
            btnCancelar: document.getElementById('cancelar-aviso'),
            selectCarrera: document.getElementById('carrera-aviso'),
            inputId: document.getElementById('id-aviso'),
            inputTitulo: document.getElementById('titulo-aviso'),
            inputDescripcion: document.getElementById('descripcion-aviso'),
            inputFechaInicio: document.getElementById('fecha-inicio'),
            inputFechaFin: document.getElementById('fecha-fin'),
            // Elementos para la imagen
            fileUpload: document.getElementById('file-upload'),
            imagenPreview: document.getElementById('imagen-preview'),
            noImagePlaceholder: document.getElementById('no-image-placeholder'),
            removeImageBtn: document.getElementById('remove-image')
        };
    }
    
    // Función para verificar si un elemento existe
    function elementoExiste(elemento) {
        return elemento !== null && elemento !== undefined;
    }
    
    // Función para cargar carreras desde Firestore para el selector, filtrando solo las del departamento
    async function cargarCarrerasSelector() {
        try {
            // Verificar si tenemos información del departamento
            if (!departamentoInfo || !departamentoInfo.carrerasIds || departamentoInfo.carrerasIds.length === 0) {
                console.warn('No se encontró información del departamento o sus carreras');
                elementos.selectCarrera.innerHTML = '<option value="" disabled>No hay carreras disponibles para este departamento</option>';
                return;
            }
            
            elementos.selectCarrera.innerHTML = '';
            
            // Si hay más de una carrera, agregar la opción de "Todas las carreras"
            if (departamentoInfo.carrerasIds.length > 1) {
                elementos.selectCarrera.innerHTML = '<option value="">Todas las Carreras del Departamento</option>';
            }
            
            // Usar las carreras ya cargadas en la información del departamento
            if (departamentoInfo.carreras && departamentoInfo.carreras.length > 0) {
                // Guardar carreras para su uso posterior
                carreras = departamentoInfo.carreras;
                
                // Añadir opciones al selector
                carreras.forEach(carrera => {
                    elementos.selectCarrera.innerHTML += `<option value="${carrera.id}">${carrera.nombre}</option>`;
                });
            } else {
                // Si no están cargadas, buscarlas en Firestore
                let carrerasQuery;
                
                // Obtener solo las carreras del departamento
                const carrerasIds = departamentoInfo.carrerasIds;
                
                // Como no podemos usar WHERE IN con más de 10 valores, hacemos una consulta general y filtramos
                let snapshot = await firebase.firestore().collection('carreras').get();
                
                if (snapshot.empty) {
                    elementos.selectCarrera.innerHTML += '<option value="" disabled>No hay carreras disponibles</option>';
                    return;
                }
                
                // Filtrar solo las carreras del departamento
                carreras = [];
                snapshot.forEach(doc => {
                    // Solo incluir si está en las carreras del departamento
                    if (carrerasIds.includes(doc.id)) {
                        const carrera = {
                            id: doc.id,
                            ...doc.data()
                        };
                        carreras.push(carrera);
                        
                        // Añadir opción al selector
                        elementos.selectCarrera.innerHTML += `<option value="${carrera.id}">${carrera.nombre}</option>`;
                    }
                });
                
                // Si no se encontraron carreras
                if (carreras.length === 0) {
                    elementos.selectCarrera.innerHTML = '<option value="" disabled>No hay carreras disponibles para este departamento</option>';
                }
            }
        } catch (error) {
            console.error("Error al cargar carreras:", error);
            elementos.selectCarrera.innerHTML = '<option value="" disabled>Error al cargar carreras</option>';
        }
    }

    // Función para cargar avisos desde Firestore, filtrando por departamento
    async function cargarAvisos(busqueda = '') {
        try {
            elementos.tablaAvisos.innerHTML = '<div class="loading-message">Cargando avisos...</div>';
            
            // Verificar si tenemos información del departamento
            if (!departamentoInfo || !departamentoInfo.carrerasIds) {
                elementos.tablaAvisos.innerHTML = `
                    <div class="empty-message">
                        <p>No se pudo cargar la información del departamento.</p>
                    </div>
                `;
                return;
            }
            
            // IDs de las carreras del departamento
            const carrerasIds = departamentoInfo.carrerasIds;
            
            let snapshot = await firebase.firestore().collection('avisos')
                .orderBy('fechaActualizacion', 'desc')
                .get();
            
            if (snapshot.empty) {
                elementos.tablaAvisos.innerHTML = `
                    <div class="empty-message">
                        <p>No se encontraron avisos${busqueda ? ' para la búsqueda: ' + busqueda : ''}.</p>
                    </div>
                `;
                return;
            }
            
            // Filtrar avisos: incluir los generales (sin carreraId) y los de las carreras del departamento
            let avisos = [];
            snapshot.forEach(doc => {
                const aviso = {
                    id: doc.id,
                    ...doc.data(),
                    fechaInicio: doc.data().fechaInicio.toDate(),
                    fechaFin: doc.data().fechaFin.toDate(),
                    fechaCreacion: doc.data().fechaCreacion.toDate(),
                    fechaActualizacion: doc.data().fechaActualizacion.toDate()
                };
                
                // Incluir si es un aviso general (sin carreraId) o si es para alguna de las carreras del departamento
                if (!aviso.carreraId || carrerasIds.includes(aviso.carreraId)) {
                    avisos.push(aviso);
                }
            });
            
            // Si no hay avisos después de filtrar
            if (avisos.length === 0) {
                elementos.tablaAvisos.innerHTML = `
                    <div class="empty-message">
                        <p>No se encontraron avisos para las carreras de este departamento${busqueda ? ' con la búsqueda: ' + busqueda : ''}.</p>
                    </div>
                `;
                return;
            }
            
            // Filtrar por búsqueda si se proporciona
            if (busqueda) {
                const busquedaLower = busqueda.toLowerCase();
                avisos = avisos.filter(aviso => 
                    aviso.titulo.toLowerCase().includes(busquedaLower) ||
                    aviso.descripcion.toLowerCase().includes(busquedaLower)
                );
                
                if (avisos.length === 0) {
                    elementos.tablaAvisos.innerHTML = `
                        <div class="empty-message">
                            <p>No se encontraron avisos para: "${busqueda}".</p>
                        </div>
                    `;
                    return;
                }
            }
            
            mostrarTablaAvisos(avisos);
            
        } catch (error) {
            console.error("Error al cargar avisos:", error);
            elementos.tablaAvisos.innerHTML = `<div class="error-message">Error al cargar datos: ${error.message}</div>`;
        }
    }
    
    // Función para mostrar los avisos en la tabla
    function mostrarTablaAvisos(avisos) {
        // Obtener la fecha actual para determinar el estado
        const hoy = new Date();
        
        // Crear la estructura de la tabla
        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Título</th>
                        <th>Carrera</th>
                        <th>Vigencia</th>
                        <th>Estado</th>
                        <th>Última Actualización</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // Añadir cada aviso a la tabla
        avisos.forEach(aviso => {
            // Determinar el estado del aviso
            let estado = '';
            let estadoClase = '';
            
            if (hoy < aviso.fechaInicio) {
                estado = 'Pendiente';
                estadoClase = 'state-future';
            } else if (hoy > aviso.fechaFin) {
                estado = 'Expirado';
                estadoClase = 'state-inactive';
            } else {
                estado = 'Activo';
                estadoClase = 'state-active';
            }
            
            // Encontrar el nombre de la carrera si existe
            let nombreCarrera = 'Todas las carreras';
            if (aviso.carreraId) {
                const carrera = carreras.find(c => c.id === aviso.carreraId);
                if (carrera) {
                    nombreCarrera = carrera.nombre;
                }
            }
            
            // Formatear fechas
            const formatoFecha = { year: 'numeric', month: '2-digit', day: '2-digit' };
            const fechaInicio = aviso.fechaInicio.toLocaleDateString('es-ES', formatoFecha);
            const fechaFin = aviso.fechaFin.toLocaleDateString('es-ES', formatoFecha);
            const fechaActualizacion = aviso.fechaActualizacion.toLocaleDateString('es-ES', formatoFecha);
            
            html += `
                <tr>
                    <td>${aviso.titulo}</td>
                    <td>${nombreCarrera}</td>
                    <td>${fechaInicio} al ${fechaFin}</td>
                    <td><span class="state ${estadoClase}">${estado}</span></td>
                    <td>${fechaActualizacion}</td>
                    <td class="actions-cell">
                        <button onclick="editarAviso('${aviso.id}')" class="btn-action btn-edit" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="confirmarEliminarAviso('${aviso.id}')" class="btn-action btn-delete" title="Eliminar">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
        
        elementos.tablaAvisos.innerHTML = html;
    }
    
    // Variables para manejar la imagen
    let imagenSeleccionada = null;
    let imagenURL = '';
    
    // Función para mostrar la vista previa de la imagen
    function mostrarVistaPrevia(file) {
        if (!file) {
            elementos.imagenPreview.style.display = 'none';
            elementos.noImagePlaceholder.style.display = 'block';
            elementos.removeImageBtn.style.display = 'none';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            elementos.imagenPreview.src = e.target.result;
            elementos.imagenPreview.style.display = 'block';
            elementos.noImagePlaceholder.style.display = 'none';
            elementos.removeImageBtn.style.display = 'inline-block';
        };
        reader.readAsDataURL(file);
    }
    
    // Función para subir una imagen a Firebase Storage
    async function subirImagen(file, avisoId) {
        if (!file) return '';
        
        try {
            // Crear referencia a Firebase Storage
            const storage = firebase.storage();
            const storageRef = storage.ref();
            
            // Crear un nombre único para la imagen basado en el ID del aviso y la fecha
            const timestamp = new Date().getTime();
            const nombreArchivo = `avisos/${avisoId}_${timestamp}_${file.name}`;
            
            // Crear referencia al archivo
            const imagenRef = storageRef.child(nombreArchivo);
            
            // Subir archivo
            const snapshot = await imagenRef.put(file);
            console.log('Imagen subida correctamente:', snapshot);
            
            // Obtener URL de descarga
            const downloadURL = await snapshot.ref.getDownloadURL();
            console.log('URL de la imagen:', downloadURL);
            
            return downloadURL;
        } catch (error) {
            console.error('Error al subir imagen:', error);
            throw error;
        }
    }
    
    // Función para eliminar una imagen de Firebase Storage
    async function eliminarImagen(url) {
        if (!url) return;
        
        try {
            // Obtener referencia al archivo a partir de la URL
            const storage = firebase.storage();
            const storageRef = storage.refFromURL(url);
            
            // Eliminar archivo
            await storageRef.delete();
            console.log('Imagen eliminada correctamente');
        } catch (error) {
            console.error('Error al eliminar imagen:', error);
            // No lanzamos el error para permitir continuar con la operación
        }
    }
    
    // Función para guardar un aviso
    async function guardarAviso(e) {
        // Prevenir envío del formulario
        if (e) e.preventDefault();
        
        // Obtener valores del formulario
        const titulo = elementos.inputTitulo.value.trim();
        const descripcion = elementos.inputDescripcion.value.trim();
        const carreraId = elementos.selectCarrera.value;
        const fechaInicio = new Date(elementos.inputFechaInicio.value);
        const fechaFin = new Date(elementos.inputFechaFin.value);
        
        // Validaciones básicas
        if (!titulo) {
            alert('Por favor, ingrese un título para el aviso.');
            return;
        }
        
        if (!descripcion) {
            alert('Por favor, ingrese una descripción para el aviso.');
            return;
        }
        
        if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
            alert('Por favor, ingrese fechas válidas.');
            return;
        }
        
        if (fechaFin < fechaInicio) {
            alert('La fecha de fin debe ser posterior a la fecha de inicio.');
            return;
        }
        
        try {
            // Mostrar indicador de carga
            elementos.form.classList.add('loading');
            const btnGuardar = elementos.form.querySelector('button[type="submit"]');
            const textoOriginal = btnGuardar.textContent;
            btnGuardar.disabled = true;
            btnGuardar.textContent = 'Guardando...';
            
            // Determinar la URL de la imagen
            let urlImagen = modoEdicion ? avisoActual.imagenURL : '';
            
            // Si hay una imagen seleccionada, subirla
            if (imagenSeleccionada) {
                // Si está en modo edición y hay una imagen anterior, eliminarla
                if (modoEdicion && avisoActual.imagenURL) {
                    await eliminarImagen(avisoActual.imagenURL);
                }
                
                // Determinar el ID para la imagen
                const avisoId = modoEdicion ? avisoActual.id : 'temp_' + new Date().getTime();
                
                // Subir la nueva imagen
                urlImagen = await subirImagen(imagenSeleccionada, avisoId);
            } else if (imagenURL === null && modoEdicion && avisoActual.imagenURL) {
                // Si la imagen fue eliminada en la interfaz, eliminar de Storage
                await eliminarImagen(avisoActual.imagenURL);
                urlImagen = '';
            }
            
            // Crear objeto aviso
            const aviso = new Aviso(
                modoEdicion ? avisoActual.id : null,
                titulo,
                descripcion,
                carreraId,
                urlImagen,
                fechaInicio,
                fechaFin,
                modoEdicion ? avisoActual.fechaCreacion : new Date(),
                new Date()
            );
            
            // Guardar en Firestore
            if (modoEdicion) {
                // Actualizar aviso existente
                await firebase.firestore().collection('avisos').doc(aviso.id).update(aviso.toFirestore());
                console.log(`Aviso actualizado con ID: ${aviso.id}`);
            } else {
                // Crear nuevo aviso
                const docRef = await firebase.firestore().collection('avisos').add(aviso.toFirestore());
                console.log(`Nuevo aviso creado con ID: ${docRef.id}`);
                
                // Si se creó una imagen con ID temporal, actualizar la referencia
                if (urlImagen && urlImagen.includes('temp_')) {
                    const storage = firebase.storage();
                    const newImagePath = urlImagen.replace('temp_', docRef.id);
                    // En un entorno real, aquí se renombraría el archivo en Storage
                }
            }
            
            // Limpiar formulario y recargar avisos
            resetearFormulario();
            cargarAvisos();
            
            // Mostrar mensaje de éxito
            alert(`El aviso ha sido ${modoEdicion ? 'actualizado' : 'creado'} correctamente.`);
            
        } catch (error) {
            console.error('Error al guardar aviso:', error);
            alert(`Error al ${modoEdicion ? 'actualizar' : 'crear'} el aviso: ${error.message}`);
        } finally {
            // Restaurar estado del botón
            const btnGuardar = elementos.form.querySelector('button[type="submit"]');
            btnGuardar.disabled = false;
            btnGuardar.textContent = 'Guardar';
            elementos.form.classList.remove('loading');
        }
    }
    
    // Función para editar un aviso
    async function editarAviso(id) {
        try {
            // Obtener datos del aviso
            const doc = await firebase.firestore().collection('avisos').doc(id).get();
            
            if (!doc.exists) {
                alert('El aviso solicitado no existe o ha sido eliminado.');
                return;
            }
            
            // Activar modo edición
            modoEdicion = true;
            
            // Crear objeto aviso
            avisoActual = new Aviso(
                doc.id,
                doc.data().titulo,
                doc.data().descripcion,
                doc.data().carreraId || '',
                doc.data().imagenURL || '',
                doc.data().fechaInicio.toDate(),
                doc.data().fechaFin.toDate(),
                doc.data().fechaCreacion.toDate(),
                doc.data().fechaActualizacion.toDate()
            );
            
            // Llenar formulario con datos
            elementos.inputId.value = avisoActual.id;
            elementos.inputTitulo.value = avisoActual.titulo;
            elementos.inputDescripcion.value = avisoActual.descripcion;
            elementos.selectCarrera.value = avisoActual.carreraId;
            
            // Mostrar imagen si existe
            if (avisoActual.imagenURL) {
                elementos.imagenPreview.src = avisoActual.imagenURL;
                elementos.imagenPreview.style.display = 'block';
                elementos.noImagePlaceholder.style.display = 'none';
                elementos.removeImageBtn.style.display = 'inline-block';
                imagenURL = avisoActual.imagenURL;
            } else {
                elementos.imagenPreview.style.display = 'none';
                elementos.noImagePlaceholder.style.display = 'block';
                elementos.removeImageBtn.style.display = 'none';
                imagenURL = '';
            }
            
            // Resetear la imagen seleccionada
            imagenSeleccionada = null;
            if (elementos.fileUpload) {
                elementos.fileUpload.value = '';
            }
            
            // Formatear fechas para el input date (YYYY-MM-DD)
            const formatearFechaInput = (fecha) => {
                return fecha.toISOString().split('T')[0];
            };
            
            elementos.inputFechaInicio.value = formatearFechaInput(avisoActual.fechaInicio);
            elementos.inputFechaFin.value = formatearFechaInput(avisoActual.fechaFin);
            
            // Hacer scroll hacia el formulario
            elementos.form.scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            console.error('Error al cargar aviso para edición:', error);
            alert('Error al cargar el aviso para edición: ' + error.message);
        }
    }
    
    // Función para eliminar un aviso
    async function eliminarAviso(id) {
        if (!confirm('¿Está seguro que desea eliminar este aviso? Esta acción no se puede deshacer.')) {
            return;
        }
        
        try {
            // Obtener el aviso para verificar si tiene imagen
            const doc = await firebase.firestore().collection('avisos').doc(id).get();
            if (doc.exists && doc.data().imagenURL) {
                // Eliminar la imagen de Storage
                await eliminarImagen(doc.data().imagenURL);
            }
            
            // Eliminar el documento de Firestore
            await firebase.firestore().collection('avisos').doc(id).delete();
            console.log(`Aviso eliminado con ID: ${id}`);
            
            // Recargar lista de avisos
            cargarAvisos();
            
            // Mostrar mensaje de éxito
            alert('El aviso ha sido eliminado correctamente.');
            
            // Si estábamos editando este aviso, resetear el formulario
            if (modoEdicion && avisoActual && avisoActual.id === id) {
                resetearFormulario();
            }
            
        } catch (error) {
            console.error('Error al eliminar aviso:', error);
            alert('Error al eliminar el aviso: ' + error.message);
        }
    }
    
    // Función para resetear el formulario
    function resetearFormulario() {
        // Limpiar campos
        elementos.form.reset();
        elementos.inputId.value = '';
        
        // Configurar fechas por defecto
        const hoy = new Date();
        const unaSemana = new Date();
        unaSemana.setDate(hoy.getDate() + 7);
        
        elementos.inputFechaInicio.value = hoy.toISOString().split('T')[0];
        elementos.inputFechaFin.value = unaSemana.toISOString().split('T')[0];
        
        // Resetear imagen
        elementos.imagenPreview.src = '';
        elementos.imagenPreview.style.display = 'none';
        elementos.noImagePlaceholder.style.display = 'block';
        elementos.removeImageBtn.style.display = 'none';
        if (elementos.fileUpload) {
            elementos.fileUpload.value = '';
        }
        
        // Resetear variables de imagen
        imagenSeleccionada = null;
        imagenURL = '';
        
        // Resetear estado de edición
        modoEdicion = false;
        avisoActual = null;
    }
    
    // Función de inicialización
    function inicializar(infoDeptoJefe) {
        console.log('Inicializando módulo de gestión de avisos para jefe de departamento...');
        
        // Guardar la información del departamento
        if (infoDeptoJefe) {
            departamentoInfo = infoDeptoJefe;
            console.log('Información de departamento recibida:', departamentoInfo);
        }
        
        // Obtener referencias a elementos DOM
        elementos = obtenerReferencias();
        
        // Verificar que todos los elementos existen
        if (!elementos.form || !elementos.tablaAvisos) {
            console.error('No se encontraron elementos necesarios en el DOM.');
            return;
        }
        
        // Cargar carreras para el selector (filtradas por departamento)
        cargarCarrerasSelector();
        
        // Cargar avisos (filtrados por departamento)
        cargarAvisos();
        
        // Configurar fechas por defecto
        const hoy = new Date();
        const unaSemana = new Date();
        unaSemana.setDate(hoy.getDate() + 7);
        
        elementos.inputFechaInicio.value = hoy.toISOString().split('T')[0];
        elementos.inputFechaFin.value = unaSemana.toISOString().split('T')[0];
        
        // Configurar event listeners para el formulario
        elementos.form.addEventListener('submit', guardarAviso);
        
        if (elementos.btnCancelar) {
            elementos.btnCancelar.addEventListener('click', resetearFormulario);
        }
        
        if (elementos.btnBuscar && elementos.inputBuscar) {
            elementos.btnBuscar.addEventListener('click', () => {
                cargarAvisos(elementos.inputBuscar.value);
            });
            
            elementos.inputBuscar.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    cargarAvisos(elementos.inputBuscar.value);
                }
            });
        }
        
        // Configurar event listeners para manejo de imágenes
        if (elementos.fileUpload) {
            elementos.fileUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    // Validar tamaño (máximo 2MB)
                    if (file.size > 2 * 1024 * 1024) {
                        alert('La imagen es demasiado grande. El tamaño máximo permitido es 2MB.');
                        e.target.value = '';
                        return;
                    }
                    
                    // Validar tipo
                    if (!file.type.match('image.*')) {
                        alert('El archivo seleccionado no es una imagen válida.');
                        e.target.value = '';
                        return;
                    }
                    
                    // Guardar referencia y mostrar vista previa
                    imagenSeleccionada = file;
                    mostrarVistaPrevia(file);
                }
            });
        }
        
        if (elementos.removeImageBtn) {
            elementos.removeImageBtn.addEventListener('click', () => {
                // Resetear la imagen
                imagenSeleccionada = null;
                imagenURL = null; // Indica que la imagen debe ser eliminada
                elementos.imagenPreview.src = '';
                elementos.imagenPreview.style.display = 'none';
                elementos.noImagePlaceholder.style.display = 'block';
                elementos.removeImageBtn.style.display = 'none';
                
                if (elementos.fileUpload) {
                    elementos.fileUpload.value = '';
                }
            });
        }
    }

    // API pública del módulo
    return {
        inicializar: inicializar,
        editar: editarAviso,
        eliminar: eliminarAviso
    };
    })();

    // Inicializar al cargar la página si estamos en la página de avisos
    document.addEventListener('DOMContentLoaded', function() {
        // Verificar si estamos en la página de avisos
        if (document.getElementById('form-aviso')) {
            window.AvisosModule.inicializar();
        }
    });

    // Exponer funciones globales para llamar desde HTML
    window.inicializarGestionAvisos = function() {
        window.AvisosModule.inicializar();
    };
    
    window.editarAviso = function(id) {
        window.AvisosModule.editar(id);
    };
    
    window.confirmarEliminarAviso = function(id) {
        window.AvisosModule.eliminar(id);
    };
}
