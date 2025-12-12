import React, { useState, useRef, useEffect } from 'react';
import { Search, Image as ImageIcon, Video, Mic, StopCircle, Upload, Play, Wand2, MessageSquare } from 'lucide-react';
import { searchAssistant, editImage, generateVideo, connectLiveSession, createAudioBuffer, decodeAudio, pcmToBlob } from '../services/geminiService';

export const AIAssistant: React.FC = () => {
    const [mode, setMode] = useState<'SEARCH' | 'IMAGE' | 'VIDEO' | 'LIVE'>('SEARCH');
    
    return (
        <div className="bg-white dark:bg-space-900 rounded-[2rem] shadow-sm border border-stone-200 dark:border-space-800 overflow-hidden min-h-[500px] flex flex-col">
            <div className="bg-paper dark:bg-space-950 border-b border-stone-100 dark:border-space-800 p-4 flex gap-3 overflow-x-auto">
                <button onClick={() => setMode('SEARCH')} className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition ${mode === 'SEARCH' ? 'bg-nature-100 dark:bg-space-800 text-nature-800 dark:text-white' : 'bg-white dark:bg-space-900 border border-stone-200 dark:border-space-700 text-stone-500 dark:text-slate-400 hover:bg-stone-50 dark:hover:bg-space-800'}`}>
                    <Search className="w-4 h-4" /> Research
                </button>
                <button onClick={() => setMode('IMAGE')} className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition ${mode === 'IMAGE' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300' : 'bg-white dark:bg-space-900 border border-stone-200 dark:border-space-700 text-stone-500 dark:text-slate-400 hover:bg-stone-50 dark:hover:bg-space-800'}`}>
                    <ImageIcon className="w-4 h-4" /> Image Editor
                </button>
                <button onClick={() => setMode('VIDEO')} className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition ${mode === 'VIDEO' ? 'bg-stone-200 dark:bg-slate-700 text-stone-800 dark:text-white' : 'bg-white dark:bg-space-900 border border-stone-200 dark:border-space-700 text-stone-500 dark:text-slate-400 hover:bg-stone-50 dark:hover:bg-space-800'}`}>
                    <Video className="w-4 h-4" /> Veo Animator
                </button>
                <button onClick={() => setMode('LIVE')} className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition ${mode === 'LIVE' ? 'bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300' : 'bg-white dark:bg-space-900 border border-stone-200 dark:border-space-700 text-stone-500 dark:text-slate-400 hover:bg-stone-50 dark:hover:bg-space-800'}`}>
                    <Mic className="w-4 h-4" /> Live Tutor
                </button>
            </div>

            <div className="p-8 flex-1">
                {mode === 'SEARCH' && <SearchMode />}
                {mode === 'IMAGE' && <ImageMode />}
                {mode === 'VIDEO' && <VideoMode />}
                {mode === 'LIVE' && <LiveMode />}
            </div>
        </div>
    );
};

