import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterPet from './pages/RegisterPet';
import Dashboard from './pages/Dashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import PetQRView from './pages/PetQRView';
import Emergencias from './pages/Emergencias';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/registrar-mascota" element={<RegisterPet />} />
        <Route path="/registro-mascota" element={<RegisterPet />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/propietario" element={<OwnerDashboard />} />
        <Route path="/emergencias" element={<Emergencias />} />
        <Route path="/pet/:codigo" element={<PetQRView />} />
        <Route path="/qr/:codigo" element={<PetQRView />} />
        <Route path="/mascota/:codigo" element={<PetQRView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
