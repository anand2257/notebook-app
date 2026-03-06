"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BrainCircuit,
    Menu,
    PanelLeftClose,
    PanelRightClose,
    Plus,
    FileText,
    FileBox,
    Send,
    Sparkles,
    Bot,
    User,
    ListVideo,
    Mic,
    TableProperties,
    MessageCircleQuestion,
    Wand2,
    X,
    Share2,
    Network,
    Loader2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ModeToggle } from "@/components/mode-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

// --- TYPES ---
type Source = { id: string; title: string; type: string; selected: boolean };
type Message = { id: string; role: "user" | "ai"; content: string; citations: number[] | any[] };

const INITIAL_SOURCES: Source[] = [];
const INITIAL_MESSAGES: Message[] = [
    { id: "1", role: "ai", content: "Hi! I'm your AI assistant. I've analyzed your sources. Ask me anything about them, or try generating an Audio Overview.", citations: [] as number[] },
];

// --- UTILS & COMPONENTS ---

const formatInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-semibold text-zinc-900 dark:text-zinc-100">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
            return <em key={i}>{part.slice(1, -1)}</em>;
        }
        return part;
    });
};

const MarkdownRenderer = ({ text }: { text: string }) => {
    const lines = text.split('\n');
    return (
        <div className="space-y-1.5 text-[15px] leading-relaxed">
            {lines.map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={i} className="h-1" />;

                // Headers
                if (trimmed.startsWith('### ')) return <h3 key={i} className="text-md font-bold text-zinc-800 dark:text-zinc-200 mt-4 mb-2">{formatInline(trimmed.slice(4))}</h3>;
                if (trimmed.startsWith('## ')) return <h2 key={i} className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-5 mb-2">{formatInline(trimmed.slice(3))}</h2>;
                if (trimmed.startsWith('# ')) return <h1 key={i} className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-5 mb-3">{formatInline(trimmed.slice(2))}</h1>;

                // Lists
                const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ');
                const isNumbered = /^\d+\.\s/.test(trimmed);
                if (isBullet || isNumbered) {
                    const sliceIdx = isBullet ? 2 : trimmed.indexOf(' ') + 1;
                    return (
                        <div key={i} className="ml-2 flex gap-3 mt-1.5">
                            <span className="text-zinc-500 select-none mt-0.5">{isBullet ? '•' : trimmed.substring(0, sliceIdx)}</span>
                            <div className="flex-1">{formatInline(trimmed.slice(sliceIdx))}</div>
                        </div>
                    );
                }

                // Normal paragraph
                return <p key={i} className="mt-2">{formatInline(line)}</p>;
            })}
        </div>
    );
};

const TypewriterText = ({ text, onComplete }: { text: string; onComplete?: () => void }) => {
    const [displayedText, setDisplayedText] = useState("");
    const [index, setIndex] = useState(0);

    useEffect(() => {
        // Reset if text changes
        setDisplayedText("");
        setIndex(0);
    }, [text]);

    useEffect(() => {
        if (index < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText((prev) => prev + text.charAt(index));
                setIndex((prev) => prev + 1);
            }, 5);
            return () => clearTimeout(timeout);
        } else if (onComplete) {
            onComplete();
        }
    }, [index, text, onComplete]);

    return <MarkdownRenderer text={displayedText} />;
};

