/**
 * Script para manejar la recuperación de contraseña
 * Este archivo es parte del sistema de encuestas web
 */

// Variable para almacenar el ID del widget de reCAPTCHA para el formulario de recuperación
let captchaWidgetReset = null;

// Función para mostrar mensaje de error
function showResetError(message) {
    // Crear alerta con estilos
    const alertDiv = document.createElement('div');
    alertDiv.style.backgroundColor = '#f8d7da';
    alertDiv.style.color = '#721c24';
    alertDiv.style.padding = '10px';
    alertDiv.style.borderRadius = '4px';
    alertDiv.style.marginTop = '15px';
    alertDiv.style.textAlign = 'center';
    alertDiv.textContent = message;
    
    // Insertar antes del botón en el formulario
    const form = document.getElementById('form-recuperar-password');
    const submitBtn = form.querySelector('.btn-reset');
    form.insertBefore(alertDiv, submitBtn);
    
    // Eliminar después de 5 segundos
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Función para mostrar mensaje de éxito
function showResetSuccess(message) {
    // Crear alerta con estilos
    const alertDiv = document.createElement('div');
    alertDiv.style.backgroundColor = '#d4edda';
    alertDiv.style.color = '#155724';
    alertDiv.style.padding = '10px';
    alertDiv.style.borderRadius = '4px';
    alertDiv.style.marginTop = '15px';
    alertDiv.style.textAlign = 'center';
    alertDiv.textContent = message;
    
    // Insertar antes del botón en el formulario
    const form = document.getElementById('form-recuperar-password');
    const submitBtn = form.querySelector('.btn-reset');
    form.insertBefore(alertDiv, submitBtn);
    
    // Eliminar después de 5 segundos
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Inicializar captcha para el formulario de recuperación de contraseña
function initializeResetCaptcha() {
    if (typeof grecaptcha !== 'undefined' && grecaptcha.render) {
        try {
            const captchaReset = document.querySelector('#modal-recuperar-password .g-recaptcha');
            if (captchaReset && !captchaReset.hasChildNodes()) { // Solo renderizar si está vacío
                captchaWidgetReset = grecaptcha.render(captchaReset, {
                    'sitekey': captchaReset.getAttribute('data-sitekey'),
                    'callback': function(response) {
                        console.log('Captcha de recuperación completado');
                    }
                });
                console.log('Captcha de recuperación inicializado con ID:', captchaWidgetReset);
            }
        } catch (e) {
            console.warn('Error al inicializar captcha de recuperación:', e.message);
        }
    }
}

// Restablecer el captcha del formulario de recuperación
function resetResetCaptcha() {
    try {
        if (captchaWidgetReset !== null) {
            grecaptcha.reset(captchaWidgetReset);
        }
    } catch (error) {
        console.error('Error al restablecer captcha de recuperación:', error);
    }
}

// Función para mostrar el modal de recuperación de contraseña
function showRecoveryModal() {
    const modal = document.getElementById('modal-recuperar-password');
    modal.style.display = 'block';
    
    // Inicializar captcha si aún no está inicializado
    if (captchaWidgetReset === null) {
        setTimeout(initializeResetCaptcha, 500);
    } else {
        resetResetCaptcha();
    }
    
    // Limpiar el formulario
    document.getElementById('form-recuperar-password').reset();
    
    // Eliminar posibles mensajes anteriores
    const alertDivs = document.querySelectorAll('#form-recuperar-password div[style*="background-color"]');
    alertDivs.forEach(div => div.remove());
}

// Función para enviar correo de recuperación de contraseña
function sendPasswordResetEmail(email) {
    return new Promise((resolve, reject) => {
        // Comprobamos que auth esté definido (debe venir de firebase-init.js)
        if (typeof auth === 'undefined') {
            reject(new Error('Firebase Auth no está inicializado'));
            return;
        }
        
        auth.sendPasswordResetEmail(email)
            .then(() => {
                resolve();
            })
            .catch(error => {
                console.error('Error al enviar correo de recuperación:', error);
                
                // Manejar diferentes códigos de error
                let errorMessage = 'Ha ocurrido un error. Intenta nuevamente.';
                
                switch (error.code) {
                    case 'auth/invalid-email':
                        errorMessage = 'La dirección de correo electrónico no es válida.';
                        break;
                    case 'auth/user-not-found':
                        errorMessage = 'No existe una cuenta asociada a este correo.';
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = 'Has realizado demasiadas solicitudes. Intenta más tarde.';
                        break;
                }
                
                reject(new Error(errorMessage));
            });
    });
}

// Configurar eventos al cargar el DOM
document.addEventListener('DOMContentLoaded', function() {
    // Enlaces para abrir el modal de recuperación
    document.getElementById('link-olvide-alumno').addEventListener('click', function(e) {
        e.preventDefault();
        showRecoveryModal();
    });
    
    document.getElementById('link-olvide-personal').addEventListener('click', function(e) {
        e.preventDefault();
        showRecoveryModal();
    });
    
    // Configurar cierre del modal
    const closeBtn = document.querySelector('#modal-recuperar-password .close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            document.getElementById('modal-recuperar-password').style.display = 'none';
        });
    }
    
    // Manejar envío del formulario de recuperación
    document.getElementById('form-recuperar-password').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Verificar captcha
        if (captchaWidgetReset !== null) {
            const captchaResponse = grecaptcha.getResponse(captchaWidgetReset);
            if (!captchaResponse) {
                showResetError('Por favor, completa el captcha.');
                return;
            }
        }
        
        const email = document.getElementById('reset-email').value.trim();
        
        // Validar correo electrónico
        if (!email) {
            showResetError('Por favor, ingresa tu dirección de correo electrónico.');
            return;
        }
        
        // Mostrar indicador de carga
        const submitBtn = this.querySelector('.btn-reset');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
        
        // Enviar correo de recuperación
        sendPasswordResetEmail(email)
            .then(() => {
                showResetSuccess('Se ha enviado un correo de recuperación. Revisa tu bandeja de entrada.');
                
                // Restaurar el botón después de un tiempo
                setTimeout(() => {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }, 3000);
                
                // Cerrar el modal después de 5 segundos
                setTimeout(() => {
                    document.getElementById('modal-recuperar-password').style.display = 'none';
                }, 5000);
            })
            .catch(error => {
                showResetError(error.message);
                
                // Restaurar el botón
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                
                // Resetear el captcha
                resetResetCaptcha();
            });
    });
    
    // Cerrar modal haciendo clic fuera de él
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('modal-recuperar-password');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});

// Función global para inicializar el captcha de recuperación
// Esta se llamará desde el callback de carga de reCAPTCHA
window.initializeResetCaptcha = initializeResetCaptcha;

// Si grecaptcha ya está disponible, intentar inicializar
if (typeof grecaptcha !== 'undefined' && grecaptcha.render) {
    // Añadir a la cola de inicialización de captchas
    if (typeof window.onRecaptchaLoaded === 'function') {
        const originalCallback = window.onRecaptchaLoaded;
        window.onRecaptchaLoaded = function() {
            originalCallback();
            setTimeout(initializeResetCaptcha, 500);
        };
    }
}
