import React, { useState, useEffect, useRef } from 'react';
import { 
  Clapperboard, 
  Coffee, 
  Users, 
  Film, 
  DollarSign, 
  Calendar, 
  Music, 
  Layout, 
  Download, 
  ChevronRight, 
  Loader2, 
  Plus,
  ArrowRight,
  Sparkles,
  FileText,
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import html2pdf from 'html2pdf.js';
import { AppView, ProductionPackage } from './types';
import { generateFullProductionPackage } from './services/gemini';

export default function App() {
  const [view, setView] = useState<AppView>(AppView.CONCEPT);
  const [concept, setConcept] = useState('');
  const [isBrewing, setIsBrewing] = useState(false);
  const [production, setProduction] = useState<ProductionPackage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [brewStep, setBrewStep] = useState(0);
  
  // Auth & User State
  const [user, setUser] = useState<{ id: number; username: string } | null>(() => {
    const saved = localStorage.getItem('cinema_brew_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authForm, setAuthForm] = useState({ username: '', password: '' });
  const [savedProjects, setSavedProjects] = useState<any[]>([]);
  const [showProjects, setShowProjects] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('cinema_brew_user', JSON.stringify(user));
      fetchProjects();
    } else {
      localStorage.removeItem('cinema_brew_user');
    }
  }, [user]);

  const fetchProjects = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/projects/${user.id}`);
      const data = await res.json();
      setSavedProjects(data);
    } catch (err) {
      console.error("Failed to fetch projects");
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Authentication failed");
    }
  };

  const handleSaveProject = async () => {
    if (!user || !production) return;
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          concept: production.concept,
          data: production
        })
      });
      if (res.ok) {
        fetchProjects();
        alert("Project saved to your studio archive!");
      }
    } catch (err) {
      alert("Failed to save project");
    }
  };

  const brewSteps = [
    "Analyzing concept architecture...",
    "Drafting industry-standard screenplay...",
    "Casting psychological character profiles...",
    "Calculating line-item production budget...",
    "Scouting virtual locations...",
    "Rendering cinematic storyboard frames...",
    "Finalizing production bible..."
  ];

  useEffect(() => {
    if (isBrewing) {
      const interval = setInterval(() => {
        setBrewStep(prev => (prev + 1) % brewSteps.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isBrewing]);

  const handleBrew = async () => {
    if (!concept.trim()) return;
    
    setIsBrewing(true);
    setError(null);
    setBrewStep(0);
    
    try {
      const result = await generateFullProductionPackage(concept);
      setProduction(result);
      setView(AppView.SCREENPLAY);
    } catch (err: any) {
      setError(err.message || "The studio encountered a production delay. Please try again.");
    } finally {
      setIsBrewing(false);
    }
  };

  const exportToPDF = (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    const opt = {
      margin: 1,
      filename: `${filename}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="cinematic-glow" />
      
      <AnimatePresence>
        {!user && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-950"
          >
            <div className="glass p-12 rounded-[40px] w-full max-w-md border border-white/5 text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500 mx-auto flex items-center justify-center shadow-2xl shadow-amber-500/20 mb-8">
                <Coffee className="text-stone-950 w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Studio Access</h2>
              <p className="text-stone-500 text-sm mb-8">Enter your credentials to access the production office.</p>
              
              <form onSubmit={handleAuth} className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Username"
                  value={authForm.username}
                  onChange={e => setAuthForm({...authForm, username: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-amber-500 transition-all"
                  required
                />
                <input 
                  type="password" 
                  placeholder="Password"
                  value={authForm.password}
                  onChange={e => setAuthForm({...authForm, password: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-amber-500 transition-all"
                  required
                />
                <button className="w-full py-4 bg-amber-500 text-stone-950 font-bold rounded-2xl hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20">
                  {authMode === 'login' ? 'Enter Studio' : 'Create Account'}
                </button>
              </form>
              
              {error && <p className="mt-4 text-red-400 text-xs">{error}</p>}
              
              <button 
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                className="mt-8 text-stone-500 text-xs hover:text-white transition-colors"
              >
                {authMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Login"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      {production && user && (
        <aside className="fixed left-0 top-0 h-full w-64 glass border-r border-white/5 z-50 no-print">
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Coffee className="text-stone-950 w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight">CINEMA BREW</h1>
              <p className="text-[10px] text-stone-500 uppercase tracking-widest">{user.username}'s Studio</p>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            <NavItem 
              icon={<FileText size={18} />} 
              label="Screenplay" 
              active={view === AppView.SCREENPLAY} 
              onClick={() => setView(AppView.SCREENPLAY)} 
            />
            <NavItem 
              icon={<Users size={18} />} 
              label="Characters" 
              active={view === AppView.CHARACTERS} 
              onClick={() => setView(AppView.CHARACTERS)} 
            />
            <NavItem 
              icon={<ImageIcon size={18} />} 
              label="Storyboard" 
              active={view === AppView.STORYBOARD} 
              onClick={() => setView(AppView.STORYBOARD)} 
            />
            <NavItem 
              icon={<Layout size={18} />} 
              label="Breakdown" 
              active={view === AppView.BREAKDOWN} 
              onClick={() => setView(AppView.BREAKDOWN)} 
            />
            <NavItem 
              icon={<Sparkles size={18} />} 
              label="Pitch Deck" 
              active={view === AppView.PITCH_DECK} 
              onClick={() => setView(AppView.PITCH_DECK)} 
            />
            <NavItem 
              icon={<Users size={18} />} 
              label="Crew Needs" 
              active={view === AppView.CREW} 
              onClick={() => setView(AppView.CREW)} 
            />
            <NavItem 
              icon={<Layout size={18} />} 
              label="Locations" 
              active={view === AppView.LOCATIONS} 
              onClick={() => setView(AppView.LOCATIONS)} 
            />
            <NavItem 
              icon={<DollarSign size={18} />} 
              label="Budget" 
              active={view === AppView.BUDGET} 
              onClick={() => setView(AppView.BUDGET)} 
            />
            <NavItem 
              icon={<Calendar size={18} />} 
              label="Schedule" 
              active={view === AppView.SCHEDULE} 
              onClick={() => setView(AppView.SCHEDULE)} 
            />
            <NavItem 
              icon={<Music size={18} />} 
              label="Sound Design" 
              active={view === AppView.SOUND_DESIGN} 
              onClick={() => setView(AppView.SOUND_DESIGN)} 
            />
          </nav>

          <div className="absolute bottom-0 left-0 w-full p-6 border-t border-white/5 space-y-2">
            <button 
              onClick={handleSaveProject}
              className="w-full py-2 bg-amber-500/10 text-amber-500 text-xs font-bold rounded-lg border border-amber-500/20 hover:bg-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={14} /> Save to Archive
            </button>
            <button 
              onClick={() => { setProduction(null); setView(AppView.CONCEPT); }}
              className="w-full py-2 text-xs text-stone-500 hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={14} /> New Production
            </button>
            <button 
              onClick={() => setUser(null)}
              className="w-full py-2 text-xs text-red-400/50 hover:text-red-400 transition-colors flex items-center justify-center gap-2"
            >
              Sign Out
            </button>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 transition-all duration-500 ${production && user ? 'ml-64' : 'ml-0'}`}>
        <AnimatePresence mode="wait">
          {!production && user ? (
            <div className="relative">
              <div className="absolute top-8 right-8 z-10">
                <button 
                  onClick={() => setShowProjects(!showProjects)}
                  className="px-4 py-2 glass border border-white/5 rounded-xl text-xs text-stone-400 hover:text-white transition-all flex items-center gap-2"
                >
                  <Layout size={14} /> {showProjects ? 'Back to Lab' : 'Studio Archive'}
                </button>
              </div>

              {showProjects ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-12 max-w-5xl mx-auto"
                >
                  <h2 className="text-3xl font-bold text-white mb-8">Studio Archive</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedProjects.length === 0 && (
                      <p className="text-stone-500 col-span-full text-center py-20">No projects archived yet. Brew your first masterpiece.</p>
                    )}
                    {savedProjects.map((p, i) => (
                      <div 
                        key={i} 
                        onClick={() => { setProduction(p.data); setView(AppView.SCREENPLAY); setShowProjects(false); }}
                        className="glass p-6 rounded-3xl border border-white/5 hover:border-amber-500/30 cursor-pointer transition-all group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-amber-500/10 transition-all">
                          <Film className="text-stone-500 group-hover:text-amber-500" />
                        </div>
                        <h3 className="text-white font-bold mb-2 line-clamp-2">{p.concept}</h3>
                        <p className="text-stone-500 text-[10px] uppercase tracking-widest">{new Date(p.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <ConceptLab 
                  concept={concept} 
                  setConcept={setConcept} 
                  onBrew={handleBrew} 
                  isBrewing={isBrewing} 
                  brewStep={brewStep}
                  brewSteps={brewSteps}
                  error={error}
                />
              )}
            </div>
          ) : user && (
            <motion.div 
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-8 max-w-5xl mx-auto"
            >
              <div className="flex items-center justify-between mb-8 no-print">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">{view.replace('_', ' ')}</h2>
                  <p className="text-stone-500 text-sm">Production Bible / {production.concept.slice(0, 40)}...</p>
                </div>
                <button 
                  onClick={() => exportToPDF('export-content', `CinemaBrew_${view}`)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm flex items-center gap-2 transition-all"
                >
                  <Download size={16} /> Export PDF
                </button>
              </div>

              <div id="export-content">
                {view === AppView.SCREENPLAY && <ScreenplayView screenplay={production.screenplay} />}
                {view === AppView.CHARACTERS && <CharactersView characters={production.characters} />}
                {view === AppView.STORYBOARD && <StoryboardView storyboard={production.storyboard} />}
                {view === AppView.BREAKDOWN && <BreakdownView breakdown={production.breakdown} />}
                {view === AppView.PITCH_DECK && <PitchDeckView pitchDeck={production.pitchDeck} />}
                {view === AppView.CREW && <CrewView crew={production.crewNeeds} />}
                {view === AppView.LOCATIONS && <LocationsView locations={production.locations} />}
                {view === AppView.BUDGET && <BudgetView budget={production.budget} />}
                {view === AppView.SCHEDULE && <ScheduleView schedule={production.schedule} />}
                {view === AppView.SOUND_DESIGN && <SoundDesignView soundDesign={production.soundDesign} />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-300 ${
        active 
          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
          : 'text-stone-400 hover:text-white hover:bg-white/5 border border-transparent'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
      {active && <motion.div layoutId="active-pill" className="ml-auto w-1 h-4 bg-amber-500 rounded-full" />}
    </button>
  );
}

function ConceptLab({ concept, setConcept, onBrew, isBrewing, brewStep, brewSteps, error }: any) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-12 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="w-20 h-20 rounded-3xl bg-amber-500 mx-auto flex items-center justify-center shadow-2xl shadow-amber-500/20 mb-8">
            <Coffee className="text-stone-950 w-10 h-10" />
          </div>
          <h1 className="text-5xl font-bold tracking-tighter text-white mb-4">Your Masterpiece Begins.</h1>
          <p className="text-stone-400 text-lg max-w-md mx-auto">
            Transform a simple concept into a full-scale professional pre-production bible.
          </p>
        </motion.div>

        {!isBrewing ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative group"
          >
            <textarea 
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Enter your film concept (e.g., A neo-noir thriller about a detective who can see only in black and white...)"
              className="w-full h-48 bg-stone-900/50 border border-white/10 rounded-3xl p-8 text-lg focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition-all resize-none placeholder:text-stone-600"
            />
            <button 
              onClick={onBrew}
              disabled={!concept.trim()}
              className="absolute bottom-6 right-6 px-8 py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:hover:bg-amber-500 text-stone-950 font-bold rounded-2xl flex items-center gap-3 transition-all shadow-xl shadow-amber-500/20"
            >
              Brew Production <Sparkles size={20} />
            </button>
            {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}
          </motion.div>
        ) : (
          <div className="space-y-8">
            <div className="relative w-32 h-32 mx-auto">
              <div className="absolute inset-0 border-4 border-white/5 rounded-full" />
              <motion.div 
                className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Coffee className="text-amber-500 w-8 h-8" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-medium text-white">Brewing Production...</h3>
              <p className="text-stone-500 animate-pulse">{brewSteps[brewStep]}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ScreenplayView({ screenplay }: { screenplay: string }) {
  return (
    <div className="screenplay-paper p-16 min-h-[1000px] rounded-sm">
      <div className="max-w-2xl mx-auto prose prose-stone prose-invert screenplay-font">
        <Markdown>{screenplay}</Markdown>
      </div>
    </div>
  );
}

function CharactersView({ characters = [] }: { characters?: any[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {characters?.map((char, i) => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="glass p-8 rounded-3xl border border-white/5"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">{char.name}</h3>
              <p className="text-amber-500 text-sm font-medium uppercase tracking-wider">{char.role}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
              <Users className="text-stone-500" />
            </div>
          </div>
          <div className="space-y-4 text-sm">
            <p className="text-stone-300 leading-relaxed">{char.description}</p>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
              <div>
                <p className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">Motivation</p>
                <p className="text-white text-xs">{char.motivation}</p>
              </div>
              <div>
                <p className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">Arc</p>
                <p className="text-white text-xs">{char.arc}</p>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function StoryboardView({ storyboard = [] }: { storyboard?: any[] }) {
  return (
    <div className="space-y-12">
      {storyboard?.map((frame, i) => (
        <div key={i} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="relative aspect-video rounded-3xl overflow-hidden bg-stone-900 border border-white/5 shadow-2xl">
            {frame.imageUrl ? (
              <img src={frame.imageUrl} alt={frame.sceneDescription} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-stone-600">
                <Loader2 className="animate-spin" />
                <p className="text-xs uppercase tracking-widest">Rendering Frame...</p>
              </div>
            )}
            <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-[10px] font-bold text-white border border-white/10 uppercase tracking-widest">
              Frame {i + 1}
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-stone-500 text-[10px] uppercase tracking-[0.2em] font-bold">Scene Description</h4>
            <p className="text-xl text-white leading-relaxed font-medium italic">"{frame.sceneDescription}"</p>
            <div className="pt-6 flex gap-2">
              <div className="w-1 h-12 bg-amber-500/50 rounded-full" />
              <p className="text-stone-400 text-sm italic">Generated using Gemini 2.5 Flash Image. Cinematic lighting, 35mm lens profile.</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BreakdownView({ breakdown = [] }: { breakdown?: any[] }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-12 gap-4 px-6 py-3 text-[10px] font-bold text-stone-500 uppercase tracking-widest border-b border-white/5">
        <div className="col-span-1">Scene</div>
        <div className="col-span-3">Location</div>
        <div className="col-span-2">Time</div>
        <div className="col-span-6">Elements</div>
      </div>
      {breakdown?.map((item, i) => (
        <div key={i} className="grid grid-cols-12 gap-4 glass p-6 rounded-2xl border border-white/5 items-center">
          <div className="col-span-1 font-mono text-amber-500 font-bold">#{item.scene}</div>
          <div className="col-span-3 font-medium text-white">{item.location}</div>
          <div className="col-span-2 text-stone-400 text-sm">{item.timeOfDay}</div>
          <div className="col-span-6 flex flex-wrap gap-2">
            {item.props?.map((p: string, j: number) => <Tag key={j} label={p} color="blue" />)}
            {item.costumes?.map((c: string, j: number) => <Tag key={j} label={c} color="purple" />)}
            {item.sfx?.map((s: string, j: number) => <Tag key={j} label={s} color="red" />)}
            {item.vfx?.map((v: string, j: number) => <Tag key={j} label={v} color="emerald" />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function Tag({ label, color }: { label: string, color: string }) {
  const colors: any = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };
  return <span className={`px-2 py-0.5 rounded text-[10px] border ${colors[color]}`}>{label}</span>;
}

function BudgetView({ budget = [] }: { budget?: any[] }) {
  const total = budget?.reduce((acc, curr) => acc + (curr.estimatedCost || 0), 0) || 0;
  return (
    <div className="space-y-8">
      <div className="glass p-8 rounded-3xl border border-white/5 flex items-center justify-between">
        <div>
          <p className="text-stone-500 text-[10px] uppercase tracking-widest font-bold mb-1">Estimated Total Budget</p>
          <h3 className="text-4xl font-bold text-white">${total.toLocaleString()}</h3>
        </div>
        <div className="text-right">
          <p className="text-amber-500 text-xs font-bold uppercase tracking-widest">Status: Preliminary</p>
          <p className="text-stone-500 text-[10px]">Includes 15% Contingency</p>
        </div>
      </div>
      
      <div className="space-y-3">
        {budget?.map((item, i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-stone-900 flex items-center justify-center text-stone-500">
                <DollarSign size={18} />
              </div>
              <div>
                <p className="text-white font-medium">{item.label}</p>
                <p className="text-stone-500 text-xs">{item.category}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-mono">${item.estimatedCost.toLocaleString()}</p>
              <p className="text-stone-600 text-[10px]">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScheduleView({ schedule = [] }: { schedule?: any[] }) {
  return (
    <div className="grid grid-cols-1 gap-8">
      {schedule?.map((day, i) => (
        <div key={i} className="relative pl-8 border-l border-white/10">
          <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-amber-500" />
          <div className="mb-4">
            <h3 className="text-xl font-bold text-white">Day {day.dayNumber}</h3>
            <p className="text-stone-500 text-sm">Estimated Hours: {day.estimatedHours}h</p>
          </div>
          <div className="glass p-6 rounded-2xl border border-white/5 space-y-4">
            <div className="flex gap-2">
              {day.scenes?.map((s: number) => (
                <span key={s} className="px-3 py-1 bg-white/5 rounded-lg text-xs font-mono text-amber-500 border border-white/5">
                  Scene #{s}
                </span>
              ))}
            </div>
            <p className="text-stone-400 text-sm leading-relaxed">{day.notes}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SoundDesignView({ soundDesign = [] }: { soundDesign?: any[] }) {
  return (
    <div className="space-y-6">
      {soundDesign?.map((cue, i) => (
        <div key={i} className="glass p-8 rounded-3xl border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <Music className="text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Scene #{cue.sceneNumber}</h3>
                <p className="text-stone-500 text-xs uppercase tracking-widest">{cue.environment}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-stone-500 text-[10px] uppercase tracking-widest mb-1">Emotional Goal</p>
              <p className="text-white text-sm font-medium italic">"{cue.emotionalGoal}"</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {cue.cues?.map((c: string, j: number) => (
              <div key={j} className="flex items-center gap-2 px-4 py-2 bg-stone-900 rounded-xl border border-white/5 text-stone-300 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {c}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PitchDeckView({ pitchDeck = [] }: { pitchDeck?: any[] }) {
  return (
    <div className="space-y-8">
      {pitchDeck?.map((slide, i) => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="glass p-12 rounded-[40px] border border-white/5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Sparkles size={120} />
          </div>
          <div className="relative z-10">
            <h3 className="text-4xl font-bold text-white mb-6 tracking-tight">{slide.title}</h3>
            <div className="prose prose-stone prose-invert max-w-none text-lg text-stone-300 leading-relaxed">
              <Markdown>{slide.content}</Markdown>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function CrewView({ crew = [] }: { crew?: any[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {crew?.map((member, i) => (
        <div key={i} className="glass p-6 rounded-3xl border border-white/5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
            <Users className="text-stone-500" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-white mb-1">{member.role}</h4>
            <p className="text-stone-400 text-sm leading-relaxed">{member.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function LocationsView({ locations = [] }: { locations?: any[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {locations?.map((loc, i) => (
        <div key={i} className="glass p-8 rounded-3xl border border-white/5 space-y-4">
          <div className="w-full aspect-video rounded-2xl bg-stone-900 flex items-center justify-center border border-white/5">
            <ImageIcon className="text-stone-800 w-12 h-12" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-white mb-1">{loc.name}</h4>
            <p className="text-amber-500 text-[10px] uppercase tracking-widest font-bold mb-3">{loc.aesthetic}</p>
            <p className="text-stone-400 text-sm leading-relaxed">{loc.requirements}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
