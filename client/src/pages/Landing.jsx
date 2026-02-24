import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../services/authService";

export default function Landing() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-black relative overflow-x-hidden">

      {/* SIDEBAR */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white border-r border-basket-orange/30 shadow-lg
        transform transition-transform duration-300 ease-in-out z-40
        ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="p-6 flex flex-col justify-between h-full">

          <div>
            <h2 className="text-xl font-black text-basket-orange mb-8">
              MENÚ
            </h2>

            <nav className="space-y-4">
              <button
                onClick={() => { navigate("/"); setIsOpen(false); }}
                className="block w-full text-left hover:text-basket-orange transition"
              >
                Inicio
              </button>

              {/* 👇 CORREGIDO */}
              <button
                onClick={() => { navigate("/home/map"); setIsOpen(false); }}
                className="block w-full text-left hover:text-basket-orange transition"
              >
                Mapa
              </button>

              {/* 👇 CORREGIDO */}
              <button
                onClick={() => { navigate("/home/events"); setIsOpen(false); }}
                className="block w-full text-left hover:text-basket-orange transition"
              >
                Eventos
              </button>

              <button
                onClick={() => { navigate("/home"); setIsOpen(false); }}
                className="block w-full text-left hover:text-basket-orange transition"
              >
                Pistas
              </button>
            </nav>
          </div>

          {/* USUARIO ABAJO */}
          <div className="border-t border-basket-orange/20 pt-6">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-basket-orange flex items-center justify-center text-black font-bold">
                  {user.username?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold">{user.username}</p>
                  <p className="text-sm text-gray-400">{user.email}</p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-basket-orange text-black py-2 rounded font-bold hover:shadow-[0_0_20px_rgba(255,107,0,0.7)] transition"
              >
                Iniciar Sesión
              </button>
            )}
          </div>

        </div>
      </aside>

      {/* CONTENEDOR PRINCIPAL */}
      <div
        className={`transition-all duration-300 ease-in-out
        ${isOpen ? "ml-72" : "ml-0"}`}
      >

        {/* HEADER */}
        <header className="h-20 flex items-center border-b border-basket-orange/30 px-6">

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-basket-orange font-bold hover:scale-110 transition"
          >
            ☰ MENÚ
          </button>

          <h1 className="flex-1 text-center text-3xl font-black text-basket-orange tracking-widest">
            STREETBALL FINDER
          </h1>

          <div className="w-24"></div>
        </header>

        {/* CONTENIDO */}
        <main className="p-12 space-y-24">

          {/* HERO */}
          <section className="text-center space-y-6">
            <h2 className="text-6xl font-black text-basket-orange">
              Encuentra tu próxima cancha
            </h2>

            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              StreetBall Finder conecta jugadores en tiempo real.
              Descubre pistas, únete a eventos y organiza partidos en segundos.
            </p>

            <div className="flex justify-center gap-6 pt-6">
              {/* 👇 CORREGIDO */}
              <button
                onClick={() => navigate("/home/events")}
                className="bg-basket-orange text-black px-8 py-4 rounded-xl font-black uppercase tracking-wide shadow-[0_6px_0px_0px_#8B2E00] hover:scale-105 transition"
              >
                Ver Eventos
              </button>

              {/* 👇 CORREGIDO */}
              <button
                onClick={() => navigate("/home/map")}
                className="border-2 border-basket-orange text-basket-orange px-8 py-4 rounded-xl font-bold hover:bg-basket-orange hover:text-black transition"
              >
                Explorar Mapa
              </button>
            </div>
          </section>

          {/* EVENTOS DESTACADOS */}
          <section className="space-y-10">

            <h3 className="text-4xl font-black text-basket-orange text-center">
              Eventos Destacados
            </h3>

            <div className="grid md:grid-cols-3 gap-8">
              {[1,2,3].map((e) => (
                <div
                  key={e}
                  className="bg-white rounded-xl overflow-hidden border border-basket-orange/30 hover:shadow-[0_0_30px_rgba(255,107,0,0.4)] transition cursor-pointer"
                  onClick={() => navigate("/home/events")}   // 👈 CORREGIDO
                >
                  <div className="h-48 bg-gray-800"></div>

                  <div className="p-6">
                    <h4 className="font-black text-black mb-2">
                      Partido 3x3
                    </h4>

                    <p className="text-gray-400 text-sm mb-4">
                      Pista Central · 18:00h · Nivel Intermedio
                    </p>

                    <p className="text-gray-500 text-sm">
                      Partido amistoso abierto a todos los niveles.
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center pt-10">
              <button
                onClick={() => navigate("/home/events")}   // 👈 CORREGIDO
                className="bg-basket-orange text-black px-10 py-4 rounded-xl font-black uppercase tracking-wide hover:scale-105 transition"
              >
                Ver todos los eventos
              </button>
            </div>

          </section>

        </main>
      </div>
    </div>
  );
}