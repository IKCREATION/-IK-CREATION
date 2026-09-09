import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'

const categories = ['All', 'Men', 'Women', 'New Arrivals', 'Sale']

export default function App() {
  const [session, setSession] = useState(null)
  const [products, setProducts] = useState([])
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [adminMode, setAdminMode] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [message, setMessage] = useState('')

  const [form, setForm] = useState({
    name: '',
    price: '',
    description: '',
    image_url: '',
    category: 'Men',
    stock: '',
    is_active: true
  })

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    loadProducts()

    return () => subscription.unsubscribe()
  }, [])

  async function loadProducts() {
    setLoading(true)

    if (!supabase) {
      setProducts([])
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (!error) setProducts(data || [])
    setLoading(false)
  }

  async function login(e) {
    e.preventDefault()
    setLoginLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Login successful')
      setAdminMode(true)
    }

    setLoginLoading(false)
  }

  async function logout() {
    await supabase.auth.signOut()
    setAdminMode(false)
  }

  async function addProduct(e) {
    e.preventDefault()
    setMessage('')

    if (!session) {
      setMessage('Please login first.')
      return
    }

    const { error } = await supabase.from('products').insert({
      name: form.name,
      price: Number(form.price),
      description: form.description || null,
      image_url: form.image_url || null,
      category: form.category,
      stock: Number(form.stock || 0),
      is_active: form.is_active
    })

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Product added successfully ✅')

    setForm({
      name: '',
      price: '',
      description: '',
      image_url: '',
      category: 'Men',
      stock: '',
      is_active: true
    })

    loadProducts()
  }

  async function deleteProduct(id) {
    if (!confirm('Delete this product?')) return

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Product deleted ✅')
    loadProducts()
  }

  const filtered = useMemo(() => {
    return products.filter(p => {
      const text =
        `${p.name || ''} ${p.description || ''}`.toLowerCase()

      const matchesSearch = text.includes(search.toLowerCase())

      const matchesCategory =
        category === 'All' ||
        p.category === category ||
        p.category_id === category

      return matchesSearch && matchesCategory
    })
  }, [products, search, category])

  function addToCart(product) {
    setCart(c => [...c, product])
  }

  function orderWhatsApp(product) {
    const message =
      `Hi IK CREATION, I want to order: ${product.name} - ₹${product.price}`

    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      '_blank'
    )
  }

  if (adminMode) {
    return (
      <div className="app">
        <header className="header">
          <div className="logo">
            IK <span>CREATION</span>
          </div>

          <button className="dark" onClick={logout}>
            Logout
          </button>
        </header>

        <main className="shop">
          <p className="eyebrow">PRIVATE ADMIN</p>
          <h1>Admin Dashboard</h1>

          <form onSubmit={addProduct} className="adminForm">
            <h2>Add Product</h2>

            <input
              required
              placeholder="Product name"
              value={form.name}
              onChange={e =>
                setForm({ ...form, name: e.target.value })
              }
            />

            <input
              required
              type="number"
              placeholder="Price ₹"
              value={form.price}
              onChange={e =>
                setForm({ ...form, price: e.target.value })
              }
            />

            <input
              type="number"
              placeholder="Stock"
              value={form.stock}
              onChange={e =>
                setForm({ ...form, stock: e.target.value })
              }
            />

            <input
              placeholder="Product image URL"
              value={form.image_url}
              onChange={e =>
                setForm({ ...form, image_url: e.target.value })
              }
            />

            <select
              value={form.category}
              onChange={e =>
                setForm({ ...form, category: e.target.value })
              }
            >
              <option>Men</option>
              <option>Women</option>
              <option>New Arrivals</option>
              <option>Sale</option>
            </select>

            <textarea
              placeholder="Product description"
              value={form.description}
              onChange={e =>
                setForm({ ...form, description: e.target.value })
              }
            />

            <button className="button" type="submit">
              Add Product
            </button>

            {message && <p>{message}</p>}
          </form>

          <h2>Products</h2>

          <div className="grid">
            {products.map(product => (
              <article className="card" key={product.id}>
                <div className="imageWrap">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} />
                  ) : (
                    <div className="placeholder">IK</div>
                  )}
                </div>

                <div className="cardBody">
                  <h3>{product.name}</h3>
                  <div className="price">
                    ₹{Number(product.price || 0).toLocaleString('en-IN')}
                  </div>

                  <button
                    className="dark"
                    onClick={() => deleteProduct(product.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          IK <span>CREATION</span>
        </div>

        <nav>
          <a href="#shop">Shop</a>
          <a href="#new">New Arrivals</a>
          <a href="#about">About</a>
        </nav>

        <div className="cart">
          Cart ({cart.length})
        </div>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">IK CREATION</p>

          <h1>
            YOUR STYLE.
            <br />
            <em>YOUR STATEMENT.</em>
          </h1>

          <p>
            Premium fashion designed for a confident, modern look.
          </p>

          <a className="button" href="#shop">
            Shop Collection
          </a>
        </div>
      </section>

      <section id="shop" className="shop">
        <div className="shopTop">
          <div>
            <p className="eyebrow">THE COLLECTION</p>
            <h2>Featured pieces</h2>
          </div>

          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
          />
        </div>

        <div className="chips">
          {categories.map(c => (
            <button
              className={category === c ? 'active' : ''}
              onClick={() => setCategory(c)}
              key={c}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="empty">
            Loading collection...
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <h3>No products yet</h3>
            <p>Admin login karke products add karo.</p>
          </div>
        ) : (
          <div className="grid">
            {filtered.map(p => (
              <article className="card" key={p.id}>
                <div className="imageWrap">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} />
                  ) : (
                    <div className="placeholder">IK</div>
                  )}
                </div>

                <div className="cardBody">
                  <h3>{p.name}</h3>

                  <p className="muted">
                    {p.description ||
                      'Premium IK CREATION piece.'}
                  </p>

                  <div className="price">
                    ₹{Number(p.price || 0).toLocaleString('en-IN')}
                  </div>

                  <div className="actions">
                    <button onClick={() => addToCart(p)}>
                      Add to cart
                    </button>

                    <button
                      className="dark"
                      onClick={() => orderWhatsApp(p)}
                    >
                      WhatsApp Order
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section id="new" className="feature">
        <p className="eyebrow">WHY IK CREATION</p>
        <h2>Clean design. Strong identity.</h2>
        <p>
          Built to grow from a simple storefront into a complete
          fashion commerce experience.
        </p>
      </section>

      <footer id="about">
        <strong>IK CREATION</strong>
        <span>
          © {new Date().getFullYear()} IK CREATION. All rights reserved.
        </span>
      </footer>

      <button
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          borderRadius: 999,
          padding: '10px 14px'
        }}
        onClick={() => setAdminMode(true)}
      >
        Admin
      </button>

      {!session && adminMode && (
        <div className="adminLogin">
          <form onSubmit={login}>
            <h2>Admin Login</h2>

            <input
              type="email"
              placeholder="Admin email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />

            <button className="button" type="submit">
              {loginLoading ? 'Logging in...' : 'Login'}
            </button>

            {message && <p>{message}</p>}

            <button
              type="button"
              onClick={() => setAdminMode(false)}
            >
              Cancel
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
