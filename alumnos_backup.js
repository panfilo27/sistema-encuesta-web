// Referencia global a elementos DOM frecuentemente utilizados
let elementos;

// Variable para guardar temporalmente datos del alumno en ediciÃ³n
let alumnoActual = null;
let modoEdicion = false;

// Nota: Usamos la instancia global de db definida en firebase-init.js

// FunciÃ³n para obtener referencias a elementos DOM
function obtenerReferencias() {
    return {
        form: document.getElementById('form-alumno'),
        tablaAlumnos: document.getElementById('tabla-alumnos'),
        btnBuscar: document.getElementById('btn-buscar-alumno'),
        inputBuscar: document.getElementById('buscar-alumno'),
        btnCancelar: document.getElementById('btn-cancelar'),
        selectCarrera: document.getElementById('carrera-alumno'),
        inputId: document.getElementById('alumno-id')
    };
}

// FunciÃ³n de inicializaciÃ³n que se ejecuta una vez que la pÃ¡gina estÃ¡ cargada
function inicializarGestionAlumnos() {
    console.log('Inicializando gestiÃ³n de alumnos...');
    
    // Obtener referencias a los elementos DOM
    elementos = obtenerReferencias();
    
    // Verificar si los elementos estÃ¡n disponibles
    if (!elementos.form || !elementos.tablaAlumnos) {
        console.error('No se pudieron obtener los elementos DOM necesarios');
        return;
    }
    
    console.log('Elementos DOM obtenidos correctamente');
    
    // Cargar lista de alumnos
    cargarAlumnos();
    
    // Cargar carreras para el selector
    cargarCarreras();
    
    // Event Listeners
    elementos.form.addEventListener('submit', guardarAlumno);
    elementos.btnBuscar.addEventListener('click', buscarAlumno);
    elementos.btnCancelar.addEventListener('click', cancelarEdicion);
    
    console.log('Event listeners configurados');
}

