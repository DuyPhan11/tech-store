const paths = {
  search: 'M15.5 15.5 21 21 M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
  cart: 'M2 3h3l3 12h10l3-9H6M9 20h1m7 0h1',
  overview: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  products: 'M3 7l9-5 9 5v10l-9 5-9-5zM3 7l9 5 9-5m-9 5v10',
  orders: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6m-6 5h6',
  inventory: 'M3 10l9-7 9 7v11H3zM8 21V11h8v10',
}

export function LayoutIcon({ name }: { name: keyof typeof paths }) {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={paths[name]} />
  </svg>
}
