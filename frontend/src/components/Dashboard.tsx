import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// ... existing interfaces ...

interface Candidate {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  createdAt: string;
  education: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string;
  }>;
  experience: Array<{
    company: string;
    position: string;
  }>;
}

interface DashboardStats {
  totalCandidates: number;
  candidatesThisMonth: number;
  averageEducation: number;
  averageExperience: number;
}

const Dashboard: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalCandidates: 0,
    candidatesThisMonth: 0,
    averageEducation: 0,
    averageExperience: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { token, user } = useAuth(); // Obtener el token Y el usuario del contexto

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        // No cargar datos si no hay token (aunque ProtectedRoute ya debería manejar esto)
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get('http://localhost:3010/api/candidates', {
          headers: {
            Authorization: `Bearer ${token}`, // Incluir el token en la cabecera
          },
        });
        const candidatesData = response.data;
        setCandidates(candidatesData);

        // Calcular estadísticas
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const stats: DashboardStats = {
          totalCandidates: candidatesData.length,
          candidatesThisMonth: candidatesData.filter((c: Candidate) => 
            new Date(c.createdAt) >= firstDayOfMonth
          ).length,
          averageEducation: candidatesData.reduce((acc: number, c: Candidate) => 
            acc + c.education.length, 0) / candidatesData.length || 0,
          averageExperience: candidatesData.reduce((acc: number, c: Candidate) => 
            acc + c.experience.length, 0) / candidatesData.length || 0,
        };

        setStats(stats);
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar los datos del dashboard:', err);
        setError('Error al cargar los datos del dashboard');
        setLoading(false);
      }
    };

    fetchData();
  }, [token]); // Ejecutar efecto cuando el token cambie

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Dashboard ATS</h1>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Total Candidatos</h3>
          <p className="text-3xl font-bold text-indigo-600">{stats.totalCandidates}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Candidatos este mes</h3>
          <p className="text-3xl font-bold text-indigo-600">{stats.candidatesThisMonth}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Promedio de Educación</h3>
          <p className="text-3xl font-bold text-indigo-600">{stats.averageEducation.toFixed(1)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Promedio de Experiencia</h3>
          <p className="text-3xl font-bold text-indigo-600">{stats.averageExperience.toFixed(1)}</p>
        </div>
      </div>

      {/* Lista de Candidatos */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Últimos Candidatos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                {/* Ocultar email y teléfono si el rol es USER */}
                {user?.role !== 'USER' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                )}
                {user?.role !== 'USER' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teléfono
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Educación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Experiencia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha de Registro
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {candidates.map((candidate) => (
                <tr key={candidate.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {candidate.firstName} {candidate.lastName}
                    </div>
                  </td>
                  {/* Ocultar email y teléfono si el rol es USER */}
                  {user?.role !== 'USER' && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{candidate.email}</div>
                    </td>
                  )}
                  {user?.role !== 'USER' && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{candidate.phone}</div>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {candidate.education.length} registros
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {candidate.experience.length} registros
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(candidate.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
