// auth-ui.js - Connects auth.js login/logout logic to UI components
import { handleEmailLogin, logout } from './auth.js';

/**
 * Setup authentication UI components
 */
export function setupAuthUI() {
  setupEmailLogin();
  setupLogoutButton();
}

/**
 * Setup email login button and form
 */
function setupEmailLogin() {
  const emailLoginBtn = document.getElementById('emailLoginBtn');
  const emailInput = document.getElementById('emailInput');
  const otpInput = document.getElementById('otpInput');
  const loginSection = document.getElementById('loginSection');
  const loginFeedback = document.getElementById('loginFeedback');
  
  if (!emailLoginBtn || !emailInput || !otpInput) {
    console.error("Required login elements not found");
    return;
  }
  
  // Track whether we're in OTP verification mode
  let isVerifyingOTP = false;
  
  // Check if we're already in OTP verification mode (e.g., after a page refresh)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('email') && urlParams.has('otp_pending')) {
    // We're returning from a previous OTP request
    isVerifyingOTP = true;
    emailInput.value = urlParams.get('email');
    emailInput.style.display = 'none';
    otpInput.style.display = '';
    emailLoginBtn.textContent = "Verify Code";
    if (loginFeedback) {
      loginFeedback.textContent = "Please enter the verification code sent to your email.";
      loginFeedback.className = "feedback";
      loginFeedback.style.display = "block";
    }
  }
  
  emailLoginBtn.addEventListener('click', async () => {
    if (isVerifyingOTP) {
      // Handle OTP verification
      const otp = otpInput.value.trim();
      
      // Basic OTP validation
      if (!otp || otp.length !== 6 || !/^\d+$/.test(otp)) {
        otpInput.classList.add('error');
        if (loginFeedback) {
          loginFeedback.textContent = "Please enter a valid 6-digit code";
          loginFeedback.className = "feedback error";
          loginFeedback.style.display = "block";
        }
        return;
      }
      
      // Reset UI state
      otpInput.classList.remove('error');
      
      try {
        // Show loading state
        if (loginFeedback) {
          loginFeedback.textContent = "Verifying code...";
          loginFeedback.style.display = "block";
          loginFeedback.className = "feedback";
        }
        emailLoginBtn.disabled = true;
        
        // Use the window.magic instance to verify OTP
        if (!window.magic) {
          throw new Error('Authentication service unavailable');
        }
        
        console.log("Verifying OTP code...");
        
        // Complete login with the OTP code
        await window.magic.auth.loginWithOTP({ 
          email: emailInput.value.trim(), 
          code: otp 
        });
        
        console.log("OTP verification successful");
        
        // Call checkUserSession to authenticate the user
        // Use the global function if available (exposed from init.js)
        if (window.checkUserSession) {
          await window.checkUserSession();
        }
        
        // Show success message
        if (loginFeedback) {
          loginFeedback.textContent = "Authentication successful!";
          loginFeedback.className = "feedback success";
        }
        
        // Reset the OTP verification mode
        isVerifyingOTP = false;
        otpInput.style.display = 'none';
        emailInput.style.display = '';
        emailLoginBtn.textContent = "Continue with Email";
        
        // Clear OTP state from URL
        const url = new URL(window.location.href);
        url.searchParams.delete('email');
        url.searchParams.delete('otp_pending');
        window.history.replaceState({}, document.title, url.toString());
        
        // Reload page to update UI
        setTimeout(() => window.location.reload(), 1000);
        
      } catch (error) {
        console.error('OTP verification error:', error);
        
        // Reset button state
        emailLoginBtn.disabled = false;
        
        // Display error message
        if (loginFeedback) {
          loginFeedback.textContent = "Verification failed - " + (error.message || "Invalid code");
          loginFeedback.style.display = "block";
          loginFeedback.className = "feedback error";
        }
        
        // Show error with shake animation
        otpInput.classList.add('error');
        otpInput.style.animation = 'shake 0.5s';
        
        // Clear animation after it completes
        setTimeout(() => {
          otpInput.style.animation = '';
          otpInput.focus();
        }, 500);
      }
      
    } else {
      // Initial email login flow
      const email = emailInput.value.trim();
      
      // Reset UI state
      emailInput.classList.remove('error');
      
      try {
        // Basic email validation
        if (!email || !email.includes('@') || !email.includes('.')) {
          throw new Error('Please enter a valid email address');
        }
        
        // Show loading state
        if (loginFeedback) {
          loginFeedback.textContent = "Sending verification code...";
          loginFeedback.style.display = "block";
          loginFeedback.className = "feedback";
        }
        emailLoginBtn.disabled = true;
        
        // Call auth.js login function
        const result = await handleEmailLogin(email);
        
        // Handle successful response
        if (loginFeedback) {
          // For email sent success
          if (result && result.emailSent) {
            loginFeedback.textContent = "Verification code sent! Please check your email.";
            loginFeedback.className = "feedback success";
            
            // Switch to OTP verification mode
            isVerifyingOTP = true;
            emailInput.style.display = 'none';
            otpInput.style.display = '';
            otpInput.value = '';
            otpInput.focus();
            emailLoginBtn.textContent = "Verify Code";
            emailLoginBtn.disabled = false;
            
            // Add state to URL to persist OTP mode across page refreshes
            const url = new URL(window.location.href);
            url.searchParams.set('email', email);
            url.searchParams.set('otp_pending', 'true');
            window.history.replaceState({}, document.title, url.toString());
            
            return;
          }
          
          // Normal success case from redirect
          if (window.location.hash.includes('magic_credential')) {
            // User has returned from magic link
            loginFeedback.textContent = "Login successful!";
            loginFeedback.className = "feedback success";
            
            // Call checkUserSession to authenticate the user
            // Use the global function if available (exposed from init.js)
            if (window.checkUserSession) {
              await window.checkUserSession();
            }
            
            // Success - reload page without the hash after a delay
            setTimeout(() => {
              window.location.href = window.location.href.split('#')[0];
            }, 1000);
          } else {
            // Generic success
            loginFeedback.textContent = "Authentication successful!";
            loginFeedback.className = "feedback success";
            setTimeout(() => window.location.reload(), 1000);
          }
        }
        
      } catch (error) {
        console.error('Login error:', error);
        
        // Reset button state
        emailLoginBtn.disabled = false;
        
        if (loginFeedback) {
          const email = emailInput.value.trim(); // Get email for URL params
          const errorMessage = error.message || 'Login failed';
          
          // Set appropriate error message
          if (errorMessage.includes('Magic SDK not initialized')) {
            loginFeedback.textContent = "Authentication service unavailable";
          } else if (errorMessage.includes('Invalid email')) {
            loginFeedback.textContent = "Please enter a valid email address";
          } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
            loginFeedback.textContent = "Network error - check your connection";
          } else if (errorMessage.includes('Magic link sent') || errorMessage.includes('check your email')) {
            // This is an "error" that indicates the email was actually sent.
            // Treat as success for OTP initiation.
            loginFeedback.textContent = "Verification code sent! Please check your email.";
            loginFeedback.className = "feedback success";
            
            // Switch to OTP verification mode
            isVerifyingOTP = true;
            emailInput.style.display = 'none';
            otpInput.style.display = '';
            otpInput.value = '';
            otpInput.focus();
            emailLoginBtn.textContent = "Verify Code";
            // emailLoginBtn.disabled = false; // Already handled above

            // Add state to URL to persist OTP mode across page refreshes
            if (email) { // Ensure email is available before setting in URL
                const url = new URL(window.location.href);
                url.searchParams.set('email', email);
                url.searchParams.set('otp_pending', 'true');
                window.history.replaceState({}, document.title, url.toString());
            }
            return; // Exit click handler
          } else {
            loginFeedback.textContent = "Login failed - " + errorMessage;
          }
          
          loginFeedback.style.display = "block";
          // Ensure className is 'feedback error' only if not the "email sent" case which returned.
          if (!loginFeedback.className.includes('success')) {
            loginFeedback.className = "feedback error";
          }
          
          // Auto-hide error after some time, except for email check messages
          if (!errorMessage.includes('email') && !errorMessage.includes('Magic link')) {
            setTimeout(() => {
              if (loginFeedback.style.display !== 'none') { // Check if still visible
                loginFeedback.style.display = "none";
              }
            }, 5000);
          }
        }
        
        // Show error with shake animation
        emailInput.classList.add('error');
        emailInput.style.animation = 'shake 0.5s';
        if (loginSection) {
          loginSection.style.animation = 'shake 0.5s';
        }
        
        // Clear animation after it completes
        setTimeout(() => {
          emailInput.style.animation = '';
          if (loginSection) {
            loginSection.style.animation = '';
          }
          emailInput.focus();
        }, 500);
      }
    }
  });
  
  // Also handle Enter key in email input
  emailInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      emailLoginBtn.click();
    }
  });
  
  // Also handle Enter key in OTP input if it exists
  if (otpInput) {
    otpInput.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        emailLoginBtn.click();
      }
    });
  }
  
  // Check if the page was loaded from a magic link redirect
  if (window.location.hash.includes('magic_credential')) {
    console.log("Magic link redirect detected");
    // Show success message
    if (loginFeedback) {
      loginFeedback.textContent = "Login successful! Completing authentication...";
      loginFeedback.className = "feedback success";
      loginFeedback.style.display = "block";
    }
    
    // Disable the login button during authentication
    if (emailLoginBtn) {
      emailLoginBtn.disabled = true;
      emailLoginBtn.textContent = "Authenticating...";
    }
    
    // Call checkUserSession to complete the authentication process
    if (window.checkUserSession) {
      window.checkUserSession().then((success) => {
        console.log("Authentication completed via Magic link redirect, success:", success);
        
        if (success) {
          // Update feedback
          if (loginFeedback) {
            loginFeedback.textContent = "Authentication successful!";
          }
          
          // Reload the page after a short delay to update UI state
          setTimeout(() => {
            window.location.href = window.location.href.split('#')[0];
          }, 1000);
        } else {
          // Authentication failed
          if (loginFeedback) {
            loginFeedback.textContent = "Authentication failed. Please try again.";
            loginFeedback.className = "feedback error";
          }
          
          // Re-enable login button
          if (emailLoginBtn) {
            emailLoginBtn.disabled = false;
            emailLoginBtn.textContent = "Continue with Email";
          }
        }
      }).catch(error => {
        console.error("Error during Magic authentication:", error);
        
        // Show error message
        if (loginFeedback) {
          loginFeedback.textContent = "Authentication error. Please try again.";
          loginFeedback.className = "feedback error";
        }
        
        // Re-enable login button
        if (emailLoginBtn) {
          emailLoginBtn.disabled = false;
          emailLoginBtn.textContent = "Continue with Email";
        }
      });
    } else {
      console.error("checkUserSession function not available");
      if (loginFeedback) {
        loginFeedback.textContent = "Authentication service unavailable. Please try again later.";
        loginFeedback.className = "feedback error";
      }
    }
  }
}

/**
 * Setup logout button with smooth transition
 */
function setupLogoutButton() {
  const logoutButton = document.getElementById('logoutButton');
  if (!logoutButton) return;
  
  logoutButton.addEventListener('click', async () => {
    // Update button state
    logoutButton.textContent = 'Logging out...';
    logoutButton.disabled = true;
    
    try {
      // Call auth.js logout function
      await logout();
      
      // Clear localStorage and reload
      localStorage.clear();
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
      
      // Reset button state
      logoutButton.textContent = 'Reset Data';
      logoutButton.disabled = false;
    }
  });
}

// Add CSS for shake animation if it doesn't exist
document.addEventListener('DOMContentLoaded', () => {
  // Check if the animation already exists
  if (!document.querySelector('style#auth-ui-styles')) {
    const style = document.createElement('style');
    style.id = 'auth-ui-styles';
    style.textContent = `
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
      }
      
      .error {
        border-color: red !important;
      }
      
      .feedback.success {
        color: #4CAF50;
        font-weight: bold;
      }
      
      .feedback.error {
        color: #F44336;
        font-weight: bold;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Initialize auth UI components
  setupAuthUI();
}); 