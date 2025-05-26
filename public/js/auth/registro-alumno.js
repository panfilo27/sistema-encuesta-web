/**
 * Registro de Alumnos - JavaScript
 * Maneja el registro de nuevos alumnos desde la pantalla de login
 */

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Configurar el formulario de registro de alumnos
    const formRegistroAlumno = document.getElementById('form-registro');
    if (formRegistroAlumno) {
        formRegistroAlumno.addEventListener('submit', function(e) {
            e.preventDefault();
            handleRegistrationAlumno();
        });
    }
    
    // Cargar las carreras al abrir el modal
    document.getElementById('link-registro-alumno').addEventListener('click', function() {
        loadCarreras();
    });
});

/**
 * Carga las carreras desde Firestore para el desplegable de registro
 */
async function loadCarreras() {
    try {
        const carreraSelect = document.getElementById('reg-carrera');
        // Preserve or create a placeholder option
        let placeholderHTML = '';
        if (carreraSelect.options.length > 0 && 
            (carreraSelect.options[0].value === "" || carreraSelect.options[0].disabled)) {
            // If the first option looks like a placeholder (e.g., empty value or disabled), preserve it
            placeholderHTML = carreraSelect.options[0].outerHTML;
        } else {
            // Fallback to a generic placeholder if the original isn't suitable or doesn't exist
            placeholderHTML = '<option value="" selected disabled>Seleccione una carrera</option>';
        }

        // Clear all existing options by resetting innerHTML to just the placeholder
        carreraSelect.innerHTML = placeholderHTML;
        
        // Obtener las carreras de Firestore
        const querySnapshot = await firebase.firestore().collection('carreras').get();
        
        if (querySnapshot.empty) {
            console.log('No hay carreras disponibles');
            // Optionally, update placeholder text if it's the generic one
            if (carreraSelect.options.length > 0 && carreraSelect.options[0].value === "") {
                carreraSelect.options[0].textContent = "No hay carreras disponibles";
            }
            return;
        }
        
        // Agregar cada carrera como una opción al select
        querySnapshot.forEach(doc => {
            const carrera = doc.data();
            const option = document.createElement('option');
            option.value = doc.id; // Firestore document ID
            option.textContent = carrera.nombre; // Name of the career
            carreraSelect.appendChild(option);
        });
        
        console.log('Carreras cargadas correctamente');
    } catch (error) {
        console.error('Error al cargar las carreras:', error);
                // Consider a user-friendly message in the UI, not just alert
        // Update placeholder text to indicate error
        if (carreraSelect.options.length > 0 && carreraSelect.options[0].value === "") {
            carreraSelect.options[0].textContent = "Error al cargar carreras";
        } else {
            // Fallback alert if placeholder manipulation isn't straightforward
            alert('Error al cargar las carreras. Por favor, intenta nuevamente.');
        }
    }
}

/**
 * Maneja el proceso de registro de un nuevo alumno
 */