interface LeftSidebarProps {
    sources: Source[];
    isLoading: boolean;
    toggleSource: (id: string) => void;
    handleUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const LeftSidebar = ({ sources, isLoading, toggleSource, handleUpload }: LeftSidebarProps) => (
    <div className="h-full flex flex-col pt-4 ps-4 pe-4">
        <div className="flex items-center gap-2 mb-6">
            <BrainCircuit className="w-6 h-6 text-zinc-900 dark:text-zinc-50" />
            <span className="font-semibold tracking-tight text-lg">DocuMind</span>
        </div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Sources</h2>
            <Badge variant="secondary" className="rounded-full">{sources.filter(s => s.selected).length}/{sources.length}</Badge>
        </div>

        <div className="flex-1 -mx-2 px-2 overflow-y-auto custom-scrollbar">
            <div className="space-y-2 pb-4">
                {sources.map(source => (
                    <div key={source.id} className="flex items-center space-x-3 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-lg group transition-colors">
                        <Checkbox
                            id={source.id}
                            checked={source.selected}
                            onCheckedChange={() => toggleSource(source.id)}
                            className="rounded-sm border-zinc-300 dark:border-zinc-700"
                        />
                        <label
                            htmlFor={source.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1 truncate"
                        >
                            {source.title}
                        </label>
                    </div>
                ))}
                {sources.length === 0 && (
                    <div className="text-center py-8 text-zinc-400 text-sm italic">
                        No sources added yet.
                    </div>
                )}
            </div>
        </div>

        <div className="mt-4 mb-4">
            <Input type="file" id="file-upload" className="hidden" onChange={handleUpload} accept=".pdf,.txt,.docx" />
            <label htmlFor="file-upload">
                <Button asChild className="w-full rounded-full shadow-sm" variant="outline" disabled={isLoading}>
                    <span className="cursor-pointer">
                        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                        {isLoading ? "Uploading..." : "Add Source"}
                    </span>
                </Button>
            </label>
        </div>
    </div>
);

interface RightSidebarProps {
    summary: string;
    suggestedQuestions: string[];
    setInput: (val: string) => void;
    onToolClick: (tool: string) => void;
    isSummarizing: boolean;
}

const RightSidebar = ({ summary, suggestedQuestions, setInput, onToolClick, isSummarizing }: RightSidebarProps) => (
    <div className="h-full flex flex-col p-4 bg-zinc-50/50 dark:bg-zinc-950/50">
        <div className="mb-6 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Document Guide</h2>
        </div>

        <div className="flex-1 -mx-2 px-2 overflow-y-auto custom-scrollbar">
            <div className="space-y-6">
                <div className="space-y-2">
                    <h3 className="text-xs font-medium text-zinc-500">Summary</h3>
                    <div className="text-sm p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm leading-relaxed min-h-[100px] flex items-start w-full overflow-hidden">
                        {isSummarizing ? (
                            <div className="flex items-center gap-2 text-zinc-400 italic">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Analyzing sources...
                            </div>
                        ) : (
                            <div className="w-full">
                                <TypewriterText text={summary} />
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-xs font-medium text-zinc-500">Suggested Questions</h3>
                    <div className="space-y-2">
                        {isSummarizing ? (
                            [1, 2].map(i => <div key={i} className="h-10 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-xl w-full" />)
                        ) : (
                            suggestedQuestions.map((q, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setInput(q)}
                                    className="w-full text-left text-sm p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors cursor-pointer text-zinc-700 dark:text-zinc-300 shadow-sm"
                                >
                                    {q}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-xs font-medium text-zinc-500 flex items-center gap-1">
                        <Wand2 className="w-3 h-3" /> Studio Tools
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                        <Card onClick={() => onToolClick("summary")} className="p-3 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border-zinc-200 dark:border-zinc-800 text-center shadow-sm group">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                <FileText className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-medium">Summary</span>
                        </Card>
                        <Card onClick={() => onToolClick("faq")} className="p-3 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border-zinc-200 dark:border-zinc-800 text-center shadow-sm group">
                            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                                <MessageCircleQuestion className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-medium">Auto FAQ</span>
                        </Card>
                        <Card onClick={() => onToolClick("mindmap")} className="p-3 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border-zinc-200 dark:border-zinc-800 text-center shadow-sm group">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                <Network className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-medium text-center leading-tight">Mind Map</span>
                        </Card>
                        <Card onClick={() => onToolClick("audio")} className="p-3 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border-zinc-200 dark:border-zinc-800 text-center shadow-sm group">
                            <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                                <Mic className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-medium">Audio Overview</span>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const FAQModal = ({ isOpen, onClose, data, isLoading }: { isOpen: boolean; onClose: () => void, data: any[], isLoading: boolean }) => {
    if (!isOpen) return null;
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-zinc-950 w-full max-w-2xl max-h-[80vh] rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col">
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageCircleQuestion className="w-5 h-5 text-purple-500" />
                        <h2 className="font-semibold">Auto FAQ</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-40 text-zinc-500">
                            <Loader2 className="w-8 h-8 animate-spin mb-4" />
                            <p>Generating frequently asked questions...</p>
                        </div>
                    ) : (
                        data.map((faq, idx) => (
                            <div key={idx} className="space-y-2">
                                <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Q: {faq.q}</h3>
                                <div className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                    {faq.a}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

const PodcastModal = ({ isOpen, onClose, script, isLoading }: { isOpen: boolean; onClose: () => void, script: string, isLoading: boolean }) => {
    if (!isOpen) return null;
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-zinc-950 w-full max-w-3xl max-h-[80vh] rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col">
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Mic className="w-5 h-5 text-orange-500" />
                        <h2 className="font-semibold">Audio Overview (Podcast Script)</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-40 text-zinc-500">
                            <Loader2 className="w-8 h-8 animate-spin mb-4" />
                            <p>Generating podcast script from your sources...</p>
                        </div>
                    ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <MarkdownRenderer text={script} />
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

const MindMapModal = ({ isOpen, onClose, data, isLoading }: { isOpen: boolean; onClose: () => void; data: { nodes: any[], edges: any[] }; isLoading: boolean }) => {
    if (!isOpen) return null;

    // Simple fixed circular mapping for nodes around a center one
    const renderGraph = () => {
        if (!data.nodes || data.nodes.length === 0) return <div className="text-zinc-500">No concepts found to map.</div>;

        const centerX = 400;
        const centerY = 300;
        const radius = 220;
        const mainNode = data.nodes[0];
        const otherNodes = data.nodes.slice(1);

        return (
            <div className="relative w-[800px] h-[600px] max-w-full mx-auto">
                <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-zinc-300 dark:stroke-zinc-700">
                    {data.edges.map((edge, idx) => {
                        const sourceIdx = data.nodes.findIndex(n => n.id === edge.source);
                        const targetIdx = data.nodes.findIndex(n => n.id === edge.target);
                        if (sourceIdx === -1 || targetIdx === -1) return null;

                        const getPos = (index: number) => {
                            if (index === 0) return { x: centerX, y: centerY };
                            const angle = ((index - 1) / otherNodes.length) * 2 * Math.PI;
                            return {
                                x: centerX + radius * Math.cos(angle),
                                y: centerY + radius * Math.sin(angle)
                            };
                        };
                        const p1 = getPos(sourceIdx);
                        const p2 = getPos(targetIdx);

                        return (
                            <motion.g key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} strokeWidth="2" />
                                <text x={(p1.x + p2.x) / 2} y={(p1.y + p2.y) / 2} fill="currentColor" fontSize="12" textAnchor="middle" className="fill-zinc-400 bg-white" dy="-5">{edge.label}</text>
                            </motion.g>
                        );
                    })}
                </svg>

                {data.nodes.map((node, i) => {
                    let style = {};
                    if (i === 0) {
                        style = { left: centerX, top: centerY, transform: 'translate(-50%, -50%)', zIndex: 10 };
                    } else {
                        const angle = ((i - 1) / otherNodes.length) * 2 * Math.PI;
                        const x = centerX + radius * Math.cos(angle);
                        const y = centerY + radius * Math.sin(angle);
                        style = { left: x, top: y, transform: 'translate(-50%, -50%)' };
                    }

                    return (
                        <motion.div
                            key={node.id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className={`absolute px-4 py-2 rounded-xl shadow-md border ${i === 0 ? 'bg-blue-500 text-white font-bold border-blue-600' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-sm'}`}
                            style={style}
                        >
                            {node.label}
                        </motion.div>
                    );
                })}
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white dark:bg-zinc-950 w-full max-w-5xl h-[80vh] rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col"
            >
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Network className="w-5 h-5 text-emerald-500" />
                        <h2 className="font-semibold">Knowledge Mind Map</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
                </div>
                <div className="flex-1 relative bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-8 overflow-auto custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center text-zinc-500">
                            <Loader2 className="w-8 h-8 animate-spin mb-4" />
                            <p>Extracting relationships and generating map...</p>
                        </div>
                    ) : renderGraph()}
                </div>
            </motion.div>
        </motion.div>
    );
};

// --- MAIN PAGE ---

export default function DashboardPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";
    const [sources, setSources] = useState<Source[]>(INITIAL_SOURCES);
    const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false); // For upload/query
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [summary, setSummary] = useState("Upload a document and wait for the AI to guide you.");
    const [suggestedQuestions, setSuggestedQuestions] = useState([
        "What is the main takeaway?",
        "Summarize the content."
    ]);

    // Tools UI State
    const [isMindMapOpen, setIsMindMapOpen] = useState(false);
    const [mindMapData, setMindMapData] = useState({ nodes: [], edges: [] });
    const [isMindMapLoading, setIsMindMapLoading] = useState(false);

    const [isFaqOpen, setIsFaqOpen] = useState(false);
    const [faqData, setFaqData] = useState([]);
    const [isFaqLoading, setIsFaqLoading] = useState(false);

    const [isPodcastOpen, setIsPodcastOpen] = useState(false);
    const [podcastScript, setPodcastScript] = useState("");
    const [isPodcastLoading, setIsPodcastLoading] = useState(false);

    const [leftOpen, setLeftOpen] = useState(false);
    const [rightOpen, setRightOpen] = useState(false);

    const toggleSource = (id: string) => {
        setSources(sources.map(s => s.id === id ? { ...s, selected: !s.selected } : s));
    };

    const fetchSummary = async (currentSources = sources) => {
        setIsSummarizing(true);
        try {
            const selectedSourceIds = currentSources.filter(s => s.selected).map(s => s.id);
            const res = await fetch(`${apiUrl}/summarize`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ source_ids: selectedSourceIds })
            });
            const data = await res.json();
            if (data.summary) setSummary(data.summary);
            if (data.suggested_questions && data.suggested_questions.length > 0) {
                setSuggestedQuestions(data.suggested_questions);
            }
        } catch (error) {
            console.error(error);
        }
        setIsSummarizing(false);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append("file", file);

        setIsLoading(true);
        // Clear old summary info immediately on new upload to avoid "outdated" info
        setSummary("");
        setSuggestedQuestions([]);

        try {
            const res = await fetch(`${apiUrl}/upload`, {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (data.source_id) {
                const newSource = { id: data.source_id, title: file.name, type: "pdf", selected: true };
                setSources(prev => [...prev, newSource]);
                await fetchSummary([...sources, newSource]);
            }
        } catch (error) {
            console.error(error);
        }
        setIsLoading(false);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        const currentInput = input;
        const userMessage: Message = { id: Date.now().toString(), role: "user", content: currentInput, citations: [] };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);
        try {
            const selectedSourceIds = sources.filter(s => s.selected).map(s => s.id);
            const res = await fetch(`${apiUrl}/query`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: currentInput, source_ids: selectedSourceIds })
            });
            const data = await res.json();
            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "ai",
                content: data.answer || "Sorry, I couldn't process that.",
                citations: data.citations ? data.citations.map((c: any) => c.citation_num) : []
            };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { id: Date.now().toString(), role: "ai", content: "Error communicating with server.", citations: [] }]);
        }
        setIsLoading(false);
    };

