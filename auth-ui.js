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
  const loginSection = document.getElementById('loginSection');
  const loginFeedback = document.getElementById('loginFeedback');
  
  if (!emailLoginBtn || !emailInput) return;
  
  emailLoginBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    
    // Reset UI state
    emailInput.classList.remove('error');
    
    try {
      // Basic email validation (just in case)
      if (!email || !email.includes('@') || !email.includes('.')) {
        throw new Error('Please enter a valid email address');
      }
      
      // Show loading state
      if (loginFeedback) {
        loginFeedback.textContent = "Sending login link...";
        loginFeedback.style.display = "block";
        loginFeedback.className = "feedback"; // Remove any error styling
      }
      emailLoginBtn.disabled = true;
      
      // Call auth.js login function
      const result = await handleEmailLogin(email);
      
      // Handle successful response based on the type of success
      if (loginFeedback) {
        // For fallback mode success
        if (result && result.fallbackMode) {
          loginFeedback.textContent = "Login successful! (Fallback mode activated)";
          loginFeedback.className = "feedback success";
          // Reload the page to refresh UI state
          setTimeout(() => window.location.reload(), 1000);
          return;
        }
        
        // For email sent success
        if (result && result.emailSent) {
          loginFeedback.textContent = result.message || "Magic link sent! Please check your email (including spam folders).";
          loginFeedback.className = "feedback success";
          emailLoginBtn.textContent = "Resend Email";
          emailLoginBtn.disabled = false;
          return;
        }
        
        // Normal success case
        if (window.location.hash.includes('redirected')) {
          // User has returned from magic link
          loginFeedback.textContent = "Login successful!";
          loginFeedback.className = "feedback success";
          
          // Success - reload page without the hash
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
      console.error('Detailed error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Reset button state
      emailLoginBtn.disabled = false;
      
      // Display a more specific error message based on the error
      if (loginFeedback) {
        // Check for specific error messages
        const errorMessage = error.message || 'Login failed';
        
        // Set appropriate error message
        if (errorMessage.includes('Magic SDK not initialized')) {
          loginFeedback.textContent = "Authentication service unavailable";
        } else if (errorMessage.includes('Invalid email')) {
          loginFeedback.textContent = "Please enter a valid email address";
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          loginFeedback.textContent = "Network error - check your connection";
        } else if (errorMessage.includes('Magic link sent') || errorMessage.includes('check your email')) {
          // This is actually a success case
          loginFeedback.textContent = errorMessage;
          loginFeedback.className = "feedback success";
          emailLoginBtn.textContent = "Resend Email";
          return; // Skip error styling for this case
        } else if (errorMessage.includes('timed out')) {
          loginFeedback.textContent = "Request timed out - please check your email (including spam) or try again";
        } else {
          loginFeedback.textContent = "Login failed - " + errorMessage;
        }
        
        loginFeedback.style.display = "block";
        loginFeedback.className = "feedback error";
        
        // Don't auto-hide error messages about email check
        if (!errorMessage.includes('email') && !errorMessage.includes('Magic link')) {
          setTimeout(() => {
            loginFeedback.style.display = "none";
          }, 7000); // Increased timeout to read error
        }
      }
      
      // Show error with shake animation
      emailInput.classList.add('error');
      
      // Add shake animation
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
  });
  
  // Also handle Enter key in email input
  emailInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      emailLoginBtn.click();
    }
  });
  
  // Check if the page was loaded from a magic link redirect
  if (window.location.hash.includes('redirected')) {
    // Show success message
    if (loginFeedback) {
      loginFeedback.textContent = "Login successful!";
      loginFeedback.className = "feedback success";
      loginFeedback.style.display = "block";
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