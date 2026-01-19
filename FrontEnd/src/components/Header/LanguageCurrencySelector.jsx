import { useState } from 'react';
import Icon from '../common/Icon';
import lithuaniaFlag from '../../assets/lithuania.svg';

const LanguageCurrencySelector = () => {
  const [language, setLanguage] = useState('Lietuva');
  const [currency, setCurrency] = useState('EUR');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('Lietuva');
  const [selectedLanguage, setSelectedLanguage] = useState('Lietuvių');
  const [selectedCurrency, setSelectedCurrency] = useState('Euras (€)');

  const handleSave = () => {
    setLanguage(selectedRegion);
    setCurrency(selectedCurrency.split(' ')[0]);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button 
        className="flex items-center gap-2 bg-transparent px-3 py-2 text-white text-[13px] cursor-pointer transition-all duration-200 hover:bg-white/10 hover:border-white/30 rounded"
        onClick={() => setIsOpen(!isOpen)}
      >
        <img src={lithuaniaFlag} alt="Lithuanian flag" className="w-4 h-4" />
        <span className="whitespace-nowrap">{language} | {currency}</span>
        <Icon name="chevronDown" size={16} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-[9998]"
            onClick={handleCancel}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-6 w-[380px] h-[483px] z-[9999] shadow-xl" style={{ backgroundColor: 'rgb(70, 24, 172)' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white text-xl font-bold">Update Settings</h2>
              <button 
                onClick={handleCancel}
                className="text-white hover:text-white/70 transition-colors"
              >
                <Icon name="close" size={24} />
              </button>
            </div>

            <p className="text-white/80 text-sm mb-6">
              Select your preferred region, language and currency.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-white text-sm font-semibold mb-2 block">Region</label>
                <select 
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full text-white px-4 py-2 border border-white/20 focus:outline-none focus:border-[#00ff9d] cursor-pointer"
                  style={{ backgroundColor: '#1f0a4d' }}
                >
                  <option value="Lietuva">🇱🇹 Lietuva</option>
                  <option value="Europe">🇪🇺 Europe</option>
                  <option value="United States">🇺🇸 United States</option>
                </select>
              </div>

              <div>
                <label className="text-white text-sm font-semibold mb-2 block">Language</label>
                <select 
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full text-white px-4 py-2 border border-white/20 focus:outline-none focus:border-[#00ff9d] cursor-pointer"
                  style={{ backgroundColor: '#1f0a4d' }}
                >
                  <option value="Lietuvių">Lietuvių</option>
                  <option value="English">English</option>
                  <option value="Deutsch">Deutsch</option>
                </select>
              </div>

              <div>
                <label className="text-white text-sm font-semibold mb-2 block">Currency</label>
                <select 
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="w-full text-white px-4 py-2 border border-white/20 focus:outline-none focus:border-[#00ff9d] cursor-pointer"
                  style={{ backgroundColor: '#1f0a4d' }}
                >
                  <option value="Euras (€)">Euras (€)</option>
                  <option value="USD ($)">USD ($)</option>
                  <option value="GBP (£)">GBP (£)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6 justify-end w-[300px] h-[35px] ml-auto">
              <button 
                onClick={handleCancel}
                className="border-2 border-white transition-all w-[100px] h-[35px] hover:bg-[rgba(0,0,0,0.38)] flex items-center justify-center"
                style={{ 
                  backgroundColor: 'transparent',
                  color: 'rgb(255, 255, 255)'
                }}
              >
                <span style={{
                  fontSize: '13px',
                  fontWeight: '800',
                  fontFamily: 'metropolis, Arial, Helvetica, sans-serif'
                }}>
                  Cancel
                </span>
              </button>
              <button 
                onClick={handleSave}
                className="transition-all w-[100px] h-[35px] flex items-center justify-center"
                style={{ 
                  backgroundColor: '#fad318',
                  color: 'rgb(0, 0, 0)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(221, 152, 15)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fad318'}
              >
                <span style={{
                  fontSize: '13px',
                  fontWeight: '800',
                  fontFamily: 'metropolis, Arial, Helvetica, sans-serif'
                }}>
                  Save
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageCurrencySelector;
