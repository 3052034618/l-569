import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from '@/pages/Login';
import MainLayout from '@/components/layout/MainLayout';
import PatientHome from '@/pages/patient/PatientHome';
import PatientAppointment from '@/pages/patient/PatientAppointment';
import PatientCheckIn from '@/pages/patient/PatientCheckIn';
import PatientPayment from '@/pages/patient/PatientPayment';
import PatientRecords from '@/pages/patient/PatientRecords';
import PatientExamBooking from '@/pages/patient/PatientExamBooking';
import DoctorHome from '@/pages/doctor/DoctorHome';
import DoctorPrescription from '@/pages/doctor/DoctorPrescription';
import DoctorRecords from '@/pages/doctor/DoctorRecords';
import DirectorDashboard from '@/pages/director/DirectorDashboard';
import AdminConsole from '@/pages/admin/AdminConsole';
import AdminReports from '@/pages/admin/AdminReports';
import Messages from '@/pages/Messages';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ToastProvider } from '@/components/ui/Toast';

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/patient/*"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<PatientHome />} />
            <Route path="appointment" element={<PatientAppointment />} />
            <Route path="checkin" element={<PatientCheckIn />} />
            <Route path="payment" element={<PatientPayment />} />
            <Route path="exam-booking" element={<PatientExamBooking />} />
            <Route path="records" element={<PatientRecords />} />
          </Route>

          <Route
            path="/doctor/*"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DoctorHome />} />
            <Route path="prescription" element={<DoctorPrescription />} />
            <Route path="records" element={<DoctorRecords />} />
          </Route>

          <Route
            path="/director"
            element={
              <ProtectedRoute allowedRoles={['director']}>
                <MainLayout>
                  <DirectorDashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <MainLayout>
                  <AdminConsole />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <MainLayout>
                  <AdminReports />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/messages"
            element={
              <ProtectedRoute allowedRoles={['patient', 'doctor', 'director', 'admin']}>
                <MainLayout>
                  <Messages />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}
