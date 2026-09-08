import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'

const demoCategories = ['All', 'Men', 'Women', 'New Arrivals', 'Sale']

export default function App() {
  const [products, setProducts] = useState([])
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    setLoading(true)
    if (!supabase) { setProducts([]); setLoading(false); return }
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (!error) setProducts(data || [])
    setLoading(false)
  }

  const filtered = useMemo(() => {
    return products.filter(p => {
      const text = `${p.name || ''} ${p.description || ''}`.toLowerCase()
      const matchesSearch = text.includes(search.toLowerCase())
      const matchesCategory = category === 'All' || p.category_id === category || p.category === category
      return matchesSearch && matchesCategory
    })
  }, [products, search, category])

  function addToCart(product) {
    setCart(c => [...c, product])
  }

  function orderWhatsApp(product) {
    const message = `Hi IK CREATION, I want to order: ${product.name} - ₹${product.price}`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
  }

  return (
    <div className="app">
      <header className="header">
        <div className="logo">IK <span>CREATION</span></div>
        <nav>
          <a href="#shop">Shop</a>
          <a href="#new">New Arrivals</a>
          <a href="#about">About</a>
        </nav>
        <div className="cart">Cart ({cart.length})</div>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">IK CREATION</p>
          <h1>YOUR STYLE.<br/><em>YOUR STATEMENT.</em></h1>
          <p>Premium fashion designed for a confident, modern look.</p>
          <a className="button" href="#shop">Shop Collection</a>
        </div>
      </section>

      <section id="shop" className="shop">
        <div className="shopTop">
          <div>
            <p className="eyebrow">THE COLLECTION</p>
            <h2>Featured pieces</h2>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." />
        </div>
        <div className="chips">
          {demoCategories.map(c => <button className={category === c ? 'active' : ''} onClick={() => setCategory(c)} key={c}>{c}</button>)}
        </div>

        {loading ? <div className="empty">Loading collection...</div> :
          filtered.length === 0 ? <div className="empty">
            <h3>No products yet</h3>
            <p>Add products from the Supabase admin workflow once it is connected.</p>
          </div> :
          <div className="grid">
            {filtered.map(p => (
              <article className="card" key={p.id}>
                <div className="imageWrap">
                  {p.image_url ? <img src={p.image_url} alt={p.name}/> : <div className="placeholder">IK</div>}
                  {p.compare_at_price && <span className="badge">SALE</span>}
                </div>
                <div className="cardBody">
                  <h3>{p.name}</h3>
                  <p className="muted">{p.description || 'Premium IK CREATION piece.'}</p>
                  <div className="price">₹{Number(p.price || 0).toLocaleString('en-IN')}</div>
                  <div className="actions">
                    <button onClick={() => addToCart(p)}>Add to cart</button>
                    <button className="dark" onClick={() => orderWhatsApp(p)}>WhatsApp Order</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        }
      </section>

      <section id="new" className="feature">
        <p className="eyebrow">WHY IK CREATION</p>
        <h2>Clean design. Strong identity.</h2>
        <p>Built to grow from a simple storefront into a complete fashion commerce experience.</p>
      </section>

      <footer id="about">
        <strong>IK CREATION</strong>
        <span>© {new Date().getFullYear()} IK CREATION. All rights reserved.</span>
      </footer>
    </div>
  )
}
