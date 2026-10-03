import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { axiosInstance } from '@/api/axiosInstance';

const schema = z.object({
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.'),
  password_confirmation: z.string(),
}).refine((d) => d.password === d.password_confirmation, {
  message: 'Les mots de passe ne correspondent pas.',
  path: ['password_confirmation'],
});

type Form = z.infer<typeof schema>;

/** Page publique : le copropriétaire choisit son mot de passe via son lien (usage unique, 7 jours). */
export default function ActivatePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Form) => {
    setLoading(true);
    setServerError(null);
    try {
      await axiosInstance.post(`/api/auth/activate/${token}`, data);
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        ?? 'Activation impossible. Vérifiez votre lien.';
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-surface-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-card p-8">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Activer mon compte</h1>
        <p className="text-sm text-text-muted mb-6">Choisissez le mot de passe de votre espace copropriétaire.</p>

        {done ? (
          <div className="p-4 bg-emerald-50 text-emerald-700 rounded-lg text-sm">
            Compte activé ! Redirection vers la connexion...
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="p-3 text-sm text-danger bg-danger-light border border-danger-border rounded-lg">
                {serverError}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Mot de passe</label>
              <input type="password" {...register('password')}
                className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
              {errors.password && <p className="text-xs text-danger mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Confirmer le mot de passe</label>
              <input type="password" {...register('password_confirmation')}
                className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
              {errors.password_confirmation && <p className="text-xs text-danger mt-1">{errors.password_confirmation.message}</p>}
            </div>
            <button type="submit" disabled={loading}
              className="w-full px-4 py-2.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50">
              {loading ? 'Activation...' : 'Activer mon compte'}
            </button>
          </form>
        )}

        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-brand-600 hover:underline">Retour à la connexion</Link>
        </div>
      </div>
    </div>
  );
}
