"use client";

import React, { useEffect, useState, useRef } from "react";
import { useArduinoContext } from "./ArduinoProvider";

interface ButtonProps {
    text: string;
    onClick: () => void;
}

const Button: React.FC<ButtonProps> = ({ text, onClick }) => (
    <button
        onClick={onClick}
        className="justify-center px-4 py-2 rounded-lg bg-neutral-700 text-white cursor-pointer"
    >
        {text}
    </button>
);

const SerialMonitor: React.FC = () => {
    const [isAutoScroll, setIsAutoScroll] = useState(true); // State to control auto-scrolling
    const dataRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const { data, clearData, rawText ,writeToSerial} = useArduinoContext();

    // Function to copy data to clipboard
    const copyData = () => {
        const textData = data.join("\n");
        navigator.clipboard.writeText(textData).then(
            () => {
                alert("Data copied to clipboard!");
            },
            (err) => {
                console.error("Failed to copy data: ", err);
            }
        );
    };

    // Handle user scroll to potentially pause/resume auto-scroll
    const handleScroll = () => {
        if (!dataRef.current) {
            return;
        }
        const { scrollTop, scrollHeight, clientHeight } = dataRef.current;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // Buffer of 10 pixels
        setIsAutoScroll(isAtBottom);
    };

    // Auto-scroll to the bottom of the data view if auto-scroll is active
    useEffect(() => {
        if (isAutoScroll && dataRef.current) {
            dataRef.current.scrollTop = dataRef.current.scrollHeight;
        }
    }, [data, isAutoScroll]);

    return (
        <aside className="flex flex-col w-[15%] max-md:w-full">
            <div className="flex flex-col grow self-stretch mx-auto w-full text-white bg-[#1e1e1e] rounded-[16px] max-md:px-5 max-md:mt-10 h-full">
                <div className="flex gap-2.5 justify-between text-base whitespace-nowrap p-2.5">
                    <Button text="Clear" onClick={clearData} />
                    <Button text="Copy" onClick={copyData} />
                </div>
                <div
                    ref={dataRef}
                    className="text-2xl overflow-y-auto px-8 pb-8"
                    onScroll={handleScroll} // Listen to scroll events
                >
                    {rawText}
                    {data.map((number, index) => (
                        <React.Fragment key={index}>
                            {number.toFixed(2)}
                            <br />
                        </React.Fragment>
                    ))}
                </div>
                <div className="flex">
                    <input className="bg-neutral-700 outline-none px-3 py-2" ref={inputRef}/>
                    <div onClick={async ()=>{
                        await writeToSerial(inputRef.current?.value || "")        
                        if (inputRef.current) {
                           inputRef.current.value = ""
                        }
                    }} 
                        className="hover:cursor-pointer rounded-md px-3 py-2 bg-blue-700 text-white">Send</div>
                </div>
            </div>
        </aside>
    );
};

export default SerialMonitor;
