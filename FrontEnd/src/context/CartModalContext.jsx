import React, { createContext, useState, useContext } from 'react';

const CartModalContext = createContext();

export const CartModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [itemCount, setItemCount] = useState(1);

  const showCartModal = (count = 1) => {
    setItemCount(count);
    setIsOpen(true);
  };

  const hideCartModal = () => {
    setIsOpen(false);
  };

  return (
    <CartModalContext.Provider value={{ isOpen, itemCount, showCartModal, hideCartModal }}>
      {children}
    </CartModalContext.Provider>
  );
};

export const useCartModal = () => {
  const context = useContext(CartModalContext);
  if (!context) {
    throw new Error('useCartModal must be used within CartModalProvider');
  }
  return context;
};
