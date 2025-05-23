/**
 * Perfil de Usuario - JavaScript
 * Maneja la funcionalidad del perfil de usuario y cambio de contraseña
 * 
 * Este archivo trabaja directamente con los datos almacenados en localStorage y Firestore,
 * sin depender de Firebase Auth para la autenticación.
 */

// Elementos del DOM
const userProfileBtn = document.getElementById('user-profile-btn');
const modalPerfil = document.getElementById('modal-perfil');
const closeBtn = modalPerfil.querySelector('.close');
const formCambiarPassword = document.getElementById('form-cambiar-password');
const togglePasswordBtns = document.querySelectorAll('.toggle-password');

// Variables para datos del usuario
let datosUsuario = null;

// Evento para abrir el modal de perfil
userProfileBtn.addEventListener('click', function() {
    modalPerfil.style.display = 'block';
    cargarDatosPerfil();
});

// Evento para cerrar el modal
closeBtn.addEventListener('click', function() {
    modalPerfil.style.display = 'none';
    limpiarFormularioPassword();
});

// Cerrar modal haciendo clic fuera de él
window.addEventListener('click', function(event) {
    if (event.target === modalPerfil) {
        modalPerfil.style.display = 'none';
        limpiarFormularioPassword();
    }
});

// Alternar visibilidad de contraseñas
togglePasswordBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        const inputPassword = this.previousElementSibling;
        const iconElement = this.querySelector('i');
        
        if (inputPassword.type === 'password') {
            inputPassword.type = 'text';
            iconElement.classList.remove('fa-eye');
            iconElement.classList.add('fa-eye-slash');
        } else {
            inputPassword.type = 'password';
            iconElement.classList.remove('fa-eye-slash');
            iconElement.classList.add('fa-eye');
        }
    });
});

// Evento para cambiar contraseña
formCambiarPassword.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Obtener valores
    const passwordActual = document.getElementById('password-actual').value;
    const passwordNueva = document.getElementById('password-nueva').value;
    const passwordConfirmar = document.getElementById('password-confirmar').value;
    
    // Validar que no estén vacíos
    if (!passwordActual || !passwordNueva || !passwordConfirmar) {
        mostrarMensaje('Todos los campos son obligatorios', 'error');
        return;
    }
    
    // Validar que la nueva contraseña tenga al menos 6 caracteres
    if (passwordNueva.length < 6) {
        mostrarMensaje('La nueva contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    // Validar que las contraseñas coincidan
    if (passwordNueva !== passwordConfirmar) {
        mostrarMensaje('Las contraseñas no coinciden', 'error');
        return;
    }
    
    try {
        // Obtener datos de usuario desde localStorage
        const userSession = localStorage.getItem('userSession');
        if (!userSession) {
            mostrarMensaje('No se ha encontrado sesión de usuario', 'error');
            return;
        }
        
        const userData = JSON.parse(userSession);
        
        // Verificar la contraseña actual en Firestore
        const userDoc = await firebase.firestore().collection('usuario')
            .where('usuario', '==', userData.usuario)
            .limit(1)
            .get();
        
        if (userDoc.empty) {
            mostrarMensaje('No se encontraron datos del usuario', 'error');
            return;
        }
        
        const userFirestore = userDoc.docs[0].data();
        
        // Verificar si la contraseña actual es correcta
        if (userFirestore.contraseña !== passwordActual) {
            mostrarMensaje('La contraseña actual es incorrecta', 'error');
            return;
        }
        
        // Actualizar la contraseña en Firestore
        await userDoc.docs[0].ref.update({
            contraseña: passwordNueva,
            fechaActualizacion: new Date()
        });
        
        // Actualizar la sesión en localStorage si es necesario
        if (userData.contraseña) {
            userData.contraseña = passwordNueva;
            localStorage.setItem('userSession', JSON.stringify(userData));
        }
        
        // Mostrar mensaje de éxito
        mostrarMensaje('¡Contraseña cambiada con éxito!', 'success');
        
        // Limpiar formulario
        limpiarFormularioPassword();
        
        // Cerrar modal después de 3 segundos
        setTimeout(() => {
            modalPerfil.style.display = 'none';
        }, 3000);
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        mostrarMensaje('Ha ocurrido un error. Intenta nuevamente.', 'error');
    }
});

