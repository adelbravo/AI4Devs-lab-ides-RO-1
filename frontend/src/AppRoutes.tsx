import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import CandidateForm from './components/CandidateForm';
import Dashboard from './components/Dashboard';
import UserCreateForm from './components/UserCreateForm';
import LoginForm from './components/LoginForm';
import { useAuth } from './context/AuthContext';
import './App.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/" replace />;
  return <>{children}</>;
};

const UserCreateFormWrapper: React.FC = () => {
  const { token } = useAuth();
  if (!token) return null;
  return <UserCreateForm token={token} />;
};

const AppRoutes: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navegación (mostrar solo si está autenticado)*/}
      {user && (
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold text-indigo-600">ATS System</h1>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link
                    to="/"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/candidates/new"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Nuevo Candidato
                  </Link>
                  {user.role === 'ADMIN' && (
                    <Link
                      to="/admin/usuarios-nuevo"
                      className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      Crear Usuario
                    </Link>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/candidates/new" element={<ProtectedRoute><CandidateForm /></ProtectedRoute>} />
          <Route
            path="/admin/usuarios-nuevo"
            element={
              <ProtectedRoute adminOnly>
                <UserCreateFormWrapper />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
};

export default AppRoutes; 