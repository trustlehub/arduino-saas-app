import React from "react";
import OpenAIAssistant from "./openai-assistant";

const Chat: React.FC = () => {
    return (
        <section className="flex flex-col justify-end gap-4 p-4 bg-[#1e1e1e] rounded-[32px] max-md:max-w-full h-full overflow-y-auto">
            <OpenAIAssistant
                assistantId="asst_Oyc4Xjla3pr0IM5bmUhDtL89"
                greeting="I am a helpful chat assistant. How can I help you?"
            />

        </section>
    );
};

export default Chat;
