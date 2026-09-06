
import React, {
  useEffect,
  useState
} from "react";

import {
  Bot,
  X,
  Send,
  Mic,
  Volume2
} from "lucide-react";


function Chatbot() {

  const [open, setOpen] =
    useState(false);

  const [input, setInput] =
    useState("");

  const [messages, setMessages] =
    useState([
      {
        role: "bot",
        text:
          "Hi! I'm PackSure AI Assistant. I can help explain inspection results and compliance workflow."
      }
    ]);


  useEffect(() => {

    const handler = () =>
      setOpen(true);

    window.addEventListener(
      "open-packsure-chat",
      handler
    );

    return () =>
      window.removeEventListener(
        "open-packsure-chat",
        handler
      );

  }, []);


  const sendMessage = async () => {

    if (!input.trim()) return;

    const userMessage = input.trim();

    setMessages(prev => [
      ...prev,
      {
        role: "user",
        text: userMessage
      }
    ]);

    setInput("");

    const scanId =
      localStorage.getItem("packsure_scan_id");

    if (!scanId) {

      setMessages(prev => [
        ...prev,
        {
          role: "bot",
          text:
            "Please run a compliance inspection first. I need the inspection scan ID to answer questions about the scanned product."
        }
      ]);

      return;
    }


    setMessages(prev => [
      ...prev,
      {
        role: "bot",
        text:
          "Checking the inspection results..."
      }
    ]);


    try {

      const response =
        await fetch(
          "http://192.168.1.87:8000/chat",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              question: userMessage,
              scan_id: Number(scanId)
            })
          }
        );


      let result;


      try {

        result =
          await response.json();

      } catch {

        throw new Error(
          "Backend returned an invalid response."
        );

      }


      if (
        !response.ok ||
        !result.success
      ) {

        throw new Error(
          result?.detail ||
          "Chat request failed."
        );

      }


      setMessages(prev => {

        const updated =
          [...prev];

        // Replace the temporary loading message
        const lastBotIndex =
          updated
            .map(message => message.role)
            .lastIndexOf("bot");


        if (lastBotIndex !== -1) {

          updated[lastBotIndex] = {
            role: "bot",
            text:
              result.answer ||
              "No answer was returned."
          };

        }


        return updated;

      });


    } catch (error) {

      console.error(
        "Chat API error:",
        error
      );


      setMessages(prev => {

        const updated =
          [...prev];


        const lastBotIndex =
          updated
            .map(message => message.role)
            .lastIndexOf("bot");


        const errorMessage = {
          role: "bot",
          text:
            `I couldn't reach the compliance assistant. ${error.message}`
        };


        if (lastBotIndex !== -1) {

          updated[lastBotIndex] =
            errorMessage;

        } else {

          updated.push(
            errorMessage
          );

        }


        return updated;

      });

    }

  };


  const voiceInput = () => {

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

      alert(
        "Voice recognition is not supported in this browser."
      );

      return;
    }


    const recognition =
      new SpeechRecognition();


    recognition.lang =
      "en-IN";


    recognition.start();


    recognition.onresult =
      event => {

        setInput(
          event.results[0][0]
            .transcript
        );

      };

  };


  const speak = text => {

    if (
      "speechSynthesis" in window
    ) {

      const utterance =
        new SpeechSynthesisUtterance(
          text
        );


      utterance.lang =
        "en-IN";


      window.speechSynthesis.speak(
        utterance
      );

    }

  };


  return (

    <>

      {open && (

        <div
          className="
          fixed
          bottom-24
          right-4
          z-50
          flex
          h-[520px]
          w-[calc(100vw-32px)]
          max-w-sm
          flex-col
          overflow-hidden
          rounded-3xl
          border
          border-slate-200
          bg-white
          text-slate-900
          shadow-2xl
          dark:border-slate-700
          dark:bg-slate-900
          dark:text-white
          "
        >

          {/* Header */}

          <div
            className="
            flex
            items-center
            justify-between
            border-b
            border-slate-200
            bg-slate-50
            p-4
            dark:border-slate-800
            dark:bg-slate-950
            "
          >

            <div
              className="
              flex
              items-center
              gap-3
              "
            >

              <div
                className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-xl
                bg-blue-500/10
                text-blue-600
                dark:text-blue-400
                "
              >

                <Bot size={18} />

              </div>


              <div>

                <p
                  className="
                  text-sm
                  font-bold
                  "
                >
                  PackSure AI
                </p>


                <p
                  className="
                  text-[10px]
                  text-emerald-600
                  dark:text-emerald-400
                  "
                >
                  Assistant online
                </p>

              </div>

            </div>


            <button
              type="button"
              onClick={() =>
                setOpen(false)
              }
              className="
              rounded-lg
              p-2
              text-slate-400
              hover:bg-slate-200
              hover:text-slate-900
              dark:text-slate-500
              dark:hover:bg-slate-800
              dark:hover:text-white
              "
            >

              <X size={17} />

            </button>

          </div>


          {/* Messages */}

          <div
            className="
            flex-1
            space-y-4
            overflow-y-auto
            p-4
            "
          >

            {messages.map(
              (message, index) => (

                <div
                  key={index}
                  className={`
                  flex
                  ${
                    message.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  }
                  `}
                >

                  <div
                    className={`
                    max-w-[85%]
                    rounded-2xl
                    px-4
                    py-3
                    text-sm
                    leading-6
                    ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }
                    `}
                  >

                    {message.text}


                    {message.role === "bot" && (

                      <button
                        type="button"
                        onClick={() =>
                          speak(
                            message.text
                          )
                        }
                        aria-label="Read message aloud"
                        className="
                        ml-2
                        inline-flex
                        text-slate-400
                        hover:text-blue-600
                        dark:text-slate-500
                        dark:hover:text-blue-400
                        "
                      >

                        <Volume2 size={14} />

                      </button>

                    )}

                  </div>

                </div>

              )
            )}

          </div>


          {/* Input */}

          <div
            className="
            border-t
            border-slate-200
            bg-white
            p-3
            dark:border-slate-800
            dark:bg-slate-900
            "
          >

            <div className="flex gap-2">

              <input
                value={input}
                onChange={e =>
                  setInput(
                    e.target.value
                  )
                }
                onKeyDown={e => {

                  if (
                    e.key === "Enter"
                  ) {

                    e.preventDefault();

                    sendMessage();

                  }

                }}
                placeholder="Ask PackSure AI..."
                className="
                min-w-0
                flex-1
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                px-3
                py-2.5
                text-sm
                text-slate-900
                outline-none
                placeholder:text-slate-400
                focus:border-blue-500
                dark:border-slate-700
                dark:bg-slate-950
                dark:text-white
                dark:placeholder:text-slate-500
                "
              />


              <button
                type="button"
                onClick={voiceInput}
                aria-label="Voice input"
                className="
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                p-2.5
                text-slate-500
                hover:border-blue-500
                hover:text-blue-600
                dark:border-slate-700
                dark:bg-slate-950
                dark:text-slate-400
                dark:hover:text-blue-400
                "
              >

                <Mic size={17} />

              </button>


              <button
                type="button"
                onClick={sendMessage}
                aria-label="Send message"
                className="
                rounded-xl
                bg-blue-600
                p-2.5
                text-white
                hover:bg-blue-500
                "
              >

                <Send size={17} />

              </button>

            </div>


            <p
              className="
              mt-2
              text-center
              text-[9px]
              text-slate-400
              dark:text-slate-600
              "
            >
              AI assistance only • Not final legal authority
            </p>

          </div>

        </div>

      )}


      {/* Floating Chat Button */}

      <button
        type="button"
        onClick={() =>
          setOpen(!open)
        }
        aria-label={
          open
            ? "Close PackSure AI"
            : "Open PackSure AI"
        }
        className="
        fixed
        bottom-5
        right-5
        z-50
        flex
        h-14
        w-14
        items-center
        justify-center
        rounded-2xl
        bg-blue-600
        text-white
        shadow-xl
        shadow-blue-600/30
        transition
        hover:scale-105
        "
      >

        {open
          ? <X size={22} />
          : <Bot size={22} />
        }

      </button>

    </>

  );

}


export default Chatbot;

