/**
 * Registro de Personal - JavaScript
 * Maneja el registro de nuevo personal desde la pantalla de login
 */

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Configurar el formulario de registro de personal
    const formRegistroPersonal = document.getElementById('form-registro-personal');
    if (formRegistroPersonal) {
        formRegistroPersonal.addEventListener('submit', function(e) {
            e.preventDefault();
            handleRegistrationPersonal();
        });
    }
});

/**
 * Maneja el proceso de registro de un nuevo personal
 */
async function handleRegistrationPersonal() {
    const form = document.getElementById('form-registro-personal');
    const btnRegistrar = form.querySelector('.btn-registrar');
    
    // Obtener valores del formulario
    const rfc = document.getElementById('reg-rfc').value;
    const nombre = document.getElementById('reg-nombre-personal').value;
    const apellidoPaterno = document.getElementById('reg-apellido-paterno-personal').value;
    const apellidoMaterno = document.getElementById('reg-apellido-materno-personal').value || '';
    const email = document.getElementById('reg-email-personal').value;
    const password = document.getElementById('reg-password-personal').value;
    const confirmPassword = document.getElementById('reg-confirm-password-personal').value;
    
    // Validaciones básicas
    if (!rfc || rfc.length < 10) {
        alert('El RFC debe tener al menos 10 caracteres');
        return;
    }
    
    if (!nombre || !apellidoPaterno) {
        alert('El nombre y apellido paterno son obligatorios');
        return;
    }
    
    if (!email || !validateEmail(email)) {
        alert('Debes ingresar un correo electrónico válido');
        return;
    }
    
    if (password.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('Las contraseñas no coinciden');
        return;
    }
    
    // Validar reCAPTCHA (validación del lado del cliente)
    let recaptchaResponse;
    try {
        // Intentar obtener la respuesta del captcha del formulario de registro
        const captchaContainer = form.querySelector('.g-recaptcha');
        if (captchaContainer) {
            recaptchaResponse = grecaptcha.getResponse(captchaContainer.getAttribute('data-widget-id') || 0);
        } else {
            // Fallback al método simple
            recaptchaResponse = grecaptcha.getResponse();
        }
        
        if (!recaptchaResponse) {
            alert('Por favor, complete el captcha');
            return;
        }
    } catch (error) {
        console.error('Error al validar reCAPTCHA:', error);
        // En desarrollo, permitimos continuar incluso si hay error con reCAPTCHA
        console.warn('Continuando sin validación de reCAPTCHA (solo en desarrollo)');
    }
    
    // Nota: En un entorno de producción, deberías enviar el token al servidor para validación
    console.log('Token reCAPTCHA de registro personal:', recaptchaResponse.substring(0, 20) + '...');
    
    // Deshabilitar botón durante el proceso
    btnRegistrar.disabled = true;
    btnRegistrar.textContent = 'Registrando...';
    
    try {
        // Verificar si ya existe un usuario con ese RFC o correo
        const userQuery = await firebase.firestore().collection('usuario')
            .where('usuario', '==', rfc)
            .get();
            
        const emailQuery = await firebase.firestore().collection('usuario')
            .where('email', '==', email)
            .get();
        
        if (!userQuery.empty) {
            alert('Ya existe un usuario con este RFC');
            btnRegistrar.disabled = false;
            btnRegistrar.textContent = 'Registrarse';
            return;
        }
        
        if (!emailQuery.empty) {
            alert('Este correo electrónico ya está registrado');
            btnRegistrar.disabled = false;
            btnRegistrar.textContent = 'Registrarse';
            return;
        }
        
        // Crear usuario en Firebase Authentication
        try {
            // Crear usuario con correo y contraseña
            const authResult = await firebase.auth().createUserWithEmailAndPassword(email, password);
            const user = authResult.user;
            
            // Enviar correo de verificación (método estándar)
            await user.sendEmailVerification();
            
            // Crear nuevo usuario en la colección 'usuario'
            const userData = {
                usuario: rfc,
                contraseña: password, // Idealmente debería estar encriptada
                nombre: nombre,
                apellidoPaterno: apellidoPaterno,
                apellidoMaterno: apellidoMaterno,
                email: email,
                emailVerificado: false,
                // Personal se registra con rol por defecto "jefedepartamento"
                rolUser: 'jefedepartamento',
                uid: user.uid, // Guardar el UID de autenticación
                fechaCreacion: new Date(),
                fechaActualizacion: new Date()
            };
            
            await firebase.firestore().collection('usuario').add(userData);
            
            // Cerrar sesión para que el usuario tenga que iniciar sesión después de verificar
            await firebase.auth().signOut();
            
            // Mostrar el modal de verificación
            showVerificationModal(email);
            
            // Cerrar el modal de registro
            document.getElementById('modal-registro-personal').style.display = 'none';
            
            // Limpiar formulario
            form.reset();
            
            // Enfocar el campo de usuario en el formulario de login personal
            document.getElementById('usuario').focus();
            // Asegurarse de que estamos en el formulario de personal
            if (typeof switchForm === 'function') {
                switchForm('personal');
            }
        } catch (authError) {
            console.error('Error de autenticación:', authError);
            if (authError.code === 'auth/email-already-in-use') {
                alert('Este correo electrónico ya está registrado en el sistema de autenticación');
            } else if (authError.code === 'auth/invalid-email') {
                alert('El formato del correo electrónico no es válido');
            } else {
                alert('Error en el registro: ' + authError.message);
            }
        }
    } catch (error) {
        console.error('Error al registrar personal:', error);
        alert('Error al registrar. Por favor, intenta nuevamente.');
    } finally {
        btnRegistrar.disabled = false;
        btnRegistrar.textContent = 'Registrarse';
    }
}

/**
 * Valida el formato de un correo electrónico
 * @param {string} email - Correo electrónico a validar
 * @returns {boolean} true si el formato es válido
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Muestra un modal con instrucciones para verificar el correo electrónico
 * Este es similar al del módulo de alumnos pero con un ámbito separado
 * @param {string} email - Correo electrónico al que se envió la verificación
 */
function showVerificationModal(email) {
    // Crear el modal si no existe
    let verificationModal = document.getElementById('verification-modal-personal');
    
    if (!verificationModal) {
        verificationModal = document.createElement('div');
        verificationModal.id = 'verification-modal-personal';
        verificationModal.className = 'modal';
        verificationModal.innerHTML = `
            <div class="modal-content verification-content">
                <span class="close">&times;</span>
                <h2>Verificación de Correo</h2>
                <p>Se ha enviado un correo de verificación a:</p>
                <p class="email-highlight"></p>
                <p>Por favor, revisa tu bandeja de entrada (o carpeta de spam) y haz clic en el enlace de verificación.</p>
                <p>Debes verificar tu correo electrónico antes de poder iniciar sesión.</p>
                <button class="btn-ok">Entendido</button>
            </div>
        `;
        document.body.appendChild(verificationModal);
        
        // Configurar eventos del modal
        const closeBtn = verificationModal.querySelector('.close');
        const okBtn = verificationModal.querySelector('.btn-ok');
        
        closeBtn.addEventListener('click', function() {
            verificationModal.style.display = 'none';
        });
        
        okBtn.addEventListener('click', function() {
            verificationModal.style.display = 'none';
        });
        
        window.addEventListener('click', function(event) {
            if (event.target == verificationModal) {
                verificationModal.style.display = 'none';
            }
        });
    }
    
    // Actualizar el correo electrónico en el modal
    verificationModal.querySelector('.email-highlight').textContent = email;
    
    // Mostrar el modal
    verificationModal.style.display = 'block';
}
