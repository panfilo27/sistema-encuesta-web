const mainPanel = document.querySelector('.main_panel');
const contenidoInicial = mainPanel.innerHTML;

// Variable global para almacenar la información del departamento del jefe
let departamentoInfo = {
    jefeDepartamentoId: null,
    nombreDepartamento: null,
    carreraId: null,
    nombreCarrera: null
};

document.getElementById("logo-itver").addEventListener("click", () => {
    mainPanel.innerHTML = contenidoInicial;
});

const rutas = {
    'btn-alumnos': "opciones_jefes/alumnos.html",
    'btn-avisos': "opciones_jefes/avisos.html"
};

Object.keys(rutas).forEach(id => {
    const btn = document.getElementById(id);
    btn.addEventListener('click', async () => {
        try {
            const respuesta = await fetch(rutas[id]);
            if (!respuesta.ok) {
                throw new Error(`Error al cargar ${rutas[id]}: ${respuesta.statusText}`);
            }
            mainPanel.innerHTML = await respuesta.text();

            const script = document.createElement("script");

            switch (id) {
                case 'btn-alumnos':
                    script.src = "../js/jefes/opciones_jefes/alumnos.js";
                    script.onload = () => {
                        if (typeof inicializarGestorAlumnos === 'function') {
                            // Pasar la información del departamento/carrera para filtrar alumnos
                            inicializarGestorAlumnos(departamentoInfo);
                        }
                    };
                    break;



                case 'btn-avisos':
                    script.src = "../js/jefes/opciones_jefes/avisos.js";
                    script.onload = () => {
                        console.log('Script de gestión de avisos cargado');
                        if (typeof inicializarGestionAvisos === 'function') {
                            // Los avisos podrían filtrarse por departamento o ser generales
                            setTimeout(() => inicializarGestionAvisos(departamentoInfo), 100);
                        } else {
                            console.error('No se encontró la función inicializarGestionAvisos');
                        }
                    };
                    break;

                default:
                    return;
            }

            if (script.src) {
                document.body.appendChild(script);
            }
        } catch (error) {
            console.error(error);
            mainPanel.innerHTML = `<div class="error-message">
                <h2>Error al cargar la página</h2>
                <p>${error.message}</p>
                <button onclick="mainPanel.innerHTML = contenidoInicial">Volver</button>
            </div>`;
        }
    });
});

/**
 * Obtiene la información del departamento y carrera para el jefe de departamento
 * Usando el enfoque de comparar el usuario en localStorage con los datos de Firebase
 */
