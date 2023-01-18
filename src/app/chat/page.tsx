"use client";

import React, { useEffect, useRef, useState } from 'react'
import styles from "./page.module.scss";
import botAvatar from "../../assets/bot_avatar.png";
import { Remarkable } from 'remarkable';
import hljs from 'highlight.js'
// import hljs from 'highlight.js/lib/core';
// import { highlightCode, getLanguageFromAlias } from './highlight';
// import MyAvatar from "../../assets/me.png";

const MyAvatar = () => <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
</svg>;

// const myAvatar = "https://chat.openai.com/apple-touch-icon.png";
// const botAvatar = "https://chat.openai.com/apple-touch-icon.png";
// const botAvatar = "../../assets/bot_avatar.jfif";

type Props = {}

type DATA = {
    message: string;
    isMe: boolean;
    id: number;
    replyOf?: number;
    isLoading?: boolean;
    isError?: boolean;
}

export default function Chat(props: Props) {
    const chatContainer = useRef<HTMLDivElement>(null);
    const md = new Remarkable({
        highlight: function (str, lang) {
            if (lang && hljs.getLanguage(lang)) {
                try {
                    // const safeLanguage = getLanguageFromAlias(lang)?.name ?? "plaintext";
                    // highlightCode(lang, str);
                    return hljs.highlight(lang, str).value;
                } catch (err) { }
            }

            try {
                return hljs.highlightAuto(str).value;
            } catch (err) { }

            return ''; // use external default escaping
        }
    });

    const [models, setModels] = useState<any[]>([]);
    const [currentModel, setCurrentModel] = useState(localStorage.getItem("currentModel") || "text-davinci-003");
    const [temperature, setTemperature] = useState(parseFloat(localStorage.getItem("temperature") || "0.5"));
    const [maxToken, setMaxToken] = useState(parseInt(localStorage.getItem("maxToken") || "512"));
    const [prompt, setPrompt] = useState("");
    const localData = localStorage.getItem("data");
    const [chats, setChats] = useState<DATA[]>(localData ? JSON.parse(localData) : [
        {
            message: "Hello, how are you?",
            isMe: true,
            id: 1,
            isError: false
        },
        {
            message: "I'm fine, thank you. How about you?",
            isMe: false,
            id: 2,
            replyOf: 1,
            isLoading: false,
            isError: false
        }
    ]);

    useEffect(() => {

        // fetch models
        async function fetchModels() {
            const response = await fetch('/api/getModels');
            const data = await response.json();
            setModels(data.models || []);
        }

        fetchModels();

        if (chatContainer.current)
            chatContainer.current.scrollTop = chatContainer.current?.scrollHeight;

    }, []);

    useEffect(() => {
        if (chatContainer.current)
            chatContainer.current.scrollTop = chatContainer.current?.scrollHeight;

        localStorage.setItem("data", JSON.stringify(chats));
    }, [chats]);

    async function sendPrompt(id?: number) {
        if (!prompt && !id) return;

        let currentChats = chats;
        const promptId = currentChats.length + 1;
        const currentPrompt = prompt;
        const promptToAsk = currentChats.filter(chat => chat.id <= (id || Infinity)).map((chat) => `${chat.isMe ? "You" : "Archer"}: ${chat.message}`).join("\n") + `\nYou: # ${currentPrompt}`;

        currentChats = !id ? [
            ...currentChats,
            {
                isMe: true,
                message: currentPrompt,
                id: promptId,
                isError: false
            },
            {
                id: promptId + 1,
                isMe: false,
                message: "...",
                replyOf: promptId,
                isLoading: true,
                isError: false
            }
        ] : currentChats.map((chat) => {
            if (chat.replyOf === id) {
                chat.isLoading = true;
            }
            return chat;
        });
        setChats(currentChats);
        setPrompt("");

        try {
            const response = await fetch('/api/getReply', {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: currentModel,
                    prompt: promptToAsk,
                    max_tokens: maxToken,
                    temperature: temperature,
                    // stream: true,
                })
            });
            const data = await response.json();

            // setChats(chats => ([...chats, { isMe: false, message: data.data.choices[0].text }]));
            currentChats = currentChats.map((chat) => {
                if (!id && chat.replyOf === promptId) {
                    chat.isLoading = false;
                    chat.isError = false;
                    chat.message = data.data.choices[0].text.replace("Archer: ", "").replace("Archer:\n", "");
                } else if (id && chat.replyOf === id) {
                    chat.isLoading = false;
                    chat.isError = false;
                    chat.message = data.data.choices[0].text.replace("Archer: ", "").replace("Archer:\n", "");
                }
                return chat;
            });

            setChats(currentChats);
        } catch (err: any) {
            console.error(err);

            currentChats = currentChats.map((chat) => {

                if (!id && chat.replyOf === promptId) {
                    chat.isLoading = false;
                    chat.isError = true;
                    chat.message = "Something went wrong: " + err.message;
                } else if (id && chat.replyOf === id) {
                    chat.isLoading = false;
                    chat.isError = true;
                    chat.message = "Something went wrong: " + err.message;
                }
                return chat;
            });

            setChats(currentChats);
        }
    }

    return (
        <div className={styles.container}>
            <button onClick={e => {
                if (document) {
                    const aside = document.querySelector("aside");
                    const closeButton = document.querySelector<HTMLButtonElement>("#closeButton");
                    if (aside) aside.style.transform = "translateX(-100%)";
                    if (closeButton) closeButton.style.opacity = "0";
                }
            }} id="closeButton">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" height="1em" width="1em" fill='#fff'>
                    <path d="M310.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L160 210.7 54.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L114.7 256 9.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 301.3 265.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L205.3 256 310.6 150.6z" />
                </svg>
            </button>

            <aside id="aside">
                <ul>
                    <li>
                        <button onClick={e => {
                            setChats([]);
                        }}>Clear Chat</button>
                    </li>
                    <li>
                        <label>Models</label>

                        <select
                            value={currentModel}
                            onChange={(e) => {
                                setCurrentModel(e.target.value);
                                localStorage.setItem("currentModel", e.target.value);
                            }}
                        >
                            {models.map((model, index) => (
                                <option
                                    key={model.id}
                                    value={model.id}
                                >{model.id}</option>
                            ))}
                        </select>

                        <p>The Model parameter controls the engine used to generate the response. Davinci produces the best results.</p>
                    </li>
                    <li>
                        <label>Max Token</label>

                        <input
                            type="range"
                            min="0"
                            max="2048"
                            step="1"
                            value={maxToken}
                            onChange={(e) => {
                                setMaxToken(parseInt(e.target.value))
                                localStorage.setItem("maxToken", e.target.value);
                            }}
                        />

                        <input
                            type="number"
                            min="0"
                            max="2048"
                            value={maxToken}
                            onChange={(e) => {
                                setMaxToken(parseInt(e.target.value))
                                localStorage.setItem("maxToken", e.target.value);
                            }}
                        />

                        <p>The Max Token parameter controls the maximum number of tokens that the model will generate. The default value is 100.</p>
                    </li>
                    <li>
                        <label>Temperature</label>

                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={temperature}
                            onChange={(e) => {
                                setTemperature(parseFloat(e.target.value))
                                localStorage.setItem("temperature", e.target.value);
                            }}
                        />

                        <input
                            type="number"
                            min="0"
                            max="1"
                            value={temperature}
                            onChange={(e) => {
                                setTemperature(parseFloat(e.target.value))
                                localStorage.setItem("temperature", e.target.value);
                            }}
                        />

                        <p>The Temperature parameter controls the randomness of the model. Lower values produce more predictable results, while higher values produce more surprising results.</p>
                    </li>
                </ul>
            </aside>

            <main>
                <header className={styles.header}>
                    <button onClick={e => {
                        if (document) {
                            const aside = document.querySelector("aside");
                            const closeButton = document.querySelector<HTMLButtonElement>("#closeButton");
                            if (aside) aside.style.transform = "translateX(0)";
                            if (closeButton) closeButton.style.opacity = "1";
                        }
                    }}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" height="1em" width="1em" fill='#fff'>
                            <path d="M0 96C0 78.3 14.3 64 32 64H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z" />
                        </svg>
                    </button>

                    <h1>ARCHER - A CHAT ASSISTANT</h1>
                </header>
                <div className={styles.chats} ref={chatContainer}>
                    {chats && chats.map((chat, index) => (
                        <div key={`chat-${chat.id}`} id={`chat-${chat.id}`} className={styles.chat}>
                            <div className={chat.isMe ? styles.me : ""}>
                                <div className={styles.chat__avatar}>
                                    {chat.isMe ?
                                        <img
                                            src={botAvatar.src}
                                            alt="avatar"
                                        />
                                        :
                                        <MyAvatar />
                                    }
                                </div>
                                <div className={styles.chat__message}>
                                    <div
                                        className={chat.isLoading ? styles.animated_background : ""}
                                        style={{
                                            backgroundColor: chat.isMe ? "#027c5e73" : "#323435",
                                            color: chat.isError ? "#ff5151" : "#fff",
                                        }}
                                        dangerouslySetInnerHTML={{ __html: md.render(chat.message.trim()) }}
                                    >{/* chat.message.trim() */}</div>
                                </div>
                                {chat.isMe &&
                                    <div className={styles.chat__controls}>
                                        <button onClick={e => {
                                            sendPrompt(chat.id);
                                        }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" height="1em" width="1em" fill='#fff'>
                                                <path d="M0 224c0 17.7 14.3 32 32 32s32-14.3 32-32c0-53 43-96 96-96H320v32c0 12.9 7.8 24.6 19.8 29.6s25.7 2.2 34.9-6.9l64-64c12.5-12.5 12.5-32.8 0-45.3l-64-64c-9.2-9.2-22.9-11.9-34.9-6.9S320 19.1 320 32V64H160C71.6 64 0 135.6 0 224zm512 64c0-17.7-14.3-32-32-32s-32 14.3-32 32c0 53-43 96-96 96H192V352c0-12.9-7.8-24.6-19.8-29.6s-25.7-2.2-34.9 6.9l-64 64c-12.5 12.5-12.5 32.8 0 45.3l64 64c9.2 9.2 22.9 11.9 34.9 6.9s19.8-16.6 19.8-29.6V448H352c88.4 0 160-71.6 160-160z" />
                                            </svg>
                                        </button>
                                        <button>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" height="1em" width="1em" fill='#fff'>
                                                <path d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.8 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160V416c0 53 43 96 96 96H352c53 0 96-43 96-96V320c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H96z" />
                                            </svg>
                                        </button>
                                    </div>
                                }
                            </div>
                        </div>
                    ))}

                    <div className={styles.greet}>
                        <p></p>
                    </div>
                </div>

                <div className={styles.prompt}>
                    <textarea
                        placeholder="Type your message here..."
                        value={prompt}
                        onChange={(e) => {
                            e.target.style.height = `0px`;
                            e.target.style.height = `${e.target.scrollHeight}px`;
                            if (e.target.scrollHeight > 200) {
                                e.target.style.overflowY = "scroll";
                            } else {
                                e.target.style.overflowY = "hidden";
                            }
                            setPrompt(e.target.value);
                        }}
                        onKeyDown={e => {
                            if (!e.shiftKey && e.key === "Enter") {
                                e.preventDefault();
                                sendPrompt();
                            }
                        }}
                    ></textarea>

                    <button onClick={e => {
                        sendPrompt();
                    }}>
                        SEND
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="1em" height="1em" fill='#fff'>
                            <path d="M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L284 427.7l-68.5 74.1c-8.9 9.7-22.9 12.9-35.2 8.1S160 493.2 160 480V396.4c0-4 1.5-7.8 4.2-10.7L331.8 202.8c5.8-6.3 5.6-16-.4-22s-15.7-6.4-22-.7L106 360.8 17.7 316.6C7.1 311.3 .3 300.7 0 288.9s5.9-22.8 16.1-28.7l448-256c10.7-6.1 23.9-5.5 34 1.4z" />
                        </svg>
                    </button>
                </div>
            </main>
        </div>
    )
}