// FunciÃ³n para cargar alumnos desde Firestore
async function cargarAlumnos(busqueda = '') {
    try {
        if (!elementos || !elementos.tablaAlumnos) {
            console.error('No se pudo acceder a la tabla de alumnos');
            return;
        }
        
        elementos.tablaAlumnos.innerHTML = '<div class="loading-message">Cargando alumnos...</div>';
        
        let query = db.collection('alumnos');
        
        // Si hay texto de bÃºsqueda, filtrar resultados
        let snapshot;
        if (busqueda) {
            // Convertir bÃºsqueda a minÃºsculas para bÃºsqueda no sensible a mayÃºsculas
            busqueda = busqueda.toLowerCase();
            
            // Primero intentamos buscar por nÃºmero de control exacto
            const byNumeroControl = await query.where('numeroControl', '==', busqueda).get();
            
            // Luego obtenemos todos para filtrar por nombre despuÃ©s
            const todos = await query.get();
            
            // Combinar resultados (primero por nÃºmero de control, luego por nombre)
            const resultados = [];
            
            // Agregar resultados por nÃºmero de control
            byNumeroControl.forEach(doc => {
                resultados.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            // Agregar resultados por nombre si no ya estÃ¡n
            todos.forEach(doc => {
                const alumno = doc.data();
                const nombreCompleto = `${alumno.nombre} ${alumno.apellidoPaterno} ${alumno.apellidoMaterno || ''}`.toLowerCase();
                
                // Si el nombre contiene la bÃºsqueda y no estÃ¡ ya en resultados
                if (nombreCompleto.includes(busqueda)) {
                    // Verificar si ya existe por ID
                    const existe = resultados.some(a => a.id === doc.id);
                    if (!existe) {
                        resultados.push({
                            id: doc.id,
                            ...alumno
                        });
                    }
                }
            });
            
            // Mostrar resultados
            mostrarTablaAlumnos(resultados);
        } else {
            // Sin bÃºsqueda, mostrar todos
            snapshot = await query.get();
            const alumnos = [];
            snapshot.forEach(doc => {
                alumnos.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            mostrarTablaAlumnos(alumnos);
        }
    } catch (error) {
        console.error("Error al cargar alumnos:", error);
        elementos.tablaAlumnos.innerHTML = `<div class="error-message">Error al cargar datos: ${error.message}</div>`;
    }
}

// FunciÃ³n para mostrar la tabla de alumnos
function mostrarTablaAlumnos(datos) {
    if (!datos || datos.length === 0) {
        elementos.tablaAlumnos.innerHTML = `
            <div class="empty-message">
                <p>No se encontraron alumnos. Agregue uno nuevo usando el formulario.</p>
            </div>
        `;
        return;
    }
    
    const html = datos.map(alumno => {
        return `
            <tr>
                <td>${alumno.numeroControl || 'N/A'}</td>
                <td>${alumno.nombre} ${alumno.apellidoPaterno} ${alumno.apellidoMaterno || ''}</td>
                <td>${alumno.carrera || 'Sin asignar'}</td>
                <td>
                    <button class="acciones-btn btn-editar" onclick="editarAlumno('${alumno.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="acciones-btn btn-eliminar" onclick="confirmarEliminar('${alumno.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    elementos.tablaAlumnos.innerHTML = `
        <table>
            <thead>
                 <tr>
                    <th>No. Control</th>
                    <th>Nombre Completo</th>
                    <th>Carrera</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${html}
            </tbody>
        </table>
    `;
}

// FunciÃ³n para cargar carreras desde Firestore
async function cargarCarreras() {
    try {
        if (!elementos || !elementos.selectCarrera) {
            console.error('No se pudo acceder al selector de carreras');
            return;
        }
        
        elementos.selectCarrera.innerHTML = '<option value="">Sin asignar</option>';
        console.log('Consultando carreras en Firestore...');
        
        const snapshot = await db.collection('carreras').get();
        
        console.log(`Se encontraron ${snapshot.size} carreras`);
        
        if (snapshot.empty) {
            elementos.selectCarrera.innerHTML += '<option value="" disabled>No hay carreras disponibles</option>';
            return;
        }
        
        // Ordenar carreras por nombre
        const carreras = [];
        snapshot.forEach(doc => {
            carreras.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        carreras.sort((a, b) => a.nombre.localeCompare(b.nombre));
        
        // AÃ±adir carreras al selector
        for (const carrera of carreras) {
            elementos.selectCarrera.innerHTML += `<option value="${carrera.nombre}">${carrera.nombre}</option>`;
        }
    } catch (error) {
        console.error("Error al cargar carreras:", error);
        elementos.selectCarrera.innerHTML += '<option value="" disabled>Error al cargar carreras</option>';
    }
}

// FunciÃ³n para buscar alumnos
function buscarAlumno() {
    const termino = elementos.inputBuscar.value.trim();
    cargarAlumnos(termino);
}

// FunciÃ³n para guardar un alumno (nuevo o ediciÃ³n)
async function guardarAlumno(e) {
    e.preventDefault();
    
    try {
        // Obtener valores del formulario
        const nombre = document.getElementById('nombre-alumno').value.trim();
        const apellidoPaterno = document.getElementById('apellido-paterno-alumno').value.trim();
        const apellidoMaterno = document.getElementById('apellido-materno-alumno').value.trim();
        const numeroControl = document.getElementById('numero-control').value.trim();
        const nip = document.getElementById('nip-alumno').value.trim();
        const confirmarNip = document.getElementById('confirmar-nip').value.trim();
        const carrera = elementos.selectCarrera.value;
        const alumnoId = elementos.inputId.value;
        
        // Validaciones bÃ¡sicas
        if (!nombre || !apellidoPaterno || !numeroControl || !nip) {
            alert('Por favor complete todos los campos obligatorios');
            return;
        }
        
        // Validar NIP (mÃ­nimo 4 caracteres)
        if (nip.length < 4) {
            alert('El NIP debe tener al menos 4 caracteres');
            return;
        }
        
        // Validar que las contraseÃ±as coincidan
        if (nip !== confirmarNip) {
            alert('Los NIPs no coinciden');
            return;
        }
        
        // Crear objeto con datos del alumno
        const alumnoData = {
            nombre,
            apellidoPaterno,
            apellidoMaterno,
            numeroControl,
            carrera,
            fechaActualizacion: new Date()
        };
        
        // En modo ediciÃ³n no actualizamos el NIP a menos que se haya cambiado
        if (!modoEdicion || (modoEdicion && nip !== '******')) {
            alumnoData.nip = nip;
        }
        
        // Verificar que el nÃºmero de control no estÃ© duplicado
        const numControlQuery = await db.collection('alumnos')
            .where('numeroControl', '==', numeroControl)
            .get();
        
        if (!modoEdicion && !numControlQuery.empty) {
            alert('Ya existe un alumno con ese nÃºmero de control');
            return;
        }
        
        if (modoEdicion && !numControlQuery.empty) {
            // En modo ediciÃ³n, verificar que sea el mismo alumno
            const existeOtroAlumno = numControlQuery.docs.some(doc => doc.id !== alumnoId);
            if (existeOtroAlumno) {
                alert('Ese nÃºmero de control ya estÃ¡ asignado a otro alumno');
                return;
            }
        }
        
        // Si es alumno nuevo, agregar fecha de creaciÃ³n
        if (!modoEdicion) {
            alumnoData.fechaCreacion = new Date();
        }
        
        // Guardar en Firestore
        if (modoEdicion) {
            // Modo ediciÃ³n: actualizar documento existente
            await db.collection('alumnos').doc(alumnoId).update(alumnoData);
            console.log(`Alumno ${alumnoId} actualizado correctamente`);
        } else {
            // Modo nuevo: crear documento
            const docRef = await db.collection('alumnos').add(alumnoData);
            console.log(`Nuevo alumno creado con ID: ${docRef.id}`);
        }
        
        // Limpiar formulario y recargar datos
        limpiarFormulario();
        cargarAlumnos();
        
    } catch (error) {
        console.error('Error al guardar alumno:', error);
        alert(`Error al guardar: ${error.message}`);
    }
}

// FunciÃ³n para editar un alumno existente
async function editarAlumno(id) {
    try {
        // Activar modo ediciÃ³n
        modoEdicion = true;
        
        // Obtener datos del alumno
        const doc = await db.collection('alumnos').doc(id).get();
        
        if (!doc.exists) {
            alert('No se encontrÃ³ el alumno especificado');
            return;
        }
        
        // Guardar datos del alumno para referencia
        alumnoActual = {
            id: doc.id,
            ...doc.data()
        };
        
        // Llenar el formulario con los datos
        document.getElementById('nombre-alumno').value = alumnoActual.nombre || '';
        document.getElementById('apellido-paterno-alumno').value = alumnoActual.apellidoPaterno || '';
        document.getElementById('apellido-materno-alumno').value = alumnoActual.apellidoMaterno || '';
        document.getElementById('numero-control').value = alumnoActual.numeroControl || '';
        
        // Para la contraseÃ±a usamos asteriscos por seguridad
        document.getElementById('nip-alumno').value = '******';
        document.getElementById('confirmar-nip').value = '******';
        
        // Seleccionar carrera si existe
        if (alumnoActual.carrera) {
            elementos.selectCarrera.value = alumnoActual.carrera;
        } else {
            elementos.selectCarrera.value = '';
        }
        
        // Establecer ID para referencia en el formulario
        elementos.inputId.value = id;
        
        // Cambiar texto del botÃ³n de submit
        const submitBtn = elementos.form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Actualizar';
        }
        
        // Hacer visible el botÃ³n cancelar
        if (elementos.btnCancelar) {
            elementos.btnCancelar.style.display = 'inline-block';
        }
        
        // Desplazarse al formulario
        elementos.form.scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error al cargar alumno para editar:', error);
        alert(`Error: ${error.message}`);
    }
}

// FunciÃ³n para cancelar la ediciÃ³n
function cancelarEdicion() {
    modoEdicion = false;
    alumnoActual = null;
    limpiarFormulario();
    
    // Cambiar texto del botÃ³n de submit de vuelta a 'Guardar'
    const submitBtn = elementos.form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.textContent = 'Guardar';
    }
}

// FunciÃ³n para confirmar eliminaciÃ³n
function confirmarEliminar(id) {
    if (confirm('Â¿EstÃ¡ seguro que desea eliminar este alumno? Esta acciÃ³n no se puede deshacer.')) {
        eliminarAlumno(id);
    }
}

// FunciÃ³n para eliminar un alumno
async function eliminarAlumno(id) {
    try {
        await db.collection('alumnos').doc(id).delete();
        console.log(`Alumno ${id} eliminado correctamente`);
        cargarAlumnos();
        
        // Si estÃ¡bamos editando este alumno, limpiar formulario
        }
        
        carrerasQuery.forEach(doc => {
            const carrera = doc.data();
            elementos.selectCarrera.innerHTML += `<option value="${carrera.nombre}">${carrera.nombre}</option>`;
        });
        
    } catch (error) {
        console.error("Error al cargar carreras:", error);
        elementos.selectCarrera.innerHTML += '<option value="" disabled>Error al cargar carreras</option>';
    }
}
