import { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  onSearch: (keyword: string) => void;
  placeholder?: string;
}

export function SearchBar({ onSearch, placeholder = '搜索单词...' }: SearchBarProps) {
  const [keyword, setKeyword] = useState('');

  // 防抖搜索
  const handleSearch = useCallback(
    debounce((value: string) => {
      onSearch(value);
    }, 300),
    [onSearch]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setKeyword(value);
    handleSearch(value);
  };

  const handleClear = () => {
    setKeyword('');
    onSearch('');
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="w-5 h-5 text-gray-400" />
      </div>
      
      <input
        type="text"
        value={keyword}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                   text-gray-700 placeholder:text-gray-400 transition-all duration-200"
      />
      
      {keyword && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
        </button>
      )}
    </div>
  );
}

// 简单的防抖函数
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}