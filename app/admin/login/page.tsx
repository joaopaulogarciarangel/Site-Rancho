'use client';
export const dynamic = 'force-dynamic';
import React, { useState } from 'react';
import { Lock, Mail, ChefHat, ArrowRight, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase'; // Ajuste o caminho se necessário

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro(null);

    // Chama a autenticação nativa do Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErro('E-mail ou senha incorretos. Tente novamente.');
      setLoading(false);
      return;
    }

    if (data.user) {
      // Sucesso! Aqui nós redirecionamos o gestor para o Dashboard
      // Se estiver usando o Next.js App Router, pode usar o useRouter() do 'next/navigation'
      window.location.href = '/admin/dashboard'; 
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-gray-950 border border-gray-800 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* HEADER DO LOGIN */}
        <div className="bg-gray-900 p-8 text-center border-b border-gray-800">
          <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-600/20">
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider">Portal do Gestor</h1>
          <p className="text-gray-400 font-medium mt-2">Acesso restrito à administração</p>
        </div>

        {/* FORMULÁRIO */}
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            
            {erro && (
              <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-center gap-3 text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-bold">{erro}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">E-mail Administrativo</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-4 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="admin@restaurante.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Senha de Acesso</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-4 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-orange-600 hover:bg-orange-500 text-white font-black text-lg py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Autenticando...' : (
                <>
                  Acessar Painel <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}