async function obtenerInfoDepartamento(userId) {
    try {
        console.log('DEPURACIÓN - Iniciando nuevo método para obtener información del departamento');
        
        // Paso 1: Obtener información del usuario desde localStorage
        const userSession = localStorage.getItem('userSession');
        if (!userSession) {
            throw new Error('No hay sesión de usuario en localStorage');
        }
        
        const localUserData = JSON.parse(userSession);
        console.log('DEPURACIÓN - Datos del usuario en localStorage:', localUserData);
        
        // Verificar que sea jefedepartamento
        if (localUserData.rolUser !== 'jefedepartamento') {
            throw new Error('El usuario no tiene rol de jefe de departamento');
        }
        
        // Paso 2: Cargar todos los usuarios de Firebase
        console.log('DEPURACIÓN - Cargando usuarios de Firebase...');
        const usuariosSnapshot = await firebase.firestore().collection('usuario').get();
        
        if (usuariosSnapshot.empty) {
            throw new Error('No se encontraron usuarios en la base de datos');
        }
        
        // Paso 3: Buscar el usuario por comparación de nombre/email
        let firebaseUserId = null;
        let firebaseUserData = null;
        
        // Primero intentar por ID si lo tenemos
        if (userId) {
            const userDoc = await firebase.firestore().collection('usuario').doc(userId).get();
            if (userDoc.exists) {
                firebaseUserId = userId;
                firebaseUserData = userDoc.data();
                console.log('DEPURACIÓN - Usuario encontrado directamente por ID:', firebaseUserId);
            }
        }
        
        // Si no lo encontramos por ID, buscar por email o nombre
        if (!firebaseUserId) {
            usuariosSnapshot.forEach(doc => {
                const userData = doc.data();
                
                // Comparar por email (más seguro)
                if (userData.email && localUserData.email && 
                    userData.email.toLowerCase() === localUserData.email.toLowerCase()) {
                    firebaseUserId = doc.id;
                    firebaseUserData = userData;
                    console.log('DEPURACIÓN - Usuario encontrado por email:', firebaseUserId);
                }
                
                // Si no encontramos por email, comparar por nombre
                if (!firebaseUserId && userData.nombre && localUserData.nombre && 
                    userData.nombre.toLowerCase() === localUserData.nombre.toLowerCase()) {
                    
                    // Si tenemos apellidos, verificar también para mayor precisión
                    let coincideApellido = true;
                    if (userData.apellidoPaterno && localUserData.apellidoPaterno) {
                        coincideApellido = userData.apellidoPaterno.toLowerCase() === localUserData.apellidoPaterno.toLowerCase();
                    }
                    
                    if (coincideApellido) {
                        firebaseUserId = doc.id;
                        firebaseUserData = userData;
                        console.log('DEPURACIÓN - Usuario encontrado por nombre/apellido:', firebaseUserId);
                    }
                }
            });
        }
        
        if (!firebaseUserId || !firebaseUserData) {
            throw new Error('No se pudo encontrar el usuario en Firebase que coincida con los datos de sesión');
        }
        
        console.log('DEPURACIÓN - Usuario encontrado en Firebase:', firebaseUserData);
        
        // Paso 4: Cargar todas las carreras
        console.log('DEPURACIÓN - Cargando todas las carreras...');
        const carrerasSnapshot = await firebase.firestore().collection('carreras').get();
        
        if (carrerasSnapshot.empty) {
            throw new Error('No se encontraron carreras en la base de datos');
        }
        
        // Paso 5: Buscar las carreras relacionadas con el usuario
        let carreras = [];
        
        // Primero intentar buscar por jefeDepartamentoId
        carrerasSnapshot.forEach(doc => {
            const carreraData = doc.data();
            
            // Si la carrera tiene este usuario como jefe
            if (carreraData.jefeDepartamentoId === firebaseUserId) {
                carreras.push({
                    id: doc.id,
                    ...carreraData
                });
                console.log('DEPURACIÓN - Carrera encontrada por jefeDepartamentoId:', doc.id, carreraData.nombre);
            }
        });
        
        // Si no encontramos carreras como jefe, buscar por departamentoId
        if (carreras.length === 0 && firebaseUserData.departamentoId) {
            carrerasSnapshot.forEach(doc => {
                const carreraData = doc.data();
                
                if (carreraData.departamentoId === firebaseUserData.departamentoId) {
                    carreras.push({
                        id: doc.id,
                        ...carreraData
                    });
                    console.log('DEPURACIÓN - Carrera encontrada por departamentoId:', doc.id, carreraData.nombre);
                }
            });
        }
        
        // Si todavía no hay carreras, usar la carrera del jefe si tiene
        if (carreras.length === 0 && firebaseUserData.carreraId) {
            const carreraDoc = await firebase.firestore().collection('carreras').doc(firebaseUserData.carreraId).get();
            
            if (carreraDoc.exists) {
                carreras.push({
                    id: carreraDoc.id,
                    ...carreraDoc.data()
                });
                console.log('DEPURACIÓN - Usando la carrera propia del jefe:', carreraDoc.id);
            }
        }
        
        // Si aún no encontramos nada, agregar todas las carreras como último recurso
        if (carreras.length === 0) {
            console.log('DEPURACIÓN - No se encontraron carreras específicas, usando todas');
            carrerasSnapshot.forEach(doc => {
                carreras.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
        }
        
        console.log('DEPURACIÓN - Total de carreras encontradas:', carreras.length);
        
        // Determinar el nombre del departamento
        let departamentoNombre = 'Departamento';
        
        if (firebaseUserData.departamentoNombre) {
            departamentoNombre = firebaseUserData.departamentoNombre;
        } else if (carreras.length > 0 && carreras[0].departamento) {
            departamentoNombre = carreras[0].departamento;
        }
        
        // Almacenar la información del departamento
        departamentoInfo = {
            jefeDepartamentoId: firebaseUserId,
            nombreDepartamento: departamentoNombre,
            carreras: carreras.map(c => ({
                id: c.id,
                nombre: c.nombre || 'Sin nombre'
            })),
            carrerasIds: carreras.map(c => c.id),
            usuario: {
                id: firebaseUserId,
                nombre: firebaseUserData.nombre || localUserData.nombre || '',
                apellidoPaterno: firebaseUserData.apellidoPaterno || localUserData.apellidoPaterno || '',
                apellidoMaterno: firebaseUserData.apellidoMaterno || localUserData.apellidoMaterno || '',
                email: firebaseUserData.email || localUserData.email || ''
            }
        };
        
        console.log('DEPURACIÓN - Información del departamento guardada:', departamentoInfo);
        return departamentoInfo;
    } catch (error) {
        console.error('Error al obtener información del departamento:', error);
        throw error;
    }
}

// Verificar autenticación al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si el usuario está autenticado usando localStorage
    const userSession = localStorage.getItem('userSession');
    console.log('DEPURACIÓN - Verificando sesión de usuario');
                
    if (userSession) {
        try {
            const userData = JSON.parse(userSession);
            console.log('DEPURACIÓN - Sesión de usuario encontrada:', userData);
            console.log('DEPURACIÓN - Rol detectado:', userData.rolUser);
            
            // Verificar si el usuario es jefedepartamento
            if (userData.rolUser !== 'jefedepartamento') {
                console.log('DEPURACIÓN - Rol incorrecto. Se esperaba "jefedepartamento" pero se encontró "' + userData.rolUser + '"');
                alert('No tienes permisos para acceder a esta página. Rol requerido: jefedepartamento, Rol actual: ' + userData.rolUser);
                // Comentar temporalmente la redirección para poder ver los mensajes de error
                // window.location.href = '../auth/login.html';
                return;
            }
            
            console.log('DEPURACIÓN - Autenticación exitosa como jefedepartamento');
            
            // Mostrar nombre del usuario si está disponible
            const adminLabel = document.querySelector('.first-panel label:nth-child(3)');
            if (adminLabel) {
                adminLabel.textContent = userData.nombre || 'jefedepartamento';
            }
        } catch (error) {
            console.error('DEPURACIÓN - Error al procesar la sesión del usuario:', error);
            alert('Error al procesar la sesión: ' + error.message);
            localStorage.removeItem('userSession'); // Limpiar sesión corrupta
            // window.location.href = '../auth/login.html';
        }
    } else {
        // No hay sesión de usuario, redirigir al login
        console.log('DEPURACIÓN - No se encontró sesión de usuario en localStorage');
        alert('No hay sesión de usuario. Por favor inicie sesión.');
        window.location.href = '../auth/login.html';
    }
});

// Manejar cierre de sesión
document.getElementById('btn-cerrar-sesion').addEventListener('click', function() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        // Eliminar la sesión del localStorage
        localStorage.removeItem('userSession');
            console.log('Sesión cerrada');
            // Redirigir al login
            window.location.href = '../auth/login.html';
    }
});

// Control de menú
const btnToggle = document.getElementById('toggle-menu');
const iconoFlecha = document.getElementById('icono-flecha');
const menu = document.querySelector('.menu');
const panel = document.querySelector('.main_panel');

let menuOculto = false;

btnToggle.addEventListener('click', () => {
    menuOculto = !menuOculto;

    if (menuOculto) {
        // Contraer el menú
        menu.classList.add('oculto');
        panel.classList.add('expandido');
        iconoFlecha.src = "../assets/images/flecha-derecha.png";
        iconoFlecha.alt = "Expandir";
    } else {
        // Expandir el menú
        menu.classList.remove('oculto');
        panel.classList.remove('expandido');
        iconoFlecha.src = "../assets/images/flecha-izquierda.png";
        iconoFlecha.alt = "Contraer";
    }
});
