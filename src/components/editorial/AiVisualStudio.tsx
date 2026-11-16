import React, { useState } from 'react';
import { ImageIcon, Loader2, Sparkles } from 'lucide-react';

interface AiVisualStudioProps {
  isLight: boolean;
}

export const AiVisualStudio: React.FC<AiVisualStudioProps> = ({ isLight }) => {
  const [prompt, setPrompt] = useState('An educational cutaway illustration of the SPHEREx space telescope mapping the infrared sky, with six detector arrays and a luminous all-sky panorama. Elegant scientific concept art, deep navy and cyan palette.');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch('/api/gemini/visualize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || `Image generation failed (HTTP ${response.status}).`);
      }
      if (!payload.imageData || !payload.mimeType) {
        throw new Error('Gemini returned no image. Try a more specific prompt.');
      }
      setImageUrl(`data:${payload.mimeType};base64,${payload.imageData}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate the illustration.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section className={`my-16 overflow-hidden rounded-3xl border p-5 sm:p-7 backdrop-blur-xl ${isLight
      ? 'border-cyan-900/15 bg-white/75 text-slate-900 shadow-[0_18px_50px_rgba(15,40,60,.08)]'
      : 'border-cyan-300/20 bg-slate-950/65 text-white shadow-[0_20px_60px_rgba(0,0,0,.28)]'}`}>
      <div className="grid gap-6 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
        <div>
          <div className={`mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[.18em] ${isLight
            ? 'border-cyan-700/20 bg-cyan-50 text-cyan-800'
            : 'border-cyan-300/20 bg-cyan-400/10 text-cyan-200'}`}>
            <Sparkles className="h-3.5 w-3.5" /> Gemini Visual Studio
          </div>
          <h2 className={`text-2xl font-semibold tracking-tight sm:text-3xl ${isLight ? 'text-slate-950' : 'text-white'}`}>
            Turn a cosmic question into a visual.
          </h2>
          <p className={`mt-3 max-w-xl text-sm leading-6 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            Create an original astronomy illustration for learning and storytelling. Generated artwork is illustrative—not a SPHEREx frame, telescope observation, measured dataset, or scientific detection.
          </p>
          <form onSubmit={generate} className="mt-5 space-y-3">
            <label className={`block text-[10px] font-mono uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`} htmlFor="gemini-visual-prompt">
              Describe the visual
            </label>
            <textarea
              id="gemini-visual-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              maxLength={500}
              rows={4}
              className={`w-full resize-y rounded-xl border px-3 py-3 text-sm leading-6 outline-none transition focus:ring-2 focus:ring-cyan-400/30 ${isLight
                ? 'border-slate-300 bg-white/90 text-slate-900 placeholder:text-slate-400 focus:border-cyan-700'
                : 'border-white/15 bg-black/25 text-slate-100 placeholder:text-slate-500 focus:border-cyan-300'}`}
              placeholder="Describe an astronomy concept to illustrate..."
            />
            <div className="flex items-center justify-between gap-3">
              <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>{prompt.length}/500</span>
              <button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-950/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isGenerating ? 'Creating visual…' : 'Generate illustration'}
              </button>
            </div>
          </form>
          {error && <p role="alert" className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{error}</p>}
        </div>

        <div className={`relative flex min-h-[240px] items-center justify-center overflow-hidden rounded-2xl border ${isLight
          ? 'border-slate-200 bg-gradient-to-br from-slate-100 via-cyan-50 to-indigo-50'
          : 'border-white/10 bg-gradient-to-br from-slate-900 via-[#08182a] to-indigo-950/70'}`}>
          {imageUrl ? (
            <div className="w-full">
              <img src={imageUrl} alt="AI-generated astronomy concept illustration; not an observational image" className="block max-h-[430px] w-full object-cover" />
              <div className="flex items-center justify-between gap-2 border-t border-white/10 bg-black/55 px-3 py-2 text-[10px] text-white">
                <span className="inline-flex items-center gap-1.5"><ImageIcon className="h-3 w-3" /> AI-generated illustration</span>
                <span>Not observational data</span>
              </div>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-300 shadow-[0_0_40px_rgba(34,211,238,.12)]">
                {isGenerating ? <Loader2 className="h-8 w-8 animate-spin" /> : <ImageIcon className="h-8 w-8" />}
              </div>
              <p className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                {isGenerating ? 'Composing your illustration' : 'Your visual study appears here'}
              </p>
              <p className={`mt-2 text-xs ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                {isGenerating ? 'Image generation can take a little while.' : 'Choose a concept and generate an original visual.'}
              </p>
            </div>
          )}
        </div>
      </div>
      <p className={`mt-4 text-[10px] leading-5 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
        AI-generated artwork may contain scientific inaccuracies. Use it as an educational illustration, not as evidence or a substitute for source imagery.
      </p>
    </section>
  );
};
