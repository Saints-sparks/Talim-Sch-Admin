"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Search,
    Phone,
    Video,
    MoreHorizontal,
    FileText,
    Image,
    PlayCircle,
    Mic,
    Users,
    ChevronLeft,
    ChevronDown,
    X,
    MessageSquare,
} from "lucide-react";

type Thread = {
    id: string;
    name: string;
    lastMessage: string;
    unread: number;
    avatarColor?: string;
    typing?: boolean;
    time?: string;
};

type Message = {
    id: string;
    from: "me" | "them";
    text?: string;
    time: string;
    type?: "text" | "voice";
};

// Mock thread list used for local UI preview. Each thread contains a
// display name, last message preview, unread count and an avatar color
// class (Tailwind-compatible). Replace with real data from the backend
// when available.
const mockThreads: Thread[] = [
    { id: "t1", name: "Mrs. Yetunde Adebayo", lastMessage: "typing...", unread: 1, avatarColor: "bg-[#F59E0B]", typing: true, time: "4:00pm" },
    { id: "t2", name: "JSS 1", lastMessage: "Good evening everyone.", unread: 0, avatarColor: "bg-[#06B6D4]", time: "6:00pm" },
    { id: "t3", name: "Mrs. Chisom Okechukwu", lastMessage: "Brilliant 😄", unread: 0, avatarColor: "bg-[#10B981]", time: "6:00pm" },
    { id: "t4", name: "Fatima Abubakar", lastMessage: "typing...", unread: 2, avatarColor: "bg-[#A78BFA]", typing: true, time: "4:00pm" },
];

// Mock message history keyed by thread id. The `type` field lets us
// render different UI for text vs voice messages (the voice UI shows
// a play control and waveform placeholder).
const mockMessages: Record<string, Message[]> = {
    t1: [
        { id: "m1", from: "them", text: "Hi everyone! Don't forget, the creative writing assignment is due tomorrow.", time: "3:10pm", type: "text" },
        { id: "m2", from: "me", text: "Thanks, noted.", time: "3:15pm", type: "text" },
        { id: "m3", from: "them", time: "3:12pm", type: "voice" },
    ],
    t2: [
        { id: "m1", from: "them", text: "Good evening everyone.", time: "6:00pm", type: "text" },
    ],
    t3: [
        { id: "m1", from: "them", text: "Brilliant 😄", time: "6:00pm", type: "text" },
    ],
    t4: [],
};

