"use client";

import React, {createContext, useContext, useState, useEffect, ReactNode} from "react";
import {useEditorContext} from "@/app/ui/EditorProvider";

interface ArduinoContextType {
    data: number[];
    rawText: string;
    port: SerialPort | null;
    clearData: () => void;
    connectArduino: () => Promise<void>;
    disconnectArduino: () => Promise<void>;
    writeToSerial: (data: string) => Promise<void>;
    upload: (data: string) => Promise<void>;
    compile: (data: string) => Promise<void>;
}

const ArduinoContext = createContext<ArduinoContextType | undefined>(undefined);

interface ArduinoProviderProps {
    children: ReactNode;
}

export const ArduinoProvider: React.FC<ArduinoProviderProps> = ({children}) => {
    const [data, setData] = useState<number[]>([]);
    const [rawText, setRawText] = useState<string>("");
    const [port, setPort] = useState<SerialPort | null>(null);
    const [aborter, setAborter] = useState<AbortController>()
    const [readerClosed, setReaderClosed] = useState<any>()
    const [compiledContents, setcompiledContents] = useState<ArrayBuffer | null>(null)
    const maxDataPoints = 100;

    // Function to write to serial
    const writeToSerial = async (data: string) => {
        const encoder = new TextEncoder();
        const dataArrayBuffer = encoder.encode(data);

        if (port && port.writable) {
            const writer = port.writable.getWriter();
            await writer.write(dataArrayBuffer);
            writer.releaseLock();
        }
    }
    // Function to connect to the Arduino
    const connectArduino = async () => {
        if ('serial' in navigator) {
            try {
                const newPort = await navigator.serial.requestPort();
                await newPort.open({baudRate: 9600});
                const a = new AbortController()
                setPort(newPort);
                // readData(newPort);
                const decoder = new TextDecoder();
                const appendStream = new WritableStream({
                    write(chunk) {
                        setRawText((prev) => {
                            const txt = decoder.decode(chunk);
                            return prev.toString() + txt.toString();
                        });
                        
                    }
                })
                setAborter(a)
                setReaderClosed(newPort.readable.pipeTo(appendStream, a))
            } catch (error) {
                console.error('There was an error opening the serial port:', error);
            }
        } else {
            console.error('Web Serial API not supported in this browser.');
        }
    };

    // Function to disconnect from the Arduino
    const disconnectArduino = async () => {
        if (port) {
            aborter?.abort()
            await readerClosed.catch(()=>{})
            await port.close();
            setPort(null);
            clearData();
        }
    };

    const compile = async (text: string): Promise<void> => {
        try {
            const response = await fetch(
                process.env.NEXT_PUBLIC_BACKEND_BASEURL +
                "/compile", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    code: text,
                    board: 'arduino:avr:uno',
                }),
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(errorMessage);
            }

            // Step 2: Convert the Blob to an ArrayBuffer
            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            setcompiledContents(arrayBuffer)
            return Promise.resolve()

        } catch (error) {
            return Promise.reject(error)
        }
    };
    const upload = async (): Promise<void> => {
        disconnectArduino()
        const AvrgirlArduino = (await import('../utils/avrgirl')).default
        if (!compiledContents){
            setRawText((p)=>p + "\n" +"Please compile first!")
            return Promise.reject("Not compiled yet!")
        }
        if (AvrgirlArduino != null && compiledContents) {
            const avrgirl = new AvrgirlArduino({
                board: 'uno',
                debug: (log: string) =>{
                    setRawText((prev)=>{
                        return prev + "\n" + log
                    })
                },
            });

            // @ts-ignore
            avrgirl.flash(compiledContents, error => {
                if (error) {
                    console.error(error);
                    return Promise.reject(error)
                } else {
                    console.info("flash successful");
                    return Promise.resolve();
                }
            });
        }

    }
    // Function to clear data
    const clearData = () => {
        setData([]);
        setRawText("")
    };

    return (
        <ArduinoContext.Provider
            value={{clearData, connectArduino, data, disconnectArduino, port, rawText, writeToSerial, upload, compile}}>
            {children}
        </ArduinoContext.Provider>
    );
};

// Custom hook to use the Arduino context
export const useArduinoContext = () => {
    const context = useContext(ArduinoContext);
    if (context === undefined) {
        throw new Error("useArduinoContext must be used within an ArduinoProvider");
    }
    return context;
};
