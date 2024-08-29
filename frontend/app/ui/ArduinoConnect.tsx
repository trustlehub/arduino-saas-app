"use client";
import React, { useState, useEffect } from "react";
import { useArduinoContext } from "./ArduinoProvider";

const ArduinoConnect: React.FC = () => {
    const { connectArduino, disconnectArduino, port } = useArduinoContext();

    return (
        <div className="relative flex flex-col items-center text-white justify-center bg-[#1e1e1e] rounded-[32px] w-full p-4">
            {port ? <div className={'rounded-full bg-green-400 px-3 py-2 text-green-950'}>Arduino Connected!</div> : 
                <div className={'rounded-full px-3 py-2 bg-amber-400 text-amber-950'}>No Arduino Connected</div>}
            {!port &&
                <button onClick={connectArduino}>
                    Connect Port
                </button>
            }
            {port?.getInfo().serialNumber}
            {!!port &&
                <button onClick={disconnectArduino}>
                    Disconnect
                </button>
            }
        </div>
    );
};

export default ArduinoConnect;