async function handleRegistrationAlumno() {
    const form = document.getElementById('form-registro');
    const btnRegistrar = form.querySelector('.btn-registrar');
    
    // Obtener valores del formulario
    const numeroControl = document.getElementById('reg-numero-control').value;
    const nombre = document.getElementById('reg-nombre').value;
    const apellidoPaterno = document.getElementById('reg-apellido-paterno').value;
    const apellidoMaterno = document.getElementById('reg-apellido-materno').value || '';
    const carreraId = document.getElementById('reg-carrera').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;
    
    // Validaciones básicas
    if (!numeroControl || numeroControl.length < 8) {
        alert('El número de control debe tener al menos 8 caracteres');
        return;
    }
    
    if (!nombre || !apellidoPaterno) {
        alert('El nombre y apellido paterno son obligatorios');
        return;
    }
    
    if (!carreraId) {
        alert('Debes seleccionar una carrera');
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
    // Asegurarse de que captchaWidgets y el widget específico están definidos y son accesibles.
    // captchaWidgets se define en login.js y debe estar disponible globalmente o importado.
    if (typeof captchaWidgets !== 'undefined' && captchaWidgets.registroAlumno !== null) {
        recaptchaResponse = grecaptcha.getResponse(captchaWidgets.registroAlumno);
    } else {
        console.error('Error: El widget de reCAPTCHA para registro de alumnos no está definido o inicializado (captchaWidgets.registroAlumno).');
        alert('Error al verificar el captcha. Por favor, recargue la página e inténtelo de nuevo.');
        // Deshabilitar botón si ya fue manipulado
        if (btnRegistrar) {
            btnRegistrar.disabled = false;
            btnRegistrar.textContent = 'Registrarse';
        }
        return;
    }

    if (!recaptchaResponse) {
        alert('Por favor, complete el captcha');
        // Deshabilitar botón si ya fue manipulado
        if (btnRegistrar) {
            btnRegistrar.disabled = false;
            btnRegistrar.textContent = 'Registrarse';
        }
        return;
    }
    
    // Nota: En un entorno de producción, deberías enviar el token al servidor para validación
    console.log('Token reCAPTCHA de registro alumno:', recaptchaResponse.substring(0, 20) + '...');
    
    // Deshabilitar botón durante el proceso
    btnRegistrar.disabled = true;
    btnRegistrar.textContent = 'Registrando...';
    
    try {
        // Verificar si ya existe un usuario con ese número de control o correo
        const userQuery = await firebase.firestore().collection('usuario')
            .where('usuario', '==', numeroControl)
            .get();
            
        const emailQuery = await firebase.firestore().collection('usuario')
            .where('email', '==', email)
            .get();
        
        if (!userQuery.empty) {
            alert('Ya existe un usuario con este número de control');
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
        
        // Obtener la referencia de la carrera
        let carreraNombre = '';
        if (carreraId) {
            const carreraDoc = await firebase.firestore().collection('carreras').doc(carreraId).get();
            if (carreraDoc.exists) {
                carreraNombre = carreraDoc.data().nombre;
                console.log('Nombre de carrera obtenido:', carreraNombre);
            } else {
                console.error('No se encontró la carrera con ID:', carreraId);
                alert('Error: No se pudo obtener la información de la carrera seleccionada');
                btnRegistrar.disabled = false;
                btnRegistrar.textContent = 'Registrarse';
                return;
            }
        }
        
        // Validar que tenemos el nombre de la carrera
        if (!carreraNombre) {
            console.error('No se pudo obtener el nombre de la carrera');
            alert('Error: No se pudo obtener el nombre de la carrera seleccionada');
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
                usuario: numeroControl,
                nombre: nombre,
                apellidoPaterno: apellidoPaterno,
                apellidoMaterno: apellidoMaterno,
                email: email,
                rolUser: 'alumno',
                carreraId: carreraId,
                carreraNombre: carreraNombre, // Guardar el nombre de la carrera obtenido de Firestore
                // NOTA: Solo para pruebas - Guardar la contraseña en texto plano
                // ADVERTENCIA: Esto no debe hacerse en un entorno de producción por razones de seguridad
                // Se almacena aquí solo para facilitar pruebas y demostraciones
                contraseña: password, // SOLO PARA PRUEBAS - Remover en producción
                emailVerificado: true,
                uid: user.uid,
                fechaCreacion: new Date(),
                fechaActualizacion: new Date()
            };
            
            await firebase.firestore().collection('usuario').add(userData);
            
            // Cerrar sesión para que el usuario tenga que iniciar sesión después de verificar
            await firebase.auth().signOut();
            
            // Mostrar el modal de verificación
            showVerificationModal(email);
            
            // Cerrar el modal de registro
            document.getElementById('modal-registro-alumno').style.display = 'none';
            
            // Limpiar formulario
            form.reset();
            
            // Enfocar el campo de número de control en el formulario de login
            document.getElementById('numero_control').focus();
            // Asegurarse de que estamos en el formulario de alumnos
            if (typeof switchForm === 'function') {
                switchForm('alumnos');
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
        console.error('Error al registrar alumno:', error);
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
 * @param {string} email - Correo electrónico al que se envió la verificación
 */
function showVerificationModal(email) {
    // Crear el modal si no existe
    let verificationModal = document.getElementById('verification-modal');
    
    if (!verificationModal) {
        verificationModal = document.createElement('div');
        verificationModal.id = 'verification-modal';
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