    const runTool = async (endpoint: string, stateSetter: any, loadingSetter: any) => {
        const selectedSourceIds = sources.filter(s => s.selected).map(s => s.id);
        loadingSetter(true);
        try {
            const res = await fetch(`${apiUrl}/${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ source_ids: selectedSourceIds })
            });
            const data = await res.json();
            if (endpoint === 'faq') stateSetter(data.faqs || []);
            else if (endpoint === 'mindmap') stateSetter({ nodes: data.nodes || [], edges: data.edges || [] });
            else if (endpoint === 'podcast') stateSetter(data.script || "");
        } catch (error) {
            console.error(error);
        }
        loadingSetter(false);
    }

    const onToolClick = (tool: string) => {
        if (tool.toLowerCase() === "summary") {
            fetchSummary();
        } else if (tool === "faq") {
            setIsFaqOpen(true);
            if (faqData.length === 0) runTool('faq', setFaqData, setIsFaqLoading);
        } else if (tool === "mindmap") {
            setIsMindMapOpen(true);
            if (mindMapData.nodes.length === 0) runTool('mindmap', setMindMapData, setIsMindMapLoading);
        } else if (tool === "audio") {
            setIsPodcastOpen(true);
            if (!podcastScript) runTool('podcast', setPodcastScript, setIsPodcastLoading);
        }
    };

    return (
        <div className="flex bg-zinc-50 dark:bg-zinc-950 h-screen w-full overflow-hidden font-sans">
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e4e4e7;
                    border-radius: 10px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #27272a;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #d4d4d8;
                }
            `}</style>

            {/* Desktop Left Sidebar */}
            <div className="hidden lg:block w-[280px] xl:w-[320px] flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                <LeftSidebar sources={sources} isLoading={isLoading} toggleSource={toggleSource} handleUpload={handleUpload} />
            </div>

            {/* Main Center Area */}
            <div className="flex-1 min-w-0 h-full flex flex-col items-center overflow-auto custom-scrollbar">
                <div className="w-full h-full max-w-[1600px] flex-1 flex flex-col bg-white dark:bg-zinc-900 lg:m-4 lg:rounded-2xl shadow-sm border border-zinc-200/50 dark:border-zinc-800/50 overflow-hidden relative">
                    {/* Top Header */}
                    <header className="h-14 border-b border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between px-4 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md z-10">
                        <div className="flex items-center lg:hidden">
                            <Sheet open={leftOpen} onOpenChange={setLeftOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="mr-2 h-8 w-8">
                                        <Menu className="h-4 w-4" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-[300px] p-0 border-r-0 bg-zinc-50 dark:bg-zinc-950">
                                    <LeftSidebar sources={sources} isLoading={isLoading} toggleSource={toggleSource} handleUpload={handleUpload} />
                                </SheetContent>
                            </Sheet>
                            <span className="font-semibold">Chat</span>
                        </div>
                        <div className="hidden lg:flex items-center text-sm font-medium text-zinc-500">
                            <Sparkles className="w-4 h-4 mr-2" />
                            DocuMind Studio
                        </div>
                        <div className="flex items-center gap-2">
                            <ModeToggle />
                            <Sheet open={rightOpen} onOpenChange={setRightOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8">
                                        <PanelRightClose className="h-4 w-4" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-[320px] p-0 border-l-0 bg-zinc-50 dark:bg-zinc-950">
                                    <RightSidebar summary={summary} suggestedQuestions={suggestedQuestions} setInput={setInput} onToolClick={onToolClick} isSummarizing={isSummarizing} />
                                </SheetContent>
                            </Sheet>
                        </div>
                    </header>

                    {/* Messages Area */}
                    <div className="flex-1 p-4 md:p-6 pb-24 overflow-y-auto custom-scrollbar">
                        <div className="max-w-3xl mx-auto space-y-6">
                            <AnimatePresence initial={false}>
                                {messages.map((m) => (
                                    <motion.div
                                        key={m.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex gap-4 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                                    >
                                        <Avatar className="w-8 h-8 border border-zinc-200 dark:border-zinc-800">
                                            {m.role === "user" ? (
                                                <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-sm"><User className="w-4 h-4" /></AvatarFallback>
                                            ) : (
                                                <AvatarFallback className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-sm">
                                                    <Bot className="w-4 h-4" />
                                                </AvatarFallback>
                                            )}
                                        </Avatar>

                                        <div className={`flex flex-col gap-1 max-w-[80%] ${m.role === "user" ? "items-end" : "items-start"}`}>
                                            <div
                                                className={`px-5 py-4 rounded-2xl shadow-sm ${m.role === "user"
                                                    ? "bg-zinc-900 text-zinc-50 dark:bg-white dark:text-zinc-900 rounded-tr-sm"
                                                    : "bg-zinc-100/50 dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 rounded-tl-sm border border-zinc-200/50 dark:border-zinc-700/50 w-full overflow-hidden"
                                                    }`}
                                            >
                                                {m.role === "ai" ? <TypewriterText text={m.content} /> : m.content}
                                            </div>
                                            {m.citations && m.citations.length > 0 && (
                                                <div className="flex gap-1 mt-1">
                                                    {m.citations.map((c, i) => (
                                                        <Badge key={i} variant="outline" className="text-[10px] h-5 px-1.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                                            {c}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Input Area Sticky */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-3xl">
                        <form onSubmit={handleSend} className="relative flex items-center shadow-lg rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden focus-within:ring-2 focus-within:ring-zinc-400 focus-within:ring-offset-2 dark:focus-within:ring-zinc-400 transition-all">
                            <Input
                                value={input}
                                autoFocus
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask anything about your sources..."
                                className="w-full border-0 bg-transparent h-14 pl-6 pr-14 focus-visible:ring-0 shadow-none text-base"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={!input.trim() || isLoading}
                                className="absolute right-2 h-10 w-10 rounded-full transition-all disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Desktop Right Sidebar */}
            <div className="hidden lg:block w-[280px] xl:w-[320px] flex-shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                <RightSidebar summary={summary} suggestedQuestions={suggestedQuestions} setInput={setInput} onToolClick={onToolClick} isSummarizing={isSummarizing} />
            </div>

            <AnimatePresence>
                <MindMapModal key="mindmap" isOpen={isMindMapOpen} onClose={() => setIsMindMapOpen(false)} data={mindMapData} isLoading={isMindMapLoading} />
                <FAQModal key="faq" isOpen={isFaqOpen} onClose={() => setIsFaqOpen(false)} data={faqData} isLoading={isFaqLoading} />
                <PodcastModal key="podcast" isOpen={isPodcastOpen} onClose={() => setIsPodcastOpen(false)} script={podcastScript} isLoading={isPodcastLoading} />
            </AnimatePresence>
        </div>
    );
}
