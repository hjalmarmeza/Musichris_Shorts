import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Engine } from './EngineLogic.js'
import Background3D from './components/Background3D.jsx'

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
        opacity: 1, 
        y: 0,
        transition: { type: "spring", stiffness: 300, damping: 24 }
    }
};

const SongItem = ({ song, onProduce, isDisabled }) => (
    <motion.div 
        variants={itemVariants}
        whileHover={{ scale: 1.01, borderColor: "rgba(212, 175, 55, 0.4)" }}
        className="glass-card p-6 rounded-[28px] flex items-center justify-between group mb-5 relative overflow-hidden"
    >
        <div className="flex-1 pr-6 min-w-0 z-10">
            <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <p className="text-[#D4AF37] text-xs font-semibold tracking-[0.2em] uppercase">SHORT #{song.id.substring(0,6)}</p>
            </div>
            <h4 className="serif text-lg md:text-2xl text-white font-bold leading-tight group-hover:text-[#D4AF37] transition-colors duration-500 mb-1 truncate">{song.title}</h4>
            <p className="text-gray-400 text-sm truncate">{song.biblical || 'Sin cita bíblica asignada'}</p>
        </div>

        <div className="flex items-center gap-6 z-10">
            <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Rendimientos</p>
                <p className="text-white font-medium">{song.shortCount || 0}</p>
            </div>
            <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onProduce(song.id)}
                disabled={isDisabled}
                className="bg-white text-black px-8 py-3 rounded-full text-sm font-bold uppercase tracking-wider hover:bg-[#D4AF37] hover:text-white transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Publicar
            </motion.button>
        </div>
        
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/5 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none"></div>
    </motion.div>
);

export default function App() {
    const [songs, setSongs] = useState([]);
    const [status, setStatus] = useState('IDLE'); // IDLE, WORKING, SUCCESS, ERROR
    const [appError, setAppError] = useState(null);
    const [pat, setPat] = useState(Engine.getStoredPat());
    const [showSettings, setShowSettings] = useState(!pat);

    useEffect(() => {
        if (!pat) return;
        Engine.fetchCatalog().then(data => {
            setSongs(data);
        }).catch(err => setAppError(err.message));
    }, [pat]);

    const handleProduce = async (songId) => {
        try {
            setStatus('WORKING');
            setAppError(null);
            const ok = await Engine.produceShort(pat, songId);
            if (ok) {
                setStatus('SUCCESS');
                setTimeout(() => setStatus('IDLE'), 3000);
            } else {
                throw new Error("Credenciales inválidas o error de GitHub.");
            }
        } catch (error) {
            setStatus('ERROR');
            setAppError(error.message);
        }
    };

    return (
        <div className="relative min-h-screen">
            {/* Capa 3D (R3F) */}
            <Background3D />

            {/* Capa UI Frontal */}
            <div className="relative z-10 w-full max-w-xl mx-auto px-6 py-12 pb-44">
                
                <header className="mb-16">
                    <div className="flex justify-between items-start mb-12">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        >
                            <h1 className="serif text-3xl md:text-7xl text-white font-bold leading-none mb-4 group">
                                <span className="text-[#D4AF37] block mb-2">MusiChris</span>
                                <span className="italic">Shorts</span>
                            </h1>
                            <div className="flex items-center gap-4 text-xs tracking-[0.2em] uppercase text-gray-500">
                                <span className="w-12 h-[1px] bg-[#D4AF37]/50"></span>
                                <span>Golden Mastery Elite</span>
                            </div>
                        </motion.div>
                        <motion.button 
                            whileHover={{ rotate: 90 }}
                            transition={{ duration: 0.3 }}
                            onClick={() => setShowSettings(!showSettings)}
                            className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-gray-400 hover:text-white"
                        >
                            ⚙️
                        </motion.button>
                    </div>

                    <AnimatePresence>
                        {showSettings && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="glass-card p-6 rounded-2xl mb-8 overflow-hidden"
                            >
                                <p className="text-sm text-gray-300 mb-4 font-mono">AUTORIZACIÓN REQUERIDA</p>
                                <input 
                                    type="password" 
                                    value={pat}
                                    onChange={e => {
                                        setPat(e.target.value);
                                        Engine.storePat(e.target.value);
                                    }}
                                    placeholder="GitHub Personal Access Token" 
                                    className="w-full bg-black/50 border border-[#D4AF37]/30 rounded-lg p-3 text-white focus:outline-none focus:border-[#D4AF37] mb-2 font-mono text-sm"
                                />
                                <p className="text-xs text-gray-500">Token guardado localmente.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </header>

                <div className="relative">
                    {songs.length === 0 ? (
                        <div className="py-40 flex flex-col items-center gap-6">
                            <div className="w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
                            <p className="serif italic text-sm tracking-widest text-[#D4AF37]">Sincronizando Nexus...</p>
                        </div>
                    ) : (
                        <motion.div 
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            className="space-y-4"
                        >
                            {songs.map(song => (
                                <SongItem 
                                    key={song.id} 
                                    song={song} 
                                    onProduce={handleProduce}
                                    isDisabled={status === 'WORKING'}
                                />
                            ))}
                        </motion.div>
                    )}
                </div>

                <AnimatePresence>
                    {status === 'SUCCESS' && (
                        <motion.div 
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-black px-6 py-3 rounded-full font-bold shadow-lg z-50 flex items-center gap-2"
                        >
                            <span>✓</span> Motor Desplegado
                        </motion.div>
                    )}
                    {appError && (
                        <motion.div 
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-red-900/90 backdrop-blur text-white px-6 py-3 rounded-full font-bold shadow-lg z-50 border border-red-500"
                        >
                            {appError}
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
            
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
                <a href="https://github.com/hjalmarmeza/Musichris_Shorts/actions" target="_blank" rel="noreferrer" className="flex items-center gap-3 glass-card px-6 py-3 rounded-full hover:bg-white/5 transition-colors group">
                    <div className="w-2 h-2 rounded-full bg-[#D4AF37] shadow-[0_0_10px_#D4AF37] animate-pulse"></div>
                    <span className="text-xs font-bold tracking-widest uppercase text-[#D4AF37] group-hover:text-white transition-colors">Ver Terminal</span>
                </a>
            </div>
            
        </div>
    );
}
