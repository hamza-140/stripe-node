import {create} from 'zustand'
import { persist } from 'zustand/middleware'

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      customer: { name: '', email: '', phone: '', address: '' },
      addItem: (product) => {
        const items = get().items.slice()
        const idx = items.findIndex((i) => i.id === product.id)
        if (idx > -1) {
          items[idx].quantity = (items[idx].quantity || 1) + 1
        } else {
          items.push({ ...product, quantity: 1 })
        }
        set({ items })
      },
      removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      updateQty: (id, qty) => {
        const items = get().items.map((i) => (i.id === id ? { ...i, quantity: qty } : i))
        set({ items })
      },
      clearCart: () => set({ items: [] }),
      setCustomer: (c) => set({ customer: { ...get().customer, ...c } }),
      getTotal: () => get().items.reduce((s, it) => s + (it.price || 0) * (it.quantity || 1), 0),
      itemCount: () => get().items.reduce((s, it) => s + (it.quantity || 1), 0)
    }),
    {
      name: 'payment-cart',
      getStorage: () => sessionStorage
    }
  )
)

export default useCartStore
