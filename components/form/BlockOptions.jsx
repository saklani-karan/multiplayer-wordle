import { useState } from "react";

export const BlockOptions = ({
    options,
    defaultValue,
    label,
    handleFormEntry,
}) => {
    const [selected, setSelected] = useState(
        defaultValue || options ? options[0]?.key : null
    );

    const handleSelect = (option) => {
        const { key, value } = option;
        handleFormEntry(label, key);
        setSelected(key);
    };

    return (
        <div className="flex space-x-4 items-center">
            {options?.map(({ key, value }) => {
                return (
                    <div
                        className={`flex rounded-lg p-2 bg-white px-6 justify-center ${
                            key === selected
                                ? "border-2 text-blue-600 bg-blue-50 border-blue-600"
                                : "border border-gray-400 text-black"
                        }`}
                        onClick={() => {
                            handleSelect({ key, value });
                        }}
                    >
                        {value}
                    </div>
                );
            })}
        </div>
    );
};
