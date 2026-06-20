        const { useState, useEffect } = React;
        const Engine = window.MusiChrisEngine;

        const SongItem = ({ song, onProduce, isDisabled }) => (
            <div className="glass-card p-6 rounded-[28px] flex items-center justify-between group animate-fade mb-5">
                <div className="flex-1 pr-6 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${song.shortCount > 0 ? 'bg-[#D4AF37] animate-pulse shadow-[0_0_8px_#D4AF37]' : 'bg-white/10'}`}></span>
                        <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#D4AF37]">
                            {song.shortCount > 0 ? `${song.shortCount} ${song.shortCount === 1 ? 'Short' : 'Shorts'} Realizados` : 'Sin Producciones'}
                        </p>
                    </div>
                    <h4 className="serif text-lg md:text-2xl text-white font-bold leading-tight group-hover:text-[#D4AF37] transition-colors duration-500 mb-1">
                        {song.title}
                    </h4>
                </div>
                
                <div className="shrink-0">
                    <button 
                        onClick={() => onProduce(song.id)}
                        disabled={isDisabled}
                        className={`
                            relative overflow-hidden group/btn px-4 py-2 md:px-8 md:py-4 rounded-full font-black text-[10px] md:text-xs tracking-[0.2em] uppercase transition-all duration-500
                            ${isDisabled ? 'opacity-50 cursor-not-allowed bg-white/5 text-white/20' : 'bg-[#D4AF37] text-black hover:scale-105 active:scale-95 shadow-[0_10px_20px_rgba(212,175,55,0.2)]'}
                        `}
                    >
                        <span className="relative z-10">Publicar</span>
                        <div className="absolute inset-0 bg-white opacity-0 group-hover/btn:opacity-20 transition-opacity"></div>
                    </button>
                </div>
            </div>
        );

        function App() {
            const [songs, setSongs] = useState([]);
            const [pat, setPat] = useState(Engine.getStoredPat());
            const [isConfiguring, setIsConfiguring] = useState(!Engine.getStoredPat());
            const [status, setStatus] = useState('IDLE');
            const [log, setLog] = useState([]);
            const [isLogOpen, setIsLogOpen] = useState(false);
            const [appError, setAppError] = useState(null);

            useEffect(() => {
                window.updateLogUI = () => setLog([...Engine.log].reverse());
                Engine.fetchCatalog().then(setSongs);
                const interval = setInterval(() => Engine.fetchCatalog().then(setSongs), 300000);
                return () => clearInterval(interval);
            }, []);

            const handleProduce = async (songId) => {
                setStatus('WORKING');
                Engine.addLog(`🛰️ Iniciando producción: ${songId}`);
                
                try {
                    const success = await Engine.produceShort(pat, songId);
                    if (success) Engine.addLog(`✅ Orden ejecutada en la nube.`);
                    else throw new Error("Falla en GitHub");
                } catch (err) { 
                    Engine.addLog(`⚠️ Error: ${err.message}`); 
                }
                setStatus('IDLE');
            };

            return (
                <div className="w-full max-w-xl mx-auto px-6 py-12 pb-44">
                    {appError && (
                        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-md animate-slide-up">
                            <div className="bg-red-900/80 backdrop-blur-xl border border-red-500/50 p-4 rounded-2xl flex items-center justify-between shadow-2xl">
                                <p className="text-white text-xs font-bold">{appError}</p>
                                <button onClick={() => setAppError(null)} className="text-white/50 hover:text-white px-2">✕</button>
                            </div>
                        </div>
                    )}
                    <header className="mb-16">
                        <div className="flex justify-between items-start mb-12">
                            <div className="animate-slide-up">
                                <h1 className="serif text-3xl md:text-7xl text-white font-bold leading-none mb-4 group">
                                    <span className="text-[#D4AF37] group-hover:text-white transition-colors duration-700 drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">MusiChris</span> <i className="font-light italic opacity-90 group-hover:text-[#D4AF37] transition-colors duration-700">Shorts</i>
                                </h1>
                                <div className="flex items-center gap-4">
                                    <div className="h-[1px] w-12 bg-[#D4AF37]/40"></div>
                                    <p className="text-[10px] uppercase tracking-[8px] text-[#D4AF37]/80 font-black mt-1 animate-pulse">Golden Mastery Elite</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsConfiguring(true)} 
                                className="w-12 h-12 glass-card rounded-2xl flex items-center justify-center text-lg hover:border-[#D4AF37]/40 active:scale-90 transition-all shadow-xl"
                            > ⚙️ </button>
                        </div>
                    </header>

                    <div className="relative">
                        {songs.length === 0 ? (
                            <div className="py-40 flex flex-col items-center gap-6 opacity-30">
                                <div className="w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
                                <p className="serif italic text-sm tracking-widest">Sincronizando Nexus...</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {songs.map(song => (
                                    <SongItem 
                                        key={song.id} 
                                        song={song} 
                                        onProduce={handleProduce}
                                        isDisabled={status === 'WORKING'}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {isConfiguring && (
                        <div className="fixed inset-0 bg-black/85 backdrop-blur-3xl z-[100] flex items-center justify-center p-8">
                            <div className="glass-card w-full max-w-sm p-12 rounded-[48px] text-center border-white/10 shadow-2xl">
                                <h2 className="serif text-3xl mb-10 gold-glow text-[#D4AF37]">Vincular Motor</h2>
                                <input 
                                    type="password" 
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-center text-sm mb-8 outline-none focus:border-[#D4AF37]/50 transition-all font-mono"
                                    value={pat}
                                    onChange={(e) => setPat(e.target.value)}
                                    placeholder="••••••••"
                                />
                                <button 
                                    onClick={() => { Engine.storePat(pat); setIsConfiguring(false); }} 
                                    className="w-full premium-btn h-16 text-black font-black rounded-2xl text-[12px] tracking-widest uppercase shadow-xl"
                                > Activar Nexus </button>
                            </div>
                        </div>
                    )}

                    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
                        <button 
                            onClick={() => setIsLogOpen(true)}
                            className="glass-card h-16 px-10 rounded-full flex items-center gap-4 hover:border-[#D4AF37]/50 active:scale-95 shadow-2xl"
                        >
                            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse shadow-[0_0_10px_#D4AF37]"></span>
                            <span className="text-[11px] font-black tracking-widest uppercase text-[#D4AF37]">Ver Terminal</span>
                        </button>
                    </div>

                    {isLogOpen && (
                        <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-[110]" onClick={() => setIsLogOpen(false)}>
                            <div 
                                className="fixed bottom-0 left-0 right-0 h-[65%] glass-card rounded-t-[60px] p-12 overflow-hidden flex flex-col border-t border-white/10"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex justify-between items-center mb-10">
                                    <h3 className="serif text-3xl text-[#D4AF37]">Log de Sistemas</h3>
                                    <button onClick={() => setIsLogOpen(false)} className="w-12 h-12 glass-card rounded-full flex items-center justify-center hover:bg-white/10">✕</button>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-5 pr-4 pb-10">
                                    {log.length === 0 ? (
                                        <div className="h-full flex items-center justify-center opacity-10">
                                            <p className="serif italic text-lg tracking-[8px] uppercase">Nexus Idle</p>
                                        </div>
                                    ) : log.map((line, i) => (
                                        <div key={i} className="text-[11px] font-mono text-white/40 border-l-2 border-[#D4AF37]/20 pl-6 py-3 hover:text-white/90 hover:border-[#D4AF37] transition-all duration-300">
                                            {line}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