const SearchMode = () => {
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<{text: string, grounding?: any} | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (!query) return;
        setLoading(true);
        try {
            const res = await searchAssistant(query);
            setResult(res as any);
        } catch (e) {
            console.error(e);
            alert("Search failed. Check console.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex gap-3">
                <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Ask a question about your subject..."
                    className="flex-1 p-4 bg-paper dark:bg-space-950 border border-stone-200 dark:border-space-800 rounded-xl focus:ring-2 focus:ring-nature-500/20 dark:focus:ring-space-accent/20 focus:border-nature-500 dark:focus:border-space-accent outline-none transition shadow-sm dark:text-white"
                />
                <button onClick={handleSearch} disabled={loading} className="bg-nature-700 dark:bg-indigo-600 text-white px-8 rounded-xl font-bold hover:bg-nature-800 dark:hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-nature-700/20 dark:shadow-indigo-500/30">
                    {loading ? 'Thinking...' : 'Ask AI'}
                </button>
            </div>
            {result && (
                <div className="prose prose-stone dark:prose-invert max-w-none bg-paper dark:bg-space-950 p-8 rounded-2xl border border-stone-100 dark:border-space-800">
                    <div dangerouslySetInnerHTML={{ __html: result.text.replace(/\n/g, '<br/>') }} className="font-serif text-stone-700 dark:text-slate-300 leading-relaxed" />
                    {result.grounding && (
                         <div className="mt-6 pt-6 border-t border-stone-200 dark:border-space-800 text-xs text-stone-500 dark:text-slate-500">
                            <strong className="uppercase tracking-wider">Sources</strong>
                            <ul className="list-disc pl-4 mt-2 space-y-1">
                                {result.grounding.map((chunk: any, i: number) => (
                                    chunk.web?.uri ? (
                                        <li key={i}><a href={chunk.web.uri} target="_blank" rel="noreferrer" className="text-nature-600 dark:text-space-accent hover:underline decoration-nature-300">{chunk.web.title || chunk.web.uri}</a></li>
                                    ) : null
                                ))}
                            </ul>
                         </div>
                    )}
                </div>
            )}
        </div>
    );
};

const ImageMode = () => {
    const [image, setImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEdit = async () => {
        if (!image || !prompt) return;
        setLoading(true);
        try {
            const base64Data = image.split(',')[1];
            const mimeType = image.split(';')[0].split(':')[1];
            const newImage = await editImage(base64Data, prompt, mimeType);
            if (newImage) setImage(newImage);
        } catch (e) {
            alert("Edit failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-8 h-full">
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-stone-300 dark:border-space-700 rounded-2xl bg-stone-50 dark:bg-space-950 min-h-[300px] relative overflow-hidden group hover:border-nature-400 dark:hover:border-space-accent transition-colors">
                {image ? (
                    <img src={image} alt="Preview" className="max-w-full max-h-full object-contain" />
                ) : (
                    <div className="text-center text-stone-400 dark:text-slate-600">
                        <ImageIcon className="w-12 h-12 mx-auto mb-3" />
                        <p className="font-bold">Upload an image to edit</p>
                    </div>
                )}
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange} 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    accept="image/*"
                />
            </div>
            <div className="w-full md:w-80 flex flex-col gap-4">
                <h3 className="font-bold font-serif text-stone-800 dark:text-white text-lg">AI Editor</h3>
                <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="E.g. 'Make it look like a sketch', 'Remove the background'"
                    className="w-full p-4 border border-stone-200 dark:border-space-700 rounded-xl h-32 resize-none focus:ring-2 focus:ring-amber-500/20 dark:focus:ring-space-accent/20 focus:border-amber-500 dark:focus:border-space-accent outline-none bg-paper dark:bg-space-950 dark:text-white"
                />
                <button 
                    onClick={handleEdit} 
                    disabled={loading || !image}
                    className="bg-amber-600 dark:bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-amber-700 dark:hover:bg-indigo-700 disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg shadow-amber-600/20 dark:shadow-indigo-500/20"
                >
                    {loading ? <Wand2 className="animate-spin" /> : <Wand2 />} 
                    {loading ? 'Editing...' : 'Generate Edit'}
                </button>
                <p className="text-xs text-stone-400 dark:text-slate-500 text-center">
                    Powered by Gemini 2.5 Flash Image.
                </p>
            </div>
        </div>
    );
};

const VideoMode = () => {
    const [image, setImage] = useState<string | null>(null);
    const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    
    const handleGenerate = async () => {
        if (!window.aistudio) {
            alert("AI Studio global not found. This might be a simulated environment.");
            return;
        }

        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await window.aistudio.openSelectKey();
        }
        
        if (!image) return;
        setLoading(true);
        try {
            const base64 = image.split(',')[1];
            const vidUrl = await generateVideo("Animate this image cinematically", base64, process.env.API_KEY || '');
            setGeneratedVideo(vidUrl);
        } catch (e) {
            console.error(e);
            alert("Video generation failed. (Check API Key/Quota)");
        } finally {
            setLoading(false);
        }
    };

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
         const file = e.target.files?.[0];
         if (file) {
             const r = new FileReader();
             r.onload = () => setImage(r.result as string);
             r.readAsDataURL(file);
         }
    };

    return (
        <div className="space-y-8">
            <div className="bg-amber-50 dark:bg-indigo-900/30 p-4 rounded-xl border border-amber-100 dark:border-indigo-800 text-sm text-amber-800 dark:text-indigo-200 flex items-center justify-between">
                <span><strong>Note:</strong> Veo generation requires a paid API Key.</span>
                <button onClick={() => window.aistudio?.openSelectKey()} className="px-3 py-1 bg-amber-100 dark:bg-indigo-800/50 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-amber-200 dark:hover:bg-indigo-700 transition">Select Key</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="border-2 border-dashed border-stone-200 dark:border-space-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center relative hover:border-nature-400 dark:hover:border-space-accent transition-colors min-h-[250px] bg-stone-50 dark:bg-space-950">
                    {image ? (
                        <img src={image} className="max-h-64 object-cover rounded-lg shadow-sm" />
                    ) : (
                        <div className="text-stone-400 dark:text-slate-600">
                            <Upload className="mx-auto h-10 w-10 mb-3" />
                            <p className="font-bold">Upload source image</p>
                        </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleFile} className="absolute inset-0 opacity-0 cursor-pointer" />
                 </div>

                 <div className="flex flex-col items-center justify-center bg-stone-900 rounded-2xl overflow-hidden aspect-video relative shadow-lg">
                     {generatedVideo ? (
                         <video src={generatedVideo} controls className="w-full h-full" />
                     ) : (
                         <div className="text-stone-600 flex flex-col items-center">
                             {loading ? <div className="animate-spin h-10 w-10 border-4 border-stone-700 border-t-white rounded-full mb-3"></div> : <Play className="h-14 w-14 opacity-20" />}
                             <p className="text-stone-500 font-medium">{loading ? 'Generating...' : 'Video Output'}</p>
                         </div>
                     )}
                 </div>
            </div>

            <button 
                onClick={handleGenerate}
                disabled={!image || loading}
                className="w-full bg-stone-800 dark:bg-indigo-600 hover:bg-stone-900 dark:hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition disabled:opacity-50 shadow-lg shadow-stone-900/10 dark:shadow-indigo-600/20"
            >
                {loading ? 'Generating with Veo...' : 'Generate Video'}
            </button>
        </div>
    );
};

const LiveMode = () => {
    const [connected, setConnected] = useState(false);
    const [conversation, setConversation] = useState<{role: 'user' | 'model', text: string}[]>([]);
    const [status, setStatus] = useState<string>('Ready');
    
    const sessionRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [conversation]);

    const startLive = async () => {
        try {
            setStatus('Connecting...');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            const session = await connectLiveSession(
                (base64Audio) => {
                    const bytes = decodeAudio(base64Audio);
                    const buffer = createAudioBuffer(bytes, outputCtx);
                    const source = outputCtx.createBufferSource();
                    source.buffer = buffer;
                    source.connect(outputCtx.destination);
                    source.start();
                },
                () => {
                    setConnected(false);
                    setStatus('Disconnected');
                },
                () => {
                    setConnected(false);
                    setStatus('Error');
                    alert("Connection failed");
                },
                (text, type, endOfTurn) => {
                    if (!text && endOfTurn) return; // Handle turn completion strictly if needed, mainly useful for visual cues
                    
                    setConversation(prev => {
                        const last = prev[prev.length - 1];
                        
                        // If same role, append text
                        if (last && last.role === type) {
                            // Avoid appending if text is basically empty or just a specialized signal, 
                            // but usually transcription is partial string chunks
                            if (!text) return prev;
                            
                            const newConv = [...prev];
                            newConv[newConv.length - 1] = { ...last, text: last.text + text };
                            return newConv;
                        }
                        
                        // New turn
                        if (text) {
                            return [...prev, { role: type, text }];
                        }
                        
                        return prev;
                    });
                }
            );
            
            sessionRef.current = session;
            setConnected(true);
            setStatus('Live');

            const source = audioContextRef.current.createMediaStreamSource(stream);
            sourceNodeRef.current = source;
            const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const blobStruct = pcmToBlob(inputData);
                session.sendRealtimeInput({ media: blobStruct });
            };

            source.connect(processor);
            processor.connect(audioContextRef.current.destination);

        } catch (e) {
            console.error(e);
            setStatus('Failed');
            alert("Failed to start live session");
        }
    };

    const stopLive = () => {
        if (sourceNodeRef.current) sourceNodeRef.current.disconnect();
        if (processorRef.current) processorRef.current.disconnect();
        if (audioContextRef.current) audioContextRef.current.close();
        setConnected(false);
        setStatus('Ended');
    };

    return (
        <div className="flex flex-col h-[500px] relative">
            {/* Header / Status */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-white dark:from-space-900 to-transparent z-10 flex justify-center">
                <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${connected ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-stone-100 text-stone-500 dark:bg-space-800 dark:text-slate-400'}`}>
                    {connected && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                    {status}
                </span>
            </div>

            {/* Conversation Area */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 pt-16 space-y-6 scroll-smooth">
                {conversation.length === 0 && !connected && (
                    <div className="flex flex-col items-center justify-center h-full text-stone-400 dark:text-slate-600 opacity-50">
                        <MessageSquare className="w-16 h-16 mb-4" />
                        <p className="font-serif italic text-lg">Start a conversation to see transcription.</p>
                    </div>
                )}
                
                {conversation.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                        <div className={`
                            max-w-[80%] p-5 rounded-2xl text-sm leading-relaxed shadow-sm
                            ${msg.role === 'user' 
                                ? 'bg-nature-600 text-white rounded-br-none' 
                                : 'bg-stone-100 dark:bg-space-800 text-stone-800 dark:text-slate-200 rounded-bl-none'}
                        `}>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}
                
                {/* Typing Indicator / Active State */}
                {connected && conversation.length > 0 && conversation[conversation.length-1].role === 'user' && (
                     <div className="flex justify-start animate-pulse">
                        <div className="bg-stone-50 dark:bg-space-950 p-4 rounded-2xl rounded-bl-none text-stone-400 text-xs italic">
                            AI is listening...
                        </div>
                     </div>
                )}
            </div>

            {/* Controls */}
            <div className="p-6 border-t border-stone-100 dark:border-space-800 bg-white dark:bg-space-900 flex justify-center items-center relative z-20">
                <button
                    onClick={connected ? stopLive : startLive}
                    className={`
                        w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 transform shadow-2xl
                        ${connected 
                            ? 'bg-red-500 hover:bg-red-600 text-white scale-100 hover:scale-105 shadow-red-500/30' 
                            : 'bg-nature-600 hover:bg-nature-700 text-white scale-100 hover:scale-110 shadow-nature-600/30 dark:bg-indigo-600 dark:hover:bg-indigo-500 dark:shadow-indigo-600/30'}
                    `}
                >
                    {connected ? <StopCircle className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                </button>
            </div>
        </div>
    );
};