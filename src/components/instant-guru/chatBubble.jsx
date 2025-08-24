import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { chatHistory, chatType, isFirstDoubt, showChatLoadShimmer, showDoubtChatLoader, suggestedDoubtAsked, waitingForResponse } from "../../state/instantGuruState";
import { chatOptionClicked, chatRequestVideo, chatResponseFeedback, openNewChat, saveDoubtChat, scrollToBottom } from "../../utils/instantGuruUtilsProd";
import { MathJax } from "better-react-mathjax";
import suggestedQuestions from "../../assets/suggested_question.json";
import 'katex/dist/katex.min.css';
import { BlockMath } from "react-katex";
import renderMathInElement from 'katex/contrib/auto-render';
import SmilesRenderer from "../smileRenderer";
import ReactDOM from "react-dom/client";

// import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from 'react-html-parser';



export const TextOptionBubble = ({ chat, chatIndex, fullWidth = true }) => {
    const { i18n, t } = useTranslation();


    return chat.botResponse !== null && chat.botResponse !== "" && chat.responseType === "TEXT_OPTION" && chat.optionResponse !== undefined && chat.optionResponse !== null ? (
        <div key="box" className="flex items-end">
            {chat.showAvatar || chat.showBotAvatar ? (
                <img
                    src={require("../../assets/icons/icon_chat_avatar.png")}
                    className="h-[40px] w-[40px] object-contain mr-2"
                />
            ) : <div className="h-[40px] w-[40px] mr-2"></div>}
            <div className={`flex flex-col px-3 py-2 bg-[#f6f6f6] mr-auto text-sm rounded-lg ${fullWidth ? 'w-full' : 'w-1/2'}`}>
                <p className="mb-1" dangerouslySetInnerHTML={{ __html: chat.botResponse.replaceAll("(bold)<b>", "</b>") ?? t("chooseTypeOfSolution") }}></p>
                <div className="flex flex-col mr-auto">
                    {chat.optionResponse.map((option, index) => {
                        return (
                            <div key={index}
                                className="px-3 py-2 bg-white text-sm rounded-[8px] my-1 cursor-pointer"
                                onClick={chatIndex !== chatHistory.value.length - 1 ? null : () => {
                                    if (waitingForResponse.value === false && showDoubtChatLoader.value === false && showChatLoadShimmer.value === false) {
                                        if (option.title.includes("Video") || option.title.includes("वीडियो")) {
                                            chatRequestVideo(chat.responseId);
                                        } else if (option.title.includes("New") || option.title.includes("नया")) {
                                            openNewChat();
                                        } else if (option.suggested_question === true) {
                                            let question = suggestedQuestions.filter((question) => question.question === option.title)[0];
                                            chatHistory.value = [...chatHistory.value, {
                                                "botResponse": question.answer,
                                                "responseType": "HTML",
                                                "showBotAvatar": true,
                                            }]
                                            isFirstDoubt.value = false;
                                            suggestedDoubtAsked.value = true;
                                            chatType.value = "subject_based";
                                            scrollToBottom();
                                            saveDoubtChat(option.title, question.answer);
                                        } else {
                                            chatOptionClicked(chat.responseId, option.title);
                                        }
                                    }
                                }}
                            >
                                <p
                                    className="text-sm"
                                    dangerouslySetInnerHTML={{
                                        __html: option.title && option.title.replaceAll(
                                            "(bold)<b>",
                                            "</b>"
                                        ),
                                    }}
                                ></p>
                            </div>
                        );
                    }
                    )}
                </div>
            </div>
        </div>
    ) : null;
}



export const HTMLResponseBubble = ({ chat, chatIndex, fullWidth = true }) => {

    const { i18n, t } = useTranslation();
    const containerRef = useRef(null);

    useEffect(() => {
        if (containerRef.current) {
            renderMathInElement(containerRef.current, {
                delimiters: [
                    { left: "\\[", right: "\\]", display: true },
                    { left: "\\(", right: "\\)", display: false },
                    { left: "$$", right: "$$", display: true },
                    { left: "$", right: "$", display: false }
                ]
            });

            const el = containerRef.current;
            if (!el) return;

            setTimeout(() => {
                const nodes = Array.from(el.querySelectorAll("smiles"));
                nodes.forEach((node, i) => {
                    const smiles = (node.textContent || node.getAttribute("value") || "").trim();
                    const mount = document.createElement("div");
                    node.replaceWith(mount);
                    console.log(smiles);
                    ReactDOM.createRoot(mount).render(<SmilesRenderer key={Math.random() + i} smiles={smiles} />);
                });
            }, 200)

        }
    }, [chat.botResponse]);




    return chat.botResponse !== null && chat.botResponse !== "" && (chat.responseType === "TEXT" || chat.responseType === "HTML") ?
        (
            <div
                key="box" className="flex items-end w-full overflow-x-hidden">
                {chat.showAvatar || chat.showBotAvatar ? (
                    <img
                        src={require("../../assets/icons/icon_chat_avatar.png")}
                        className={
                            chat.needFeedback
                                ? "h-[40px] w-[40px] object-contain mr-2 mb-6"
                                : "h-[40px] w-[40px] object-contain mr-2 mb-0"
                        }
                    />
                ) : <div className="h-[40px] w-[40px] mr-2"></div>}
                {/* w-[calc(100vw-80px)] */}
                <div className={`flex flex-col  ${fullWidth ? 'w-[calc(100vw-80px)]' : 'w-1/2'}  overflow-x-hidden`}>
                    <div className="px-3 py-2 bg-[#f6f6f6] text-sm rounded-lg flex-1 receiveBubble">
                        {/* chat.botResponse.replaceAll("(bold)<b>", "</b>").replaceAll(/(\n){2,}/g, '</br>') */}
                        <div ref={containerRef}
                            dangerouslySetInnerHTML={{ __html: chat.botResponse.replaceAll("(bold)<b>", "</b>").replaceAll(/(\n){2,}/g, '</br>') }}
                            style={{ fontFamily: 'Urbanist, sans-serif', fontSize: '14px' }}
                        >
                        </div>
                        {/* <SmilesRenderer smiles="CCCN(C)CC"/> */}
                        {/* <MathJax style={{fontFamily:"Noto Sans Devanagari"}} className="overflow-x-auto" dangerouslySetInnerHTML={{ __html: chat.botResponse.replaceAll("(bold)<b>", "</b>").replaceAll("\n", "</br>").replaceAll("**", "") }}>
                        </MathJax> */}
                    </div>
                    {chat.needFeedback && chatIndex == chatHistory.value.length - 1 ? (
                        <div className="flex items-center ml-auto mt-1">
                            <p className="text-[9px] text-gray-500 mr-2">
                                {t("was_this_helpful")}
                            </p>
                            <img
                                src={require("../../assets/icons/icon_thumbs_up.png")}
                                className="h-4 mr-2 cursor-pointer"
                                onClick={chatIndex !== chatHistory.value.length - 1 ? null : () => {
                                    chatResponseFeedback(chat.responseId, true);
                                }}
                            />
                            <img
                                src={require("../../assets/icons/icon_thumbs_down.png")}
                                className="h-4 cursor-pointer"
                                onClick={chatIndex !== chatHistory.value.length - 1 ? null : () => {
                                    chatResponseFeedback(chat.responseId, false);
                                }}
                            />
                        </div>
                    ) : null}
                </div>
            </div>
        )
        : null;
}