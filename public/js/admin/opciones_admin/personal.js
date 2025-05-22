// Módulo de gestión de personal encapsulado en un namespace

// Evitar redeclarar el módulo si ya existe
if (typeof window.PersonalModule !== 'undefined') {
    // Si el módulo ya existe, solo actualizar la inicialización global y salir
    window.inicializarGestionPersonal = function() {
        window.PersonalModule.inicializar();
    };
    
    window.editarPersonal = function(id) {
        window.PersonalModule.editar(id);
    };
    
    window.confirmarEliminar = function(id) {
        window.PersonalModule.eliminar(id);
    };
    
    console.log('PersonalModule ya existe, no se redeclara.');
} else {
    // Si el módulo no existe, crearlo
    window.PersonalModule = (function() {
    // Variables privadas del módulo
    let elementos = null;
    let personalActual = null;
    let modoEdicion = false;

    // Función para obtener referencias a elementos DOM
    function obtenerReferencias() {
        return {
            form: document.getElementById('form-personal'),
            tablaPersonal: document.getElementById('tabla-personal'),
            btnBuscar: document.getElementById('btn-buscar-personal'),
            inputBuscar: document.getElementById('buscar-personal'),
            btnCancelar: document.getElementById('btn-cancelar'),
            selectDepartamento: document.getElementById('departamento-personal'),
            inputId: document.getElementById('personal-id')
        };
    }

    // Función para verificar si un elemento existe
    function elementoExiste(elemento) {
        return elemento !== null && elemento !== undefined;
    }

    // Función para cargar personal desde Firestore
    async function cargarPersonal(busqueda = '') {
        try {
            if (elementoExiste(elementos.tablaPersonal)) {
                elementos.tablaPersonal.innerHTML = '<div class="loading-message">Cargando personal...</div>';
            }
            
            let query = db.collection('usuario').where('rolUser', '==', 'jefedepartamento');
            
            if (busqueda) {
                // Firestore no admite búsquedas de texto completo, así que usamos una condición de igualdad
                // Esto filtrará por el usuario exacto (no es ideal pero sirve para este ejemplo)
                query = query.where('usuario', '==', busqueda);
            }
            
            const snapshot = await query.get();
            
            if (snapshot.empty) {
                elementos.tablaPersonal.innerHTML = `
                    <div class="empty-message">
                        <p>No se encontraron jefes de departamento${busqueda ? ' para la búsqueda: ' + busqueda : ''}.</p>
                    </div>
                `;
                return;
            }
            
            const personal = [];
            snapshot.forEach(doc => {
                personal.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            mostrarTablaPersonal(personal);
            
        } catch (error) {
            console.error("Error al cargar personal:", error);
            elementos.tablaPersonal.innerHTML = `<div class="error-message">Error al cargar datos: ${error.message}</div>`;
        }
    }

    // Función para cargar departamentos (carreras) desde Firestore
    async function cargarDepartamentos() {
        try {
            if (!elementos.selectDepartamento) {
                console.error('No se pudo acceder al selector de departamentos');
                return;
            }
            
            elementos.selectDepartamento.innerHTML = '<option value="">Sin asignar</option>';
            console.log('Consultando carreras en Firestore...');
            
            const snapshot = await db.collection('carreras').get();
            
            console.log(`Se encontraron ${snapshot.size} carreras`);
            
            if (snapshot.empty) {
                elementos.selectDepartamento.innerHTML += '<option value="" disabled>No hay carreras disponibles</option>';
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
            
            // Añadir carreras al selector
            for (const carrera of carreras) {
                // Obtener nombre de jefe de departamento si existe
                let infoJefe = '';
                if (carrera.jefeDepartamentoId) {
                    try {
                        const docJefe = await db.collection('usuario').doc(carrera.jefeDepartamentoId).get();
                        if (docJefe.exists) {
                            const jefe = docJefe.data();
                            const nombreJefe = `${jefe.nombre} ${jefe.apellidoPaterno}`;
                            infoJefe = ` (Asignada a: ${nombreJefe})`;
                        }
                    } catch (error) {
                        console.error('Error al obtener jefe:', error);
                    }
                }
                
                elementos.selectDepartamento.innerHTML += `<option value="${carrera.nombre}">${carrera.nombre}${infoJefe}</option>`;
            }
            
            console.log(`Se cargaron ${carreras.length} departamentos`);
        } catch (error) {
            console.error("Error al cargar carreras:", error);
            elementos.selectDepartamento.innerHTML += '<option value="" disabled>Error al cargar carreras</option>';
        }
    }

    // Función para mostrar la tabla de personal
    function mostrarTablaPersonal(datos) {
        if (!datos || datos.length === 0) {
            elementos.tablaPersonal.innerHTML = `
                <div class="empty-message">
                    <p>No se encontraron jefes de departamento. Agregue uno nuevo usando el formulario.</p>
                </div>
            `;
            return;
        }
        
        const html = datos.map(personal => {
            return `
                <tr>
                    <td>${personal.usuario || 'N/A'}</td>
                    <td>${personal.nombre} ${personal.apellidoPaterno} ${personal.apellidoMaterno || ''}</td>
                    <td>${personal.departamento || 'N/A'}</td>
                    <td>
                        <button class="acciones-btn btn-editar" onclick="editarPersonal('${personal.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="acciones-btn btn-eliminar" onclick="confirmarEliminar('${personal.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        elementos.tablaPersonal.innerHTML = `
            <table>
                <thead>
                     <tr>
                        <th>Usuario</th>
                        <th>Nombre</th>
                        <th>Departamento</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${html}
                </tbody>
            </table>
        `;
    }

    // Función para buscar personal por nombre de usuario
    function buscarPersonal() {
        const busqueda = elementos.inputBuscar.value.trim();
        cargarPersonal(busqueda);
    }

    // Función para guardar un nuevo personal o actualizar uno existente
    async function guardarPersonal(e) {
        e.preventDefault();
        
        if (!mostrarErroresFormulario(elementos.form)) {
            return; // Si hay errores, no continuamos
        }
        
        // Obtenemos los datos del formulario directamente usando los IDs correctos
        const nombre = document.getElementById('nombre-personal').value;
        const apellidoPaterno = document.getElementById('apellido-paterno').value;
        const apellidoMaterno = document.getElementById('apellido-materno').value || '';
        const usuario = document.getElementById('usuario-personal').value;
        const password = document.getElementById('contrasena-personal').value;
        const confirmarPassword = document.getElementById('confirmar-contrasena').value;
        const departamento = elementos.selectDepartamento.value;
        const id = elementos.inputId.value;
        
        // Validación de contraseñas
        if (password !== confirmarPassword) {
            alert('Las contraseñas no coinciden');
            return;
        }
        
        if (!modoEdicion && password.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres');
            return;
        }
        
        try {
            const personalData = {
                nombre,
                apellidoPaterno,
                apellidoMaterno,
                usuario,
                departamento,
                rolUser: 'jefedepartamento', // Este rol es fijo para este formulario
                updatedAt: new Date().getTime()
            };
            
            if (modoEdicion) {
                // Actualización de un personal existente
                if (password && password.length >= 6) {
                    // Solo actualizamos la contraseña si se ha ingresado una nueva
                    personalData.password = password;
                }
                
                await db.collection('usuario').doc(id).update(personalData);
                alert('Personal actualizado correctamente');
            } else {
                // Creación de un nuevo personal
                personalData.password = password;
                personalData.createdAt = new Date().getTime();
                
                // Verificar si ya existe un usuario con ese nombre
                const existingUser = await db.collection('usuario')
                    .where('usuario', '==', usuario)
                    .get();
                
                if (!existingUser.empty) {
                    alert('Ya existe un usuario con ese nombre de usuario');
                    return;
                }
                
                await db.collection('usuario').add(personalData);
                alert('Personal agregado correctamente');
            }
            
            // Actualizar la carrera correspondiente si se seleccionó un departamento
            if (departamento) {
                const carreraSnapshot = await db.collection('carreras')
                    .where('nombre', '==', departamento)
                    .get();
                
                if (!carreraSnapshot.empty) {
                    const carreraDoc = carreraSnapshot.docs[0];
                    
                    // Si hay un jefe anterior, actualizar su departamento a vacío
                    const jefeAnteriorId = carreraDoc.data().jefeDepartamentoId;
                    if (jefeAnteriorId && jefeAnteriorId !== id) {
                        await db.collection('usuario').doc(jefeAnteriorId).update({
                            departamento: ''
                        });
                    }
                    
                    // Actualizar la carrera con el nuevo jefe
                    await db.collection('carreras').doc(carreraDoc.id).update({
                        jefeDepartamentoId: id,
                        fechaActualizacion: new Date().getTime()
                    });
                } else {
                    // Si la carrera no existe, la creamos
                    await db.collection('carreras').add({
                        nombre: departamento,
                        jefeDepartamentoId: id,
                        fechaCreacion: new Date().getTime(),
                        fechaActualizacion: new Date().getTime()
                    });
                }
            } else if (personalActual && personalActual.departamento) {
                // Si se quitó el departamento, también actualizar la carrera
                const carreraSnapshot = await db.collection('carreras')
                    .where('nombre', '==', personalActual.departamento)
                    .where('jefeDepartamentoId', '==', id)
                    .get();
                
                if (!carreraSnapshot.empty) {
                    await db.collection('carreras').doc(carreraSnapshot.docs[0].id).update({
                        jefeDepartamentoId: '',
                        fechaActualizacion: new Date().getTime()
                    });
                }
            }
            
            // Limpiar formulario y recargar datos
            limpiarFormulario();
            cargarPersonal();
            cargarDepartamentos();
            
        } catch (error) {
            console.error('Error al guardar personal:', error);
            alert(`Error al guardar: ${error.message}`);
        }
    }

    // Función para editar un personal existente
    async function editarPersonal(id) {
        try {
            const doc = await db.collection('usuario').doc(id).get();
            
            if (!doc.exists) {
                alert('No se encontró el personal solicitado');
                return;
            }
            
            personalActual = {
                id: doc.id,
                ...doc.data()
            };
            
            // Llenar el formulario con los datos usando los ID correctos
            document.getElementById('nombre-personal').value = personalActual.nombre || '';
            document.getElementById('apellido-paterno').value = personalActual.apellidoPaterno || '';
            document.getElementById('apellido-materno').value = personalActual.apellidoMaterno || '';
            document.getElementById('usuario-personal').value = personalActual.usuario || '';
            document.getElementById('contrasena-personal').value = '';
            document.getElementById('contrasena-personal').required = false;
            document.getElementById('confirmar-contrasena').value = '';
            document.getElementById('confirmar-contrasena').required = false;
            
            // Seleccionar el departamento si existe
            if (personalActual.departamento) {
                Array.from(elementos.selectDepartamento.options).forEach(option => {
                    if (option.value === personalActual.departamento) {
                        option.selected = true;
                    }
                });
            } else {
                elementos.selectDepartamento.selectedIndex = 0;
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
            document.getElementById('nombre-personal').focus();
            
        } catch (error) {
            console.error('Error al cargar datos para editar:', error);
            alert(`Error al cargar datos: ${error.message}`);
        }
    }

    // Función para limpiar el formulario y salir del modo edición
    function limpiarFormulario() {
        elementos.form.reset();
        elementos.inputId.value = '';
        
        // Restaurar campos requeridos para contraseñas
        elementos.form.elements['contrasena'].required = true;
        elementos.form.elements['confirmar-contrasena'].required = true;
        
        // Restaurar texto del botón
        const submitBtn = elementos.form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Guardar';
        }
        
        // Limpiar variable de personal actual y modo edición
        personalActual = null;
        modoEdicion = false;
    }

    // Función para cancelar la edición
    function cancelarEdicion() {
        limpiarFormulario();
    }

    // Función para confirmar eliminación de un personal
    function confirmarEliminar(id) {
        if (confirm('¿Está seguro de eliminar este jefe de departamento? Esta acción no se puede deshacer.')) {
            eliminarPersonal(id);
        }
    }

    // Función para eliminar un personal de Firestore
    async function eliminarPersonal(id) {
        try {
            // Obtener los datos del personal antes de eliminarlo
            const docPersonal = await db.collection('usuario').doc(id).get();
            
            if (!docPersonal.exists) {
                alert('No se encontró el personal a eliminar');
                return;
            }
            
            const personal = docPersonal.data();
            
            // Eliminar el personal
            await db.collection('usuario').doc(id).delete();
            
            // Si tiene departamento, actualizar la carrera correspondiente
            if (personal.departamento) {
                const carreraSnapshot = await db.collection('carreras')
                    .where('nombre', '==', personal.departamento)
                    .where('jefeDepartamentoId', '==', id)
                    .get();
                
                if (!carreraSnapshot.empty) {
                    await db.collection('carreras').doc(carreraSnapshot.docs[0].id).update({
                        jefeDepartamentoId: '',
                        fechaActualizacion: new Date().getTime()
                    });
                }
            }
            
            alert('Personal eliminado correctamente');
            cargarPersonal();
            cargarDepartamentos();
            
        } catch (error) {
            console.error('Error al eliminar personal:', error);
            alert(`Error al eliminar: ${error.message}`);
        }
    }

    // Verificar si hay errores en el formulario y mostrarlos
    function mostrarErroresFormulario(form) {
        let primerElementoConError = null;
        
        // Verificar cada campo requerido
        Array.from(form.elements).forEach(elemento => {
            if (elemento.validity && !elemento.validity.valid) {
                elemento.classList.add('campo-error');
                
                if (!primerElementoConError) {
                    primerElementoConError = elemento;
                }
            } else {
                elemento.classList.remove('campo-error');
            }
        });
        
        // Hacer foco en el primer elemento con error
        if (primerElementoConError) {
            primerElementoConError.focus();
            return false;
        }
        
        return true;
    }

    // Función de inicialización que se ejecuta una vez que la página está cargada
    function inicializarGestionPersonal() {
        console.log('Inicializando gestión de personal...');
        
        // Obtener referencias a los elementos DOM
        elementos = obtenerReferencias();
        
        // Verificar si los elementos están disponibles
        if (!elementos.form || !elementos.tablaPersonal) {
            console.error('No se pudieron obtener los elementos DOM necesarios');
            return;
        }
        
        console.log('Elementos DOM obtenidos correctamente');
        
        // Cargar lista de personal
        cargarPersonal();
        
        // Cargar departamentos (carreras) para el selector
        cargarDepartamentos();
        
        // Event Listeners - Verificar que cada elemento existe antes de agregar el listener
        if (elementoExiste(elementos.form)) {
            elementos.form.addEventListener('submit', guardarPersonal);
        } else {
            console.error('Elemento form-personal no encontrado');
        }
        
        if (elementoExiste(elementos.btnBuscar)) {
            elementos.btnBuscar.addEventListener('click', buscarPersonal);
        }
        
        if (elementoExiste(elementos.inputBuscar)) {
            elementos.inputBuscar.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') buscarPersonal();
            });
        }
        
        if (elementoExiste(elementos.btnCancelar)) {
            elementos.btnCancelar.addEventListener('click', cancelarEdicion);
        }
        
        console.log('Inicialización de gestión de personal completada');
    }

    // Retornar las funciones públicas que queremos exponer
    return {
        inicializar: inicializarGestionPersonal,
        editar: editarPersonal,
        eliminar: confirmarEliminar
    };
})();

// Exponer funciones globalmente para eventos HTML
window.inicializarGestionPersonal = function() {
    window.PersonalModule.inicializar();
};

window.editarPersonal = function(id) {
    window.PersonalModule.editar(id);
};

window.confirmarEliminar = function(id) {
    window.PersonalModule.eliminar(id);
};
}