export default function TeacherMessagesPage() {

    const router = useRouter();
    const [threads, setThreads] = useState<Thread[]>(mockThreads);
    const [activeThreadId, setActiveThreadId] = useState<string>(mockThreads[0].id);
    const [messages, setMessages] = useState<Message[]>(mockMessages[mockThreads[0].id] || []);
    const [search, setSearch] = useState("");
    const [compose, setCompose] = useState("");
    const [showProfile, setShowProfile] = useState(false);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [mobileViewOpen, setMobileViewOpen] = useState(false);
    const messagesRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const user = localStorage.getItem("user");
            if (!user) router.push("/teacher/login");
        }
    }, [router]);

    // When the active thread changes we:
    // 1. Load the (mock) messages for that thread
    // 2. Clear the unread counter for the selected thread
    // 3. Scroll the messages viewport to the bottom so the newest
    //    messages are visible.
    useEffect(() => {
        setMessages(mockMessages[activeThreadId] || []);
        setThreads((prev) => prev.map((t) => (t.id === activeThreadId ? { ...t, unread: 0 } : t)));
        setTimeout(() => messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" }), 50);
    }, [activeThreadId]);

    // Filter threads by the search query. This is a lightweight client-side
    // filter used for the demo; in a real app consider server-side search
    // for large datasets.
    const filteredThreads = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return threads;
        return threads.filter((t) => t.name.toLowerCase().includes(q) || t.lastMessage.toLowerCase().includes(q));
    }, [search, threads]);

    // sendMessage: local helper to append a new outgoing message to the
    // current message list. This is synchronous and optimistic (no
    // server roundtrip). In production wire this up to your messages API
    // or WebSocket send function and handle errors / retries.
    const sendMessage = () => {
        if (!compose.trim()) return;
        const newMsg: Message = { id: `m${Date.now()}`, from: "me", text: compose.trim(), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), type: "text" };
        setMessages((p) => [...p, newMsg]);
        setCompose("");
        setThreads((prev) => prev.map((t) => (t.id === activeThreadId ? { ...t, lastMessage: newMsg.text || "", time: newMsg.time } : t)));
        setTimeout(() => messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" }), 50);
    };

    return (
        <div
            className="min-h-screen bg-[#F8F8F8] p-6"
            style={{ fontFamily: "'Manrope', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto" }}
        >
            <div className="max-w-[1173px] mx-auto flex flex-col md:flex-row">
                {/* Sidebar */}
                <aside className="w-full md:w-[320px] bg-white rounded shadow-sm overflow-hidden md:h-[945px]">
                    <div className="px-4 py-4 border-b flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="text-base  font-medium  text-[#030E18]">Messages</div>
                        </div>
                    </div>

                    <div className="p-4">
                        <div
                            className="mb-3"
                            style={{
                                borderTopWidth: "1px",
                                borderBottomWidth: "1px",
                                borderStyle: "solid",
                                borderColor: "#F9F9F9",
                                background: "#FFFFFF",
                                padding: "10px",
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                opacity: 1,
                            }}
                        >
                            <div className="flex-1 h-full flex items-center">
                                <Search />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search"
                                    className="w-full px-3 h-[44px] rounded-lg border border-[#F9F9F9] text-sm 
                                    "
                                />


                            </div>
                            <button className="inline-flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded text-sm shadow-sm text-[#595959]">
                                All
                                <ChevronDown className="w-4 h-4" />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div className="relative">
                                {/* Create Group control - clicking opens the Create Group popover */}
                                <div
                                    role="button"
                                    onClick={() => setShowCreateGroup((s) => !s)}
                                    className="bg-white rounded-md cursor-pointer"
                                    style={{
                                        width: "330px",
                                        height: "50px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        paddingLeft: "13px",
                                        paddingRight: "13px",
                                        boxSizing: "border-box",
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full flex items-center justify-center ">
                                            <Users className="w-6 h-6 " />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-sm font-medium text-[#030E18]">Create Group</div>
                                            <div className="text-xs text-gray-500">Add students in one place</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 bg-[#003366] rounded-full" />
                                    </div>
                                </div>

                                {/* Create Group popover - positioned relative to this control */}
                                {showCreateGroup && (
                                    <>
                                        {/* Desktop popover: visible on md+ screens */}
                                        <div
                                            className="hidden md:block absolute left-0 top-[58px] z-40 bg-white shadow-lg"
                                            style={{ width: 320, border: "1px solid #F0F0F0", borderRadius: 8 }}
                                        >
                                            <div className="p-3">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center">
                                                            <Users className="w-4 h-4" />
                                                        </div>
                                                        <input placeholder="Group name" className="pl-2 text-sm outline-none" />
                                                    </div>
                                                    <button onClick={() => setShowCreateGroup(false)} className="p-1 rounded hover:bg-gray-100">
                                                        <X className="w-4 h-4 " />
                                                    </button>
                                                </div>

                                                <div className="text-xs text-gray-500 mb-2">Added 99 Students</div>

                                                <div className="grid grid-cols-4 gap-2 mb-3">
                                                    {Array.from({ length: 8 }).map((_, i) => (
                                                        <div key={i} className="relative w-14 h-14">
                                                            <img src="/img/avatar-placeholder.jpg" alt="student" className="w-full h-full rounded-full object-cover" />
                                                            <button className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                                                                <X className="w-3 h-3 text-gray-500" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="flex justify-end mx-4">
                                                    <button className="bg-[#0B79D0] text-white px-4 py-2 rounded">Create</button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Mobile modal: full-screen on small devices */}
                                        <div className="md:hidden fixed inset-0 z-50 flex items-start">
                                            {/* Backdrop */}
                                            <div className="fixed inset-0 bg-black/30" onClick={() => setShowCreateGroup(false)} />

                                            <div className="relative w-full bg-white rounded-t-xl shadow-lg p-4 max-h-full overflow-auto" style={{ marginTop: '60px' }}>
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <button onClick={() => setShowCreateGroup(false)} className="p-2">
                                                            <X className="w-5 h-5 text-gray-600" />
                                                        </button>
                                                        <h3 className="text-base font-medium">Create Group</h3>
                                                    </div>
                                                </div>

                                                <div className="mb-3">
                                                    <div className="flex items-center gap-2 border rounded p-2">
                                                        <Search className="w-4 h-4 text-gray-400" />
                                                        <input placeholder="Search" className="flex-1 outline-none text-sm" />
                                                        <button className="p-1 rounded hover:bg-gray-100"><X className="w-4 h-4 text-gray-400" /></button>
                                                    </div>
                                                </div>

                                                <div className="mb-3 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-white border flex items-center justify-center">
                                                            <Users className="w-5 h-5 text-[#0B79D0]" />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium">Add Student</div>
                                                            <div className="text-xs text-gray-400">Add student to group</div>
                                                        </div>
                                                    </div>
                                                    <button className="text-sm text-[#0B79D0]">Add</button>
                                                </div>

                                                <div className="overflow-auto max-h-[60vh]">
                                                    {Array.from({ length: 6 }).map((_, i) => (
                                                        <div key={i} className="flex items-center gap-3 py-2 border-b border-transparent hover:border-gray-100">
                                                            <img src="/img/avatar-placeholder.jpg" alt="student" className="w-10 h-10 rounded-full object-cover" />
                                                            <div>
                                                                <div className="text-sm font-medium">Fatima Abubakar</div>
                                                                <div className="text-xs text-gray-400">Students</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="flex justify-end mt-4">
                                                    <button onClick={() => setShowCreateGroup(false)} className="bg-[#0B79D0] text-white px-4 py-2 rounded">Create</button>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="space-y-2 max-h-[740px] overflow-auto">
                                {filteredThreads.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => {
                                            setActiveThreadId(t.id);
                                            if (typeof window !== 'undefined' && window.innerWidth < 768) setMobileViewOpen(true);
                                        }}
                                        className={`w-full flex items-center gap-3 h-[72px] px-3 rounded-lg hover:bg-gray-50 ${activeThreadId === t.id ? "bg-gray-50" : ""}`}>
                                        <div className={`w-[50px] h-[50px] rounded-full flex items-center justify-center text-white ${t.avatarColor} text-sm`}>{t.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}</div>
                                        <div className="flex-1 text-left">
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm font-medium text-[#030E18]">{t.name}</div>
                                                <div className="text-xs text-gray-400">{t.time}</div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="text-xs text-gray-500 truncate w-[160px]">{t.lastMessage}</div>
                                                <div className="ml-2">{t.unread > 0 && <span className="text-xs bg-[#003366] text-white px-2 py-0.5 rounded-full">{t.unread}</span>}</div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>
                {/* Chat Panel: adjusted to Figma profile/card size */}
                <main
                    className={`w-full md:w-[748px] bg-white shadow-sm flex flex-col md:h-[554px] ${mobileViewOpen ? 'block' : 'hidden md:block'}`}
                    style={{
                        border: "1px solid #F0F0F0",
                        borderRadius: "10px",
                    }}
                >
                    <div className=" px-6 py-4 border-b flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button className="md:hidden p-2 mr-2" onClick={() => setMobileViewOpen(false)}>
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="w-[50px] h-[50px] rounded-full bg-[#F97316] flex items-center justify-center text-white text-sm">{threads.find((t) => t.id === activeThreadId)?.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}</div>
                            <div>
                                <div className="text-sm font-medium text-[#030E18]">{threads.find((t) => t.id === activeThreadId)?.name}</div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#77DD77" }} />
                                    <span>{threads.find((t) => t.id === activeThreadId)?.typing ? "typing..." : "online"}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button title="Call" className="p-2 rounded hover:bg-gray-100">
                                <Phone className="w-5 h-5" />
                            </button>
                            <button title="Video" className="p-2 rounded hover:bg-gray-100">
                                <Video className="w-5 h-5" />
                            </button>
                            {/* Open profile/detail overlay */}
                            <button title="Profile" onClick={() => setShowProfile(true)} className="p-2 rounded hover:bg-gray-100">
                                <MoreHorizontal className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 p-6 bg-[#F8F8F8] relative" ref={messagesRef}>
                        <div className="max-w-full md:max-w-3xl mx-auto">
                            <div className="flex justify-center mb-6">
                                <div className="text-xs bg-white px-3 py-1 rounded-full text-gray-500">Today</div>
                            </div>

                            <div className="space-y-4">
                                {messages.map((m) => (
                                    <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                                        <div className={`rounded-[14px] p-4 shadow-sm max-w-[90%] md:max-w-[72%] ${m.from === "me" ? "bg-[#0B79D0] text-white" : "bg-white text-[#030E18] border border-transparent"}`}>
                                            {m.type === "voice" ? (
                                                m.from === "them" ? (
                                                    <div className="flex items-center gap-3">
                                                        {/* Incoming voice message: light background with
                                                            a colored play button and muted waveform */}
                                                        <button className="w-9 h-9 bg-[#E6F2FB] text-[#0B79D0] rounded-full flex items-center justify-center">▶</button>
                                                        <div className="flex-1">
                                                            <div className="h-3 flex items-end gap-1">
                                                                <div className="w-2 h-2 bg-gray-300 rounded" />
                                                                <div className="w-2 h-3 bg-gray-300 rounded" />
                                                                <div className="w-2 h-4 bg-gray-300 rounded" />
                                                                <div className="w-2 h-2 bg-gray-300 rounded" />
                                                                <div className="w-2 h-3 bg-gray-300 rounded" />
                                                            </div>
                                                        </div>
                                                        <div className="text-xs text-gray-500">00:08</div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-3">
                                                        {/* Outgoing voice message: dark/transparent button to
                                                            contrast with the blue bubble and a white waveform */}
                                                        <button className="w-9 h-9 bg-white/20 text-white rounded-full flex items-center justify-center">▶</button>
                                                        <div className="flex-1">
                                                            <div className="h-3 flex items-end gap-1">
                                                                <div className="w-2 h-2 bg-white/40 rounded" />
                                                                <div className="w-2 h-3 bg-white/40 rounded" />
                                                                <div className="w-2 h-4 bg-white/40 rounded" />
                                                                <div className="w-2 h-2 bg-white/40 rounded" />
                                                                <div className="w-2 h-3 bg-white/40 rounded" />
                                                            </div>
                                                        </div>
                                                        <div className="text-xs text-white/90">00:08</div>
                                                    </div>
                                                )
                                            ) : (
                                                <div className="text-[16px] leading-[22px]">{m.text}</div>
                                            )}
                                            <div className={`${m.from === "me" ? "text-[12px] text-white/80 mt-2 text-right" : "text-[12px] text-gray-400 mt-2 text-right"}`}>{m.time}</div>
                                        </div>
                                    </div>
                                ))}

                                <div className="w-full md:w-[708px] bg-white border border-white rounded-[10px] p-3 flex flex-col gap-4 sticky bottom-4 md:static md:mx-0 mx-auto">
                                    <input
                                        type="text"
                                        value={compose}
                                        onChange={(e) => setCompose(e.target.value)}
                                        onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                                        placeholder="Type something here..."
                                        className="w-full font-['Manrope'] font-normal text-[16px] leading-[24px] text-[#7B7B7B] outline-none placeholder:text-[#7B7B7B] bg-transparent"
                                    />
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <button className="h-[30px] px-[11.74px] bg-white border-[0.78px] border-[#F0F0F0] rounded-[7.83px] flex items-center gap-[6.26px]">
                                                <span className="font-['Manrope'] font-medium text-[14px] leading-[19px] text-[#6F6F6F]">
                                                    Document
                                                </span>
                                                <FileText className="w-[18px] h-[18px] text-[#6F6F6F]" strokeWidth={1.17} />
                                            </button>
                                            <button className="h-[31.32px] px-[11.74px] bg-white border-[0.78px] border-[#F0F0F0] rounded-[7.83px] flex items-center gap-[6.26px]">
                                                <span className="font-['Manrope'] font-medium text-[14px] leading-[19px] text-[#6F6F6F]">
                                                    Image
                                                </span>
                                                <Image className="w-[18px] h-[18px] text-[#6F6F6F]" strokeWidth={1.17} />
                                            </button>
                                            <button className="h-[31.32px] px-[11.74px] bg-white border-[0.78px] border-[#F0F0F0] rounded-[7.83px] flex items-center gap-[6.26px]">
                                                <span className="font-['Manrope'] font-medium text-[14px] leading-[19px] text-[#6F6F6F]">
                                                    Video
                                                </span>
                                                <PlayCircle className="w-[18px] h-[18px] text-[#6F6F6F]" strokeWidth={1.17} />
                                            </button>
                                        </div>
                                        <button
                                            onClick={sendMessage}
                                            className="w-[52px] h-[42px] bg-[#C7C7C7] rounded-[10px] flex items-center justify-center hover:bg-[#B0B0B0] transition-colors"
                                        >
                                            <Mic className="w-[22px] h-[22px] text-white" strokeWidth={1.5} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </main>

                {/* Profile / Group detail overlay */}
                {showProfile && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-black/30 z-40"
                            onClick={() => setShowProfile(false)}
                            aria-hidden
                        />

                        <aside
                            className="fixed right-0 top-0 z-50 bg-white shadow-lg"
                            style={{ width: 420, height: "100vh", borderLeft: "1px solid #F0F0F0" }}
                            role="dialog"
                            aria-modal="true"
                        >
                            <div className="p-6 h-full flex flex-col">
                                <div className="flex items-start justify-end">
                                    <button onClick={() => setShowProfile(false)} className="p-2 rounded hover:bg-gray-100">
                                        <X className="w-5 h-5 text-gray-600" />
                                    </button>
                                </div>

                                <div className="flex flex-col items-center mt-4">
                                    <div className="w-24 h-24 rounded-full overflow-hidden mb-3">
                                        <img src="/img/avatar-placeholder.jpg" alt="Group avatar" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="text-lg font-semibold text-[#030E18]">JSS 1</div>
                                    <div className="text-sm text-gray-400">Group Name</div>
                                </div>

                                <div className="mt-6 grid grid-cols-3 gap-4">
                                    <button className="flex flex-col items-center gap-2 p-4 border rounded-md">
                                        <Phone className="w-5 h-5 text-gray-700" />
                                        <div className="text-sm">Call</div>
                                    </button>
                                    <button className="flex flex-col items-center gap-2 p-4 border rounded-md">
                                        <Video className="w-5 h-5 text-gray-700" />
                                        <div className="text-sm">Call</div>
                                    </button>
                                    <button className="flex flex-col items-center gap-2 p-4 border rounded-md">
                                        <MessageSquare className="w-5 h-5 text-gray-700" />
                                        <div className="text-sm">Message</div>
                                    </button>
                                </div>

                                <div className="mt-6 p-4 border rounded-md bg-[#FAFBFB] flex-1 overflow-auto">
                                    <h4 className="text-sm font-medium mb-2">Welcome to the Class Group!</h4>
                                    <p className="text-sm text-gray-600">This is your space to collaborate, share ideas, ask questions, and stay connected with your classmates. Whether you need help with an assignment, want to share resources, or just discuss what's going on in class — engage here.</p>
                                </div>
                            </div>
                        </aside>
                    </>
                )}
            </div>
        </div >
    );
}