import { useState } from "react";
import { Keyboard } from "./Keyboard";

export const WorldeInput = ({ values, submission }) => {
    return (
        <div className="flex w-full space-x-2 items-center justify-center">
            {(values || ["", "", "", "", ""]).map((value, idx) => {
                return (
                    <div
                        className={`flex h-10 w-10 justify-center items-center border border-black font-bold text-indigo-700 ${
                            submission?.[idx] === "CORRECT"
                                ? "bg-correct"
                                : submission?.[idx] === "PRESENT"
                                ? "bg-close"
                                : null
                        }`}
                        key={idx}
                    >
                        {value?.toUpperCase() || null}
                    </div>
                );
            })}
        </div>
    );
};
