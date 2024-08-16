"use client";

import React, {createContext, useContext, useState, useEffect, ReactNode} from "react";

interface ArduinoContextType {
    data: number[];
    rawText: string;
    port: SerialPort | null;
    clearData: () => void;
    connectArduino: () => Promise<void>;
    disconnectArduino: () => Promise<void>;
    writeToSerial: (data: string) => Promise<void>;
}

const ArduinoContext = createContext<ArduinoContextType | undefined>(undefined);

interface ArduinoProviderProps {
    children: ReactNode;
}

export const ArduinoProvider: React.FC<ArduinoProviderProps> = ({children}) => {
    const [data, setData] = useState<number[]>([]);
    const [rawText, setRawText] = useState<string>("");
    const [port, setPort] = useState<SerialPort | null>(null);
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
                setPort(newPort);
                // readData(newPort);
                const appendStream = new WritableStream({
                    write(chunk) {
                        setRawText((prev) => {
                            return prev.toString() + chunk.toString();
                        });
                    }
                })
                await newPort.readable.pipeThrough(new TextDecoderStream()).pipeTo(appendStream)
            } catch (error) {
                console.error('There was an error opening the serial port:', error);
            }
        } else {
            console.error('Web Serial API not supported in this browser.');
        }
    };
    // readData is not required

    // Function to read data from the Arduino
    // const readData = async (serialPort: SerialPort) => {
    //     const textDecoder = new TextDecoderStream();
    //     const readableStreamClosed = serialPort.readable.pipeTo(textDecoder.writable); 
    //     const reader = textDecoder.readable.getReader();
    //
    //     try {
    //         while (true) {
    //             const {value, done} = await reader.read();
    //             if (done) {
    //                 reader.releaseLock();
    //                 break;
    //             }
    //             const newDataPoint = parseFloat(value);
    //             if (!isNaN(newDataPoint)) {
    //                 setData((prevData) => {
    //                     const newData = [...prevData, newDataPoint];
    //                     return newData.length > maxDataPoints ? newData.slice(newData.length - maxDataPoints) : newData;
    //                 });
    //             }
    //         }
    //     } catch (error) {
    //         console.error('Read error:', error);
    //     }
    // };
    //

    // Function to disconnect from the Arduino
    const disconnectArduino = async () => {
        if (port) {
            await port.close();
            setPort(null);
            clearData();
        }
    };

    // Function to clear data
    const clearData = () => {
        setData([]);
        setRawText("")
    };

    return (
        <ArduinoContext.Provider
            value={{clearData, connectArduino, data, disconnectArduino, port, rawText, writeToSerial}}>
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
