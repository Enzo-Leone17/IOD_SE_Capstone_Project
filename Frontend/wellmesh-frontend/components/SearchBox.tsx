"use client";

import { Dispatch, SetStateAction, useState } from "react";

type SearchBoxProps = {
  value: string;
  onSearch: Dispatch<SetStateAction<string>>;
  placeholder?: string;
};

export default function SearchBox({
  value,
  onSearch,
  placeholder = "Search...",
}: SearchBoxProps) {
    const [currentValue, setCurrentValue] = useState(value);
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={currentValue}
        onChange={(e) => setCurrentValue(e.target.value)}
        placeholder={placeholder}
        className="border p-2 rounded w-full"
      />
      <button
        onClick={() => onSearch(currentValue)}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Search
      </button>
    </div>
  );
}
