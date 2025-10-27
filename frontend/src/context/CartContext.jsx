import { createContext, useState, useContext, useEffect } from 'react';

export const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {

  const [cartItems, setCartItems] = useState(() => {
    try {
      const localData = sessionStorage.getItem('shoppingCart');
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      console.error("Error al cargar carrito desde sessionStorage:", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('shoppingCart', JSON.stringify(cartItems));
    } catch (error) {
      console.error("Error al guardar carrito en sessionStorage:", error);
    }
  }, [cartItems]);

  const addToCart = (itemToAdd) => {
    setCartItems(prevItems => {
      const newItem = { ...itemToAdd, cartItemId: Date.now() + Math.random() };
      console.log("Añadiendo al carrito:", newItem);
      return [...prevItems, newItem];
    });
  };

  const removeFromCart = (cartItemIdToRemove) => {
    setCartItems(prevItems => prevItems.filter(item => item.cartItemId !== cartItemIdToRemove));
    console.log("Removido del carrito ID:", cartItemIdToRemove);
  };


  const updateQuantity = (cartItemIdToUpdate, newQuantity) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.cartItemId === cartItemIdToUpdate
          ? { ...item, quantity: Math.max(1, newQuantity) } 
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    console.log("Carrito vaciado");
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity, 
    clearCart,
    itemCount: cartItems.length 
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}