/**
 * Gestor de Módulos
 * Gestiona la creación, edición y eliminación de módulos para las encuestas
 */

// Evitar redeclaraciones usando un patrón de módulo autoejecutable
(function() {
    // Variables globales
    let modulos = [];
    let moduloActualId = null;
    let modoEdicionModulo = false;
    
    // Referencias a elementos del DOM
    const tabsModulos = document.getElementById('tabs-modulos');
    const btnAgregarModulo = document.getElementById('btn-agregar-modulo');
    const contenidoModulo = document.getElementById('contenido-modulo');
    const modalModulo = document.getElementById('modal-modulo');
    const formModulo = document.getElementById('form-modulo');
    const btnCancelarModulo = document.getElementById('btn-cancelar-modulo');
    const btnGuardarModulo = document.getElementById('btn-guardar-modulo');
    
    /**
     * Inicializa el gestor de módulos
     */
    function inicializarGestorModulos() {
        console.log('Inicializando gestor de módulos...');
        
        // Configurar eventos
        if (btnAgregarModulo) {
            btnAgregarModulo.addEventListener('click', mostrarModalModulo);
        }
        
        if (formModulo) {
            formModulo.addEventListener('submit', guardarModulo);
        }
        
        if (btnCancelarModulo) {
            btnCancelarModulo.addEventListener('click', cerrarModalModulo);
        }
        
        // Configurar eventos para cerrar el modal
        const cerrarModal = modalModulo.querySelector('.cerrar-modal');
        if (cerrarModal) {
            cerrarModal.addEventListener('click', cerrarModalModulo);
        }
        
        // Ajustar max-height para la lista de tabs si hay muchos módulos
        window.addEventListener('resize', ajustarAlturaTabsModulos);
    }
    
    /**
     * Muestra el modal para crear/editar un módulo
     */
    function mostrarModalModulo(moduloId = null) {
        // Resetear formulario
        formModulo.reset();
        
        // Cambiar título del modal
        const tituloModal = document.getElementById('titulo-modal-modulo');
        
        if (moduloId) {
            // Modo edición
            modoEdicionModulo = true;
            moduloActualId = moduloId;
            
            // Buscar el módulo
            const modulo = modulos.find(m => m.id === moduloId);
            
            if (modulo) {
                // Llenar formulario
                document.getElementById('nombre-modulo').value = modulo.nombre || '';
                document.getElementById('descripcion-modulo').value = modulo.descripcion || '';
                
                // Actualizar título
                if (tituloModal) {
                    tituloModal.textContent = 'Editar módulo';
                }
            }
        } else {
            // Modo creación
            modoEdicionModulo = false;
            moduloActualId = null;
            
            // Actualizar título
            if (tituloModal) {
                tituloModal.textContent = 'Nuevo módulo';
            }
        }
        
        // Mostrar modal
        modalModulo.style.display = 'flex';
    }
    
    /**
     * Cierra el modal de módulo
     */
    function cerrarModalModulo() {
        modalModulo.style.display = 'none';
        modoEdicionModulo = false;
        moduloActualId = null;
    }
    
    /**
     * Guarda el módulo
     */
    function guardarModulo(event) {
        event.preventDefault();
        
        // Obtener datos del formulario
        const nombreModulo = document.getElementById('nombre-modulo').value.trim();
        const descripcionModulo = document.getElementById('descripcion-modulo').value.trim();
        
        // Validar
        if (!nombreModulo) {
            if (window.gestorEncuestas && window.gestorEncuestas.mostrarAlerta) {
                window.gestorEncuestas.mostrarAlerta('El nombre del módulo es obligatorio', 'error');
            }
            return;
        }
        
        // Crear objeto del módulo
        const modulo = {
            nombre: nombreModulo,
            descripcion: descripcionModulo,
            preguntas: []
        };
        
        // Asignar ID si es nuevo módulo, o usar el existente si es edición
        if (modoEdicionModulo && moduloActualId) {
            modulo.id = moduloActualId;
            
            // Actualizar el módulo existente
            const indice = modulos.findIndex(m => m.id === moduloActualId);
            if (indice !== -1) {
                // Preservar las preguntas existentes
                modulo.preguntas = modulos[indice].preguntas || [];
                modulos[indice] = modulo;
            }
        } else {
            // Generar ID único para el nuevo módulo
            modulo.id = 'modulo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            // Verificar límite de módulos
            if (modulos.length >= 10) {
                if (window.gestorEncuestas && window.gestorEncuestas.mostrarAlerta) {
                    window.gestorEncuestas.mostrarAlerta('No se pueden agregar más de 10 módulos', 'error');
                }
                return;
            }
            
            // Agregar a la lista de módulos
            modulos.push(modulo);
        }
        
        // Actualizar la interfaz
        actualizarTabsModulos();
        
        // Seleccionar el módulo recién creado/editado
        seleccionarModulo(modulo.id);
        
        // Cerrar el modal
        cerrarModalModulo();
        
        // Mostrar mensaje de éxito
        if (window.gestorEncuestas && window.gestorEncuestas.mostrarAlerta) {
            window.gestorEncuestas.mostrarAlerta(
                modoEdicionModulo ? 'Módulo actualizado correctamente' : 'Módulo creado correctamente',
                'success'
            );
        }
    }
    
    /**
     * Actualiza la visualización de los tabs de módulos
     */
    function actualizarTabsModulos() {
        if (!tabsModulos) return;
        
        // Limpiar tabs existentes
        tabsModulos.innerHTML = '';
        
        // Crear tabs para cada módulo
        modulos.forEach((modulo) => {
            const tab = document.createElement('div');
            tab.className = 'tab-modulo';
            tab.dataset.moduloId = modulo.id;
            tab.textContent = modulo.nombre;
            
            // Agregar evento de clic
            tab.addEventListener('click', () => seleccionarModulo(modulo.id));
            
            tabsModulos.appendChild(tab);
        });
        
        // Ajustar altura de los tabs
        ajustarAlturaTabsModulos();
        
        // Si no hay tabs activos pero hay módulos, seleccionar el primero
        if (modulos.length > 0 && !document.querySelector('.tab-modulo.activo')) {
            seleccionarModulo(modulos[0].id);
        }
        
        // Actualizar visibilidad del botón de agregar módulo
        if (btnAgregarModulo) {
            btnAgregarModulo.style.display = modulos.length >= 10 ? 'none' : 'flex';
        }
    }
    
    /**
     * Selecciona un módulo y muestra su contenido
     */
    function seleccionarModulo(moduloId) {
        if (!tabsModulos || !contenidoModulo) return;
        
        // Desactivar todos los tabs
        tabsModulos.querySelectorAll('.tab-modulo').forEach(tab => {
            tab.classList.remove('activo');
        });
        
        // Activar el tab seleccionado
        const tabSeleccionado = tabsModulos.querySelector(`.tab-modulo[data-modulo-id="${moduloId}"]`);
        if (tabSeleccionado) {
            tabSeleccionado.classList.add('activo');
        }
        
        // Mostrar contenido del módulo
        const modulo = modulos.find(m => m.id === moduloId);
        if (modulo) {
            moduloActualId = moduloId;
            
            // Mostrar contenido del módulo (nombre, descripción y preguntas)
            mostrarContenidoModulo(modulo);
        }
    }
    
    /**
     * Muestra el contenido de un módulo
     */
    function mostrarContenidoModulo(modulo) {
        if (!contenidoModulo) return;
        
        // Crear contenido HTML para el módulo
        let html = `
            <div class="cabecera-modulo">
                <h3>${modulo.nombre}</h3>
                <div class="acciones-modulo">
                    <button type="button" class="btn-editar-modulo" title="Editar módulo">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" class="btn-eliminar-modulo" title="Eliminar módulo">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <p class="descripcion-modulo">${modulo.descripcion || 'Sin descripción'}</p>
            
            <div class="seccion-preguntas">
                <h4>Preguntas del módulo</h4>
                <p class="placeholder-preguntas">En desarrollo: Aquí se mostrarán las preguntas del módulo</p>
                <div class="lista-preguntas" id="lista-preguntas">
                    <!-- Aquí se cargarán las preguntas -->
                </div>
                <button type="button" class="btn-agregar-pregunta" id="btn-agregar-pregunta">
                    <i class="fas fa-plus"></i> Agregar pregunta
                </button>
            </div>
        `;
        
        contenidoModulo.innerHTML = html;
        
        // Configurar eventos para los botones
        const btnEditarModulo = contenidoModulo.querySelector('.btn-editar-modulo');
        const btnEliminarModulo = contenidoModulo.querySelector('.btn-eliminar-modulo');
        const btnAgregarPregunta = contenidoModulo.querySelector('#btn-agregar-pregunta');
        
        if (btnEditarModulo) {
            btnEditarModulo.addEventListener('click', () => mostrarModalModulo(modulo.id));
        }
        
        if (btnEliminarModulo) {
            btnEliminarModulo.addEventListener('click', () => eliminarModulo(modulo.id));
        }
        
        if (btnAgregarPregunta && window.gestorPreguntas && window.gestorPreguntas.mostrarModalPregunta) {
            btnAgregarPregunta.addEventListener('click', () => window.gestorPreguntas.mostrarModalPregunta());
        }
    }
    
    /**
     * Elimina un módulo
     */
    function eliminarModulo(moduloId) {
        if (confirm('¿Estás seguro de que deseas eliminar este módulo? Se eliminarán todas las preguntas asociadas.')) {
            // Filtrar el módulo de la lista
            modulos = modulos.filter(m => m.id !== moduloId);
            
            // Actualizar interfaz
            actualizarTabsModulos();
            
            // Si no hay módulos, mostrar contenido vacío
            if (modulos.length === 0) {
                contenidoModulo.innerHTML = `
                    <div class="placeholder-modulo">
                        <p>Selecciona o crea un módulo para comenzar</p>
                    </div>
                `;
                moduloActualId = null;
            } else {
                // Seleccionar el primer módulo
                seleccionarModulo(modulos[0].id);
            }
            
            // Mostrar mensaje de éxito
            if (window.gestorEncuestas && window.gestorEncuestas.mostrarAlerta) {
                window.gestorEncuestas.mostrarAlerta('Módulo eliminado correctamente', 'success');
            }
        }
    }
    
    /**
     * Ajusta la altura de los tabs de módulos
     */
    function ajustarAlturaTabsModulos() {
        if (!tabsModulos) return;
        
        // Asegurarse de que los tabs sean scrollables si hay muchos
        if (tabsModulos.scrollWidth > tabsModulos.clientWidth) {
            tabsModulos.style.overflowX = 'auto';
        } else {
            tabsModulos.style.overflowX = 'hidden';
        }
    }
    
    /**
     * Carga módulos existentes
     */
    function cargarModulosExistentes(modulosData) {
        modulos = modulosData;
        actualizarTabsModulos();
        
        // Seleccionar el primer módulo si existe
        if (modulos.length > 0) {
            seleccionarModulo(modulos[0].id);
        }
    }
    
    /**
     * Resetea los módulos
     */
    function resetearModulos() {
        modulos = [];
        moduloActualId = null;
        modoEdicionModulo = false;
        
        actualizarTabsModulos();
        
        // Mostrar contenido vacío
        if (contenidoModulo) {
            contenidoModulo.innerHTML = `
                <div class="placeholder-modulo">
                    <p>Selecciona o crea un módulo para comenzar</p>
                </div>
            `;
        }
    }
    
    /**
     * Retorna la lista de módulos
     */
    function obtenerModulos() {
        return modulos;
    }
    
    /**
     * Retorna el ID del módulo actual
     */
    function obtenerModuloActualId() {
        return moduloActualId;
    }
    
    // Exportar funciones para uso en otros módulos
    window.gestorModulos = {
        inicializar: inicializarGestorModulos,
        mostrarModalModulo: mostrarModalModulo,
        eliminarModulo: eliminarModulo
    };
    window.cargarModulosExistentes = cargarModulosExistentes;
    window.resetearModulos = resetearModulos;
    window.obtenerModulos = obtenerModulos;
    window.obtenerModuloActualId = obtenerModuloActualId;
    
    // Inicializar cuando el DOM esté cargado
    document.addEventListener('DOMContentLoaded', inicializarGestorModulos);
})();