// Función para cargar los datos del perfil
async function cargarDatosPerfil() {
    try {
        // Obtener datos de usuario desde localStorage
        const userSession = localStorage.getItem('userSession');
        if (!userSession) {
            console.error('No hay sesión de usuario en localStorage');
            return;
        }
        
        const userData = JSON.parse(userSession);
        
        // Consultar datos actualizados en Firestore
        const userDoc = await firebase.firestore().collection('usuario')
            .where('usuario', '==', userData.usuario)
            .limit(1)
            .get();
        
        // Usar datos de Firestore si están disponibles, sino los de localStorage
        if (!userDoc.empty) {
            datosUsuario = userDoc.docs[0].data();
        } else {
            console.log('Usando datos de localStorage (no se encontró en Firestore)');
            datosUsuario = userData;
        }
        
        // Actualizar interfaz con los datos
        document.getElementById('perfil-numero-control').textContent = datosUsuario.usuario || 'No disponible';
        document.getElementById('perfil-nombre-completo').textContent = formatearNombreCompleto(datosUsuario);
        document.getElementById('perfil-email').textContent = datosUsuario.email || 'No disponible';
        
        // Mostrar carrera (si está disponible)
        if (datosUsuario.carreraNombre) {
            document.getElementById('perfil-carrera').textContent = datosUsuario.carreraNombre;
        } else if (datosUsuario.carreraId) {
            // Si solo tenemos el ID, intentar obtener el nombre
            try {
                const carreraDoc = await firebase.firestore().collection('carreras')
                    .doc(datosUsuario.carreraId)
                    .get();
                
                if (carreraDoc.exists) {
                    document.getElementById('perfil-carrera').textContent = carreraDoc.data().nombre;
                } else {
                    document.getElementById('perfil-carrera').textContent = 'No disponible';
                }
            } catch (error) {
                console.error('Error al obtener carrera:', error);
                document.getElementById('perfil-carrera').textContent = 'No disponible';
            }
        } else {
            document.getElementById('perfil-carrera').textContent = 'No disponible';
        }
    } catch (error) {
        console.error('Error al cargar datos del perfil:', error);
    }
}

// Función para formatear el nombre completo
function formatearNombreCompleto(userData) {
    if (!userData) return 'No disponible';
    
    let nombreCompleto = userData.nombre || '';
    
    if (userData.apellidoPaterno) {
        nombreCompleto += ' ' + userData.apellidoPaterno;
    }
    
    if (userData.apellidoMaterno) {
        nombreCompleto += ' ' + userData.apellidoMaterno;
    }
    
    return nombreCompleto.trim() || 'No disponible';
}

// Esta función ya no es necesaria porque ahora actualizamos directamente en Firestore
// Pero la mantenemos vacía por si hay alguna referencia a ella en el código
async function actualizarPasswordEnFirestore(uid, newPassword) {
    // Función vacía - La actualización ahora se hace directamente en el evento submit
    return;
}

// Función para limpiar el formulario de contraseña
function limpiarFormularioPassword() {
    formCambiarPassword.reset();
    
    // Ocultar mensajes de alerta
    const alertas = formCambiarPassword.querySelectorAll('.alert');
    alertas.forEach(alerta => {
        alerta.style.display = 'none';
    });
    
    // Asegurarse que todos los campos de contraseña estén en tipo "password"
    const passwordInputs = formCambiarPassword.querySelectorAll('input[type]');
    passwordInputs.forEach(input => {
        if (input.type === 'text') {
            input.type = 'password';
            const iconElement = input.nextElementSibling.querySelector('i');
            iconElement.classList.remove('fa-eye-slash');
            iconElement.classList.add('fa-eye');
        }
    });
}

// Función para mostrar mensajes de éxito o error
function mostrarMensaje(mensaje, tipo) {
    // Eliminar alertas existentes
    const alertasExistentes = formCambiarPassword.querySelectorAll('.alert');
    alertasExistentes.forEach(alerta => {
        alerta.remove();
    });
    
    // Crear nueva alerta
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo}`;
    alerta.textContent = mensaje;
    alerta.style.display = 'block';
    
    // Insertar antes del botón en el formulario
    const submitBtn = formCambiarPassword.querySelector('.btn-cambiar-password');
    formCambiarPassword.insertBefore(alerta, submitBtn);
    
    // Desaparecer después de 5 segundos
    setTimeout(() => {
        alerta.style.display = 'none';
    }, 5000);
}
