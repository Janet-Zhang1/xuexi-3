import { useMemo } from 'react';

interface LetterFilterProps {
  selectedLetter: string | null;
  onSelectLetter: (letter: string | null) => void;
  availableLetters: string[];
}

export function LetterFilter({ selectedLetter, onSelectLetter, availableLetters }: LetterFilterProps) {
  // 字母表
  const alphabet = useMemo(() => {
    return 'abcdefghijklmnopqrstuvwxyz'.split('');
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">按字母浏览</h2>
        {selectedLetter && (
          <button
            onClick={() => onSelectLetter(null)}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            显示全部
          </button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {alphabet.map((letter) => {
          const isAvailable = availableLetters.includes(letter);
          const isSelected = selectedLetter === letter;
          
          return (
            <button
              key={letter}
              onClick={() => onSelectLetter(isSelected ? null : letter)}
              disabled={!isAvailable}
              className={`w-10 h-10 rounded-lg font-medium transition-all duration-200
                         ${isSelected 
                           ? 'bg-indigo-600 text-white shadow-md' 
                           : isAvailable 
                             ? 'bg-gray-50 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
                             : 'bg-gray-50 text-gray-300 cursor-not-allowed'}`}
            >
              {letter.toUpperCase()}
            </button>
          );
        })}
      </div>
    </div>
  );
}