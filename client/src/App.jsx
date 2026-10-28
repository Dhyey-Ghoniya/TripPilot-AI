import React, { useLayoutEffect } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';

const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);

  return null;
};

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
