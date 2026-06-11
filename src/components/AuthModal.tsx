import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { X, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'signup';
}

export function AuthModal({ isOpen, onClose, defaultTab = 'login' }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'signup'>(defaultTab);
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [formData, setFormData] = useState({ username: '', email: '', password: '', fullName: '', identifier: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (tab === 'login') {
        const payload = {
          identifier: formData.identifier,
          password: formData.password
        };
        
        const res = await api.post('/auth/login', payload);
        setAuth(res.data.data.user, res.data.data.token);
        onClose();
      } else {
        const payload = {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName
        };
        const res = await api.post('/auth/register', payload);
        setAuth(res.data.data.user, res.data.data.token);
        onClose();
      }
    } catch (err: any) {
      if (err.response?.data?.errors?.length > 0) {
        setError(err.response.data.errors[0].message);
      } else {
        setError(err.response?.data?.detail || 'Ha ocurrido un error al intentar autenticar.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
      <div className="relative w-full max-w-md">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute right-4 top-4 z-10 text-muted-foreground hover:text-foreground rounded-full"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
        <Card className="glass-panel border-white/10 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-emerald-500" />
          <CardHeader className="pt-8">
            <CardTitle className="text-2xl text-center">
              {tab === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </CardTitle>
            <CardDescription className="text-center">
              {tab === 'login' ? 'Bienvenido de vuelta a tu quiniela' : 'Únete y compite con tus amigos'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-6 p-1 bg-black/20 rounded-lg">
              <Button 
                variant={tab === 'login' ? 'default' : 'ghost'} 
                className="w-full"
                onClick={() => { setTab('login'); setError(''); }}
              >
                Login
              </Button>
              <Button 
                variant={tab === 'signup' ? 'default' : 'ghost'} 
                className="w-full"
                onClick={() => { setTab('signup'); setError(''); }}
              >
                Registro
              </Button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded bg-destructive/20 border border-destructive/50 text-destructive-foreground text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              {tab === 'signup' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nombre completo</Label>
                    <Input id="fullName" value={formData.fullName} onChange={handleChange} placeholder="Juan Pérez" className="bg-black/20 border-white/10" required={tab === 'signup'} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Nombre de usuario</Label>
                    <Input id="username" value={formData.username} onChange={handleChange} placeholder="juanperez" className="bg-black/20 border-white/10" required={tab === 'signup'} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input id="email" type="email" value={formData.email} onChange={handleChange} placeholder="correo@ejemplo.com" className="bg-black/20 border-white/10" required={tab === 'signup'} />
                  </div>
                </>
              )}

              {tab === 'login' && (
                <div className="space-y-2">
                  <Label htmlFor="identifier">Usuario o Correo electrónico</Label>
                  <Input id="identifier" type="text" value={formData.identifier} onChange={handleChange} placeholder="correo@ejemplo.com o juanperez" className="bg-black/20 border-white/10" required={tab === 'login'} />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" value={formData.password} onChange={handleChange} placeholder="••••••••" className="bg-black/20 border-white/10" required />
              </div>
              
              <Button disabled={loading} className="w-full bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/80 hover:to-emerald-500/80 text-primary-foreground font-bold border-none mt-4">
                {loading ? 'Cargando...' : (tab === 'login' ? 'Entrar' : 'Registrarse')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
