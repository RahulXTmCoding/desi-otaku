import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../hooks/useDebounce';

interface SearchInputProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
  autoFocus?: boolean;
  showSuggestions?: boolean;
  isMobile?: boolean;
}

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'trending' | 'product';
}

const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = "Search for products...",
  className = "",
  onSearch,
  autoFocus = false,
  showSuggestions = true,
  isMobile = false
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Debounce the search query
  const debouncedQuery = useDebounce(query, 300);

  // Enhanced suggestions - showcases multi-word search and category matching
  const mockSuggestions: SearchSuggestion[] = [
    { id: '1', text: 'anime', type: 'trending' },
    { id: '2', text: 'anime t-shirts', type: 'trending' },
    { id: '3', text: 'oversized hoodies', type: 'trending' },
    { id: '4', text: 'naruto shirt', type: 'recent' },
    { id: '5', text: 'one piece hoodie', type: 'recent' },
    { id: '6', text: 'demon slayer', type: 'trending' },
    { id: '7', text: 'attack on titan', type: 'recent' },
    { id: '8', text: 'dragon ball z', type: 'trending' },
    { id: '9', text: 'black oversized', type: 'recent' },
    { id: '10', text: 'custom design', type: 'product' },
    { id: '11', text: 'vintage anime', type: 'trending' },
    { id: '12', text: 'streetwear', type: 'recent' }
  ];

  // Filter suggestions based on query
  useEffect(() => {
    if (debouncedQuery.length > 0) {
      const filtered = mockSuggestions.filter(suggestion =>
        suggestion.text.toLowerCase().includes(debouncedQuery.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 6)); // Limit to 6 suggestions
    } else {
      // Show recent/trending when no query
      setSuggestions(mockSuggestions.slice(0, 6));
    }
  }, [debouncedQuery]);

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setIsActive(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowDropdown(true);
  };

  const handleInputFocus = () => {
    setIsActive(true);
    if (showSuggestions) {
      setShowDropdown(true);
    }
  };

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      // Save to recent searches (localStorage)
      const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      const updatedSearches = [searchQuery, ...recentSearches.filter((s: string) => s !== searchQuery)].slice(0, 10);
      localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));

      // Navigate to shop page with search query
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
      
      // Call custom onSearch if provided
      if (onSearch) {
        onSearch(searchQuery);
      }

      // Close dropdown and blur input
      setShowDropdown(false);
      setIsActive(false);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    handleSearch(suggestion.text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(query);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setIsActive(false);
      inputRef.current?.blur();
    }
  };

  const clearSearch = () => {
    setQuery('');
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'recent':
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'trending':
        return <TrendingUp className="w-4 h-4 text-yellow-400" />;
      default:
        return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className={`relative transition-all duration-200 ${
        isActive 
          ? 'ring-2 ring-yellow-400 ring-opacity-50' 
          : 'hover:ring-1 hover:ring-gray-600'
      }`} style={{ borderRadius: '12px' }}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`block w-full pl-10 pr-10 py-3 border border-gray-600 rounded-xl bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 transition-all duration-200 ${
            isMobile ? 'text-lg' : 'text-sm'
          }`}
        />
        {query && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              onClick={clearSearch}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto"
        >
          {suggestions.length > 0 ? (
            <>
              <div className="px-4 py-2 border-b border-gray-700">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  {debouncedQuery ? 'Search Suggestions' : 'Popular Searches'}
                </span>
              </div>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-700 transition-colors group"
                >
                  {getSuggestionIcon(suggestion.type)}
                  <span className="text-white group-hover:text-yellow-400 transition-colors">
                    {suggestion.text}
                  </span>
                  {suggestion.type === 'trending' && (
                    <span className="ml-auto text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-full">
                      Trending
                    </span>
                  )}
                </button>
              ))}
              {query && (
                <button
                  onClick={() => handleSearch(query)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-700 transition-colors border-t border-gray-700 group"
                >
                  <Search className="w-4 h-4 text-yellow-400" />
                  <span className="text-white group-hover:text-yellow-400 transition-colors">
                    Search for "<span className="font-medium">{query}</span>"
                  </span>
                </button>
              )}
            </>
          ) : (
            <div className="px-4 py-6 text-center text-gray-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Start typing to search...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchInput;
