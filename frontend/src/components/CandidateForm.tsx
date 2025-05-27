import React, { useState } from 'react';
import axios from 'axios';
import AutocompleteInput from './AutocompleteInput';

interface Education {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate?: string;
}

interface Experience {
  company: string;
  position: string;
  description?: string;
  startDate: string;
  endDate?: string;
}

interface CandidateFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  education: Education[];
  experience: Experience[];
  cv: File | null;
}

interface ValidationError {
  path: string;
  msg: string;
}

const CandidateForm: React.FC = () => {
  const [formData, setFormData] = useState<CandidateFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    education: [{ institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '' }],
    experience: [{ company: '', position: '', description: '', startDate: '', endDate: '' }],
    cv: null,
  });

  const [fileName, setFileName] = useState<string>('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Limpiar el error del campo cuando el usuario comienza a escribir
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        cv: e.target.files![0],
      }));
      setFileName(e.target.files[0].name);
      // Limpiar el error del CV cuando se selecciona un archivo
      if (errors.cv) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.cv;
          return newErrors;
        });
      }
    }
  };

  const handleEducationChange = (index: number, field: keyof Education, value: string) => {
    const newEducation = [...formData.education];
    newEducation[index] = { ...newEducation[index], [field]: value };
    setFormData(prev => ({ ...prev, education: newEducation }));
  };

  const handleExperienceChange = (index: number, field: keyof Experience, value: string) => {
    const newExperience = [...formData.experience];
    newExperience[index] = { ...newExperience[index], [field]: value };
    setFormData(prev => ({ ...prev, experience: newExperience }));
  };

  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, { institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '' }],
    }));
  };

  const addExperience = () => {
    setFormData(prev => ({
      ...prev,
      experience: [...prev.experience, { company: '', position: '', description: '', startDate: '', endDate: '' }],
    }));
  };

  const removeEducation = (index: number) => {
    if (formData.education.length > 1) {
      setFormData(prev => ({
        ...prev,
        education: prev.education.filter((_, i) => i !== index),
      }));
    }
  };

  const removeExperience = (index: number) => {
    if (formData.experience.length > 1) {
      setFormData(prev => ({
        ...prev,
        experience: prev.experience.filter((_, i) => i !== index),
      }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName) newErrors.firstName = 'El nombre es requerido';
    if (!formData.lastName) newErrors.lastName = 'El apellido es requerido';
    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }
    if (!formData.cv) newErrors.cv = 'El CV es requerido';

    // Validar que haya al menos un registro de educación
    if (formData.education.length === 0 || formData.education.some(edu => !edu.institution || !edu.degree)) {
      newErrors.education = 'Debe agregar al menos un registro de educación';
    }

    // Validar que haya al menos un registro de experiencia
    if (formData.experience.length === 0 || formData.experience.some(exp => !exp.company || !exp.position)) {
      newErrors.experience = 'Debe agregar al menos un registro de experiencia laboral';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitSuccess(false);

    try {
      const formDataToSend = new FormData();
      
      // Añadir campos básicos
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('address', formData.address);
      
      // Validar y formatear educación
      const validEducation = formData.education.filter(edu => 
        edu.institution && edu.degree && edu.fieldOfStudy && edu.startDate
      );
      if (validEducation.length === 0) {
        throw new Error('Debe agregar al menos un registro de educación válido');
      }
      formDataToSend.append('education', JSON.stringify(validEducation));
      
      // Validar y formatear experiencia
      const validExperience = formData.experience.filter(exp => 
        exp.company && exp.position && exp.startDate
      );
      if (validExperience.length === 0) {
        throw new Error('Debe agregar al menos un registro de experiencia válido');
      }
      formDataToSend.append('experience', JSON.stringify(validExperience));
      
      // Añadir archivo CV si existe
      if (formData.cv) {
        formDataToSend.append('cv', formData.cv);
      }

      const response = await axios.post('http://localhost:3010/api/candidates', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 201) {
        setSubmitSuccess(true);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          address: '',
          education: [{ institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '' }],
          experience: [{ company: '', position: '', description: '', startDate: '', endDate: '' }],
          cv: null,
        });
        setFileName('');
        setErrors({});
      }
    } catch (error) {
      console.error('Error al enviar el formulario:', error);
      if (axios.isAxiosError(error) && error.response?.data?.errors) {
        const validationErrors = error.response.data.errors.reduce((acc: { [key: string]: string }, err: ValidationError) => {
          acc[err.path] = err.msg;
          return acc;
        }, {});
        setErrors(validationErrors);
      } else if (error instanceof Error) {
        setGeneralError(error.message);
      } else {
        setGeneralError('Error al enviar el formulario. Por favor, intente nuevamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderError = (fieldName: string) => {
    if (errors[fieldName]) {
      return (
        <p className="mt-1 text-sm text-red-600">
          {errors[fieldName]}
        </p>
      );
    }
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Añadir Nuevo Candidato</h2>
      
      {submitSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Candidato añadido exitosamente
        </div>
      )}

      {generalError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {generalError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                errors.firstName ? 'border-red-500' : ''
              }`}
            />
            {renderError('firstName')}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Apellido</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                errors.lastName ? 'border-red-500' : ''
              }`}
            />
            {renderError('lastName')}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                errors.email ? 'border-red-500' : ''
              }`}
            />
            {renderError('email')}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Teléfono</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                errors.phone ? 'border-red-500' : ''
              }`}
            />
            {renderError('phone')}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Dirección</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
              errors.address ? 'border-red-500' : ''
            }`}
          />
          {renderError('address')}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">CV (PDF o DOCX)</label>
          <div className="mt-1 flex items-center">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className={`block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100
                ${errors.cv ? 'border-red-500' : ''}`}
            />
            {fileName && (
              <span className="ml-2 text-sm text-gray-500">{fileName}</span>
            )}
          </div>
          {renderError('cv')}
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Educación</h3>
          {errors.education && (
            <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
              {errors.education}
            </div>
          )}
          {formData.education.map((edu, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 border rounded relative">
              {formData.education.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEducation(index)}
                  className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
              <div>
                <AutocompleteInput
                  label="Institución"
                  value={edu.institution}
                  onChange={val => handleEducationChange(index, 'institution', val)}
                  endpoint="http://localhost:3010/api/candidates/autocomplete/institutions"
                  placeholder="Ej: Universidad Nacional"
                />
              </div>
              <div>
                <AutocompleteInput
                  label="Título"
                  value={edu.degree}
                  onChange={val => handleEducationChange(index, 'degree', val)}
                  endpoint="http://localhost:3010/api/candidates/autocomplete/degrees"
                  placeholder="Ej: Licenciatura en..."
                />
              </div>
              <div>
                <AutocompleteInput
                  label="Campo de Estudio"
                  value={edu.fieldOfStudy}
                  onChange={val => handleEducationChange(index, 'fieldOfStudy', val)}
                  endpoint="http://localhost:3010/api/candidates/autocomplete/fields"
                  placeholder="Ej: Ingeniería, Derecho..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha de Inicio</label>
                  <input
                    type="date"
                    value={edu.startDate}
                    onChange={(e) => handleEducationChange(index, 'startDate', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha de Fin</label>
                  <input
                    type="date"
                    value={edu.endDate}
                    onChange={(e) => handleEducationChange(index, 'endDate', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addEducation}
            className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
          >
            Añadir Educación
          </button>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Experiencia Laboral</h3>
          {errors.experience && (
            <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
              {errors.experience}
            </div>
          )}
          {formData.experience.map((exp, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 border rounded relative">
              {formData.experience.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeExperience(index)}
                  className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
              <div>
                <AutocompleteInput
                  label="Empresa"
                  value={exp.company}
                  onChange={val => handleExperienceChange(index, 'company', val)}
                  endpoint="http://localhost:3010/api/candidates/autocomplete/companies"
                  placeholder="Ej: Google, Microsoft..."
                />
              </div>
              <div>
                <AutocompleteInput
                  label="Cargo"
                  value={exp.position}
                  onChange={val => handleExperienceChange(index, 'position', val)}
                  endpoint="http://localhost:3010/api/candidates/autocomplete/positions"
                  placeholder="Ej: Desarrollador, Gerente..."
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Descripción</label>
                <textarea
                  value={exp.description}
                  onChange={(e) => handleExperienceChange(index, 'description', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha de Inicio</label>
                  <input
                    type="date"
                    value={exp.startDate}
                    onChange={(e) => handleExperienceChange(index, 'startDate', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha de Fin</label>
                  <input
                    type="date"
                    value={exp.endDate}
                    onChange={(e) => handleExperienceChange(index, 'endDate', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addExperience}
            className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
          >
            Añadir Experiencia
          </button>
        </div>

        <div className="flex justify-end mt-8">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Enviando...' : 'Guardar Candidato'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CandidateForm; 