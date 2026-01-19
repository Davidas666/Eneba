import { useState, forwardRef, useImperativeHandle } from 'react';
import Icon from '../common/Icon';

const SearchBar = forwardRef(({ onSearch }, ref) => {
  const [searchValue, setSearchValue] = useState('');

  useImperativeHandle(ref, () => ({
    clearSearch: () => {
      setSearchValue('');
    }
  }));

  const handleClear = () => {
    setSearchValue('');
    if (onSearch) {
      onSearch('');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchValue);
    }
  };

  const handleChange = (e) => {
    setSearchValue(e.target.value);
  };

  return (
    <form onSubmit={handleSearch} className="relative flex items-center w-full max-w-[500px] border border-white px-4 py-3 transition-all duration-300 focus-within:bg-white/15 focus-within:shadow-[0_0_0_2px_rgba(0,255,157,0.3)]">
      <Icon name="search" size={20} className="text-white/60 mr-3 flex-shrink-0" />
      <input
        type="text"
        className="flex-1 bg-transparent border-0 outline-none text-white text-sm placeholder:text-gray-400"
        placeholder="Search for games, top-ups and more"
        value={searchValue}
        onChange={handleChange}
      />
      {searchValue && (
        <button 
          type="button"
          className="bg-transparent border-0 text-white/60 cursor-pointer p-1 flex items-center transition-all duration-200 hover:bg-white/10 hover:text-white"
          onClick={handleClear}
        >
          <Icon name="close" size={18} />
        </button>
      )}
    </form>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;
