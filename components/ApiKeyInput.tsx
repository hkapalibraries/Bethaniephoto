import React from 'react';

interface Props {
  value: string;
  onChange: (val: string) => void;
}

const ApiKeyInput: React.FC<Props> = ({ value, onChange }) => {
  return (
    <div className="mb-4 w-full max-w-md">
      <label className="block text-gray-400 text-sm font-bold mb-2">
        ImgBB API Key (Required for Sharing)
      </label>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="shadow appearance-none border border-slate-600 rounded w-full py-2 px-3 text-slate-200 bg-slate-800 leading-tight focus:outline-none focus:shadow-outline focus:border-yellow-500"
        placeholder="Enter your ImgBB API Key"
      />
    </div>
  );
};

export default ApiKeyInput;