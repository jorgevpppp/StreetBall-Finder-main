import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../services/authService';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            if (isLogin) {
                await login(email, password);
                navigate('/');
            } else {
                await register(username, email, password);
                // Si el registro es exitoso, intentamos iniciar sesión automáticamente
                await login(email, password);
                navigate('/');
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || err.message || "Error al procesar la solicitud.");
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError(null);
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="bg-white p-8 rounded shadow-md w-96 transition-all duration-300">
                <h2 className="text-2xl font-bold mb-4 text-center">
                    {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
                </h2>
                
                {error && <p className="text-red-500 text-sm mb-3 text-center bg-red-50 p-2 rounded">{error}</p>}
                
                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">Nombre de Usuario</label>
                            <input 
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-basket-orange" 
                                type="text" 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required={!isLogin}
                                placeholder="Tu nombre en la cancha"
                            />
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                        <input 
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-basket-orange" 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="correo@ejemplo.com"
                        />
                    </div>
                    
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Contraseña</label>
                        <input 
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-basket-orange" 
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="******"
                        />
                    </div>
                    
                    <button 
                        type="submit"
                        className="bg-basket-orange hover:bg-orange-700 text-white font-bold py-2 px-4 rounded w-full transition-colors mb-4"
                    >
                        {isLogin ? 'Entrar' : 'Registrarse'}
                    </button>
                    
                    <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">
                            {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}
                        </p>
                        <button 
                            type="button"
                            onClick={toggleMode}
                            className="text-basket-orange hover:text-orange-800 font-bold text-sm underline"
                        >
                            {isLogin ? 'Crear cuenta nueva' : 'Volver a Iniciar Sesión'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;