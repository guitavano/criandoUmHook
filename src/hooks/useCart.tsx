import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';
import { AxiosResponse, AxiosError } from 'axios'

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart")

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  useEffect(() => {
    localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart))
  }, [cart]);

  const addProduct = async (productId: number) => {
    try {

      let isProductInTheCart: Product | undefined = cart.find(product => product['id'] === productId)

      if (isProductInTheCart) {
        updateProductAmount({ productId: productId, amount: isProductInTheCart.amount + 1 })
      } else {
        api.get('/products/' + productId).then(response => {
          let productToAddCart = {
            ...response.data,
            amount: 1
          }
          setCart([...cart, productToAddCart])
        })
      }

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      cart.map(productInTheCart => {
        if (productInTheCart.id === productId) {
          cart.splice(cart.indexOf(productInTheCart), 1)
          setCart([...cart])
        }
      })
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    if (amount < 1) {
      return
    } else {
      try {
        cart.map(productInTheCart => {
          if (productInTheCart.id === productId) {
            api.get('stock/' + productId).then(response => {
              const productStock: Stock = {
                id: response.data.id,
                amount: response.data.amount
              }
              if (amount > productStock.amount) {
                toast.error('Quantidade solicitada fora de estoque');
              }
              else {
                productInTheCart.amount = amount
                setCart([...cart])
              }
            })
          }
        })
      } catch {
        toast.error('Erro na alteração de quantidade do produto');
      }
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
