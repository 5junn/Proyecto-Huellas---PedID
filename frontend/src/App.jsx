import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import PasswordReset from './pages/PasswordReset';
import Register from './pages/Register';
import RegisterPet from './pages/RegisterPet';
import Dashboard from './pages/Dashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import PetQRView from './pages/PetQRView';
import Emergencias from './pages/Emergencias';
import RequireSession from './components/RequireSession';

// Elimina contraseñas en texto plano que guardaban versiones anteriores.
localStorage.removeItem('huellas_registered_users');
if (localStorage.getItem('huellas_token')?.split('.').length !== 3) {
  localStorage.removeItem('huellas_token');
  localStorage.removeItem('huellas_user');
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar-contrasena" element={<PasswordReset />} />
        <Route path="/register" element={<Register />} />
        <Route path="/registrar-mascota" element={<RequireSession page={RegisterPet} />} />
        <Route path="/registro-mascota" element={<RequireSession page={RegisterPet} />} />
        <Route path="/dashboard" element={<RequireSession page={Dashboard} staff />} />
        <Route path="/propietario" element={<RequireSession page={OwnerDashboard} />} />
        <Route path="/emergencias" element={<Emergencias />} />
        <Route path="/pet/:codigo" element={<PetQRView />} />
        <Route path="/qr/:codigo" element={<PetQRView />} />
        <Route path="/mascota/:codigo" element={<PetQRView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
