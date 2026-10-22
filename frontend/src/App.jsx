import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';

import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import Layout from './components/Layout';
import Profile from './pages/Profile';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Documents from './pages/Documents';
import DocumentDetails from './pages/DocumentDetails';
import Approvals from './pages/Approvals';
import Search from './pages/Search';
import Analytics from './pages/Analytics';
import Users from './pages/Users';
import AuditLogs from './pages/AuditLogs';
import Reports from './pages/Reports';
import Messages from './pages/Messages';

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>

                    {/* PUBLIC */}

                    <Route
                        path="/login"
                        element={<Login />}
                    />

                    <Route
                        path="/register"
                        element={<Register />}
                    />

                    {/* PROTECTED */}

                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <Layout />
                            </ProtectedRoute>
                        }
                    >
                        <Route
                            index
                            element={
                                <Navigate
                                    to="/dashboard"
                                    replace
                                />
                            }
                        />

                        <Route
                            path="dashboard"
                            element={<Dashboard />}
                        />

                        <Route
                            path="upload"
                            element={<Upload />}
                        />

                        <Route
                            path="documents"
                            element={<Documents />}
                        />

                        <Route
                            path="documents/:id"
                            element={<DocumentDetails />}
                        />

                        {/* APPROVALS */}

                        <Route
                            path="approvals"
                            element={
                                <RoleRoute
                                    allowedRoles={[
                                        'REVIEWER',
                                        'MANAGER',
                                        'ADMIN',
                                    ]}
                                >
                                    <Approvals />
                                </RoleRoute>
                            }
                        />

                        {/* Messages */}
                        <Route
                            path="messages"
                            element={
                                <ProtectedRoute>
                                    <Messages />
                                </ProtectedRoute>
                            }
                        />

                        {/* SEARCH */}

                        <Route
                            path="search"
                            element={<Search />}
                        />

                        {/* ANALYTICS */}

                        <Route
                            path="analytics"
                            element={
                                <RoleRoute
                                    allowedRoles={[
                                        'MANAGER',
                                        'ADMIN',
                                    ]}
                                >
                                    <Analytics />
                                </RoleRoute>
                            }
                        />

                        {/* REPORTS */}

                        <Route
                            path="reports"
                            element={
                                <RoleRoute
                                    allowedRoles={['MANAGER', 'ADMIN']}
                                >
                                    <Reports />
                                </RoleRoute>
                            }
                        />

                        <Route path="/profile" element={<Profile />} />

                        {/* USERS */}

                        <Route
                            path="users"
                            element={
                                <RoleRoute
                                    allowedRoles={[
                                        'ADMIN',
                                        'MANAGER',
                                    ]}
                                >
                                    <Users />
                                </RoleRoute>
                            }
                        />

                        {/* AUDIT LOGS */}
                        <Route
                            path="audit-logs"
                            element={
                                <RoleRoute allowedRoles={['ADMIN']}>
                                    <AuditLogs />
                                </RoleRoute>
                            }
                        />

                        {/* FALLBACK */}

                        <Route
                            path="*"
                            element={
                                <Navigate
                                    to="/dashboard"
                                    replace
                                />
                            }
                        />

                    </Route>

                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;