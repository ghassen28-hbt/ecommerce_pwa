import { useEffect, useMemo, useState } from "react";
import { getCategories, getLimitedProducts, getProductById } from "../api";
import { useCart } from "../pages/CartContext";


function Home() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const { addToCart } = useCart(); 
  // Chargement des données limitées depuis Django (seulement 6 produits et 4 catégories)
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [cats, prods] = await Promise.all([
          getCategories(),
          getLimitedProducts(6), // Limiter à 6 produits seulement
        ]);

        // Limiter aussi les catégories à 4
        setCategories(cats.slice(0, 4));
        setProducts(prods);
      } catch (err) {
        console.error("Erreur API:", err);
        setError("Impossible de charger les données depuis le serveur.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleProductClick = async (productId) => {
    try {
      setLoadingProduct(true);
      const product = await getProductById(productId);
      setSelectedProduct(product);
    } catch (err) {
      console.error("Erreur lors du chargement du produit:", err);
      setError("Impossible de charger les détails du produit.");
    } finally {
      setLoadingProduct(false);
    }
  };

  const addProductToCart = async(product) => {
    if (!product) {
      alert("pas du produit selctionné");
      return;}
  
    // Tu peux adapter ce que tu envoies, mais au minimum id / name / price
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      // tu peux ajouter d'autres champs si tu veux les afficher dans le panier
      // image_url: product.image_url,
      // category: product.category,
    });
    
    // Envoyer la notification uniquement si on est en ligne
    // En mode offline, on ignore silencieusement (c'est juste une notification, pas critique)
    if (navigator.onLine) {
      try {
        const token = localStorage.getItem("accessToken");
        console.log("TOKEN =>", token);
  
        await fetch("http://127.0.0.1:8000/api/notifications/notify-cart-add/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            product_id: product.id,
            product_name: product.name,
          }),
        });
      } catch (err) {
        // En cas d'erreur réseau, on ignore silencieusement (pas critique pour l'UX)
        // Le produit est déjà dans le panier, c'est l'essentiel
        console.warn("Notification panier non envoyée (offline ou erreur réseau):", err.message);
      }
    }
  
    // Optionnel : petit feedback utilisateur
    alert(`✅ ${product.name} ajouté au panier`);
  };


  // ----------- STATISTIQUES (calculées à partir des données limitées) ----------

  const stats = useMemo(() => {
    if (!products.length) {
      return {
        totalProducts: 0,
        totalCategories: categories.length,
        avgPrice: 0,
        featuredProduct: null,
      };
    }

    const prices = products.map((p) => Number(p.price) || 0);
    const sum = prices.reduce((acc, val) => acc + val, 0);
    const avg = sum / prices.length;

    // Produit vedette (le plus cher parmi ceux chargés)
    const maxPrice = Math.max(...prices);
    const featuredProduct = products.find(
      (p) => Number(p.price) === maxPrice
    );

    return {
      totalProducts: products.length,
      totalCategories: categories.length,
      avgPrice: avg,
      featuredProduct,
    };
  }, [products, categories]);

  // ------------------------ RENDU ------------------------

  if (loading) {
    return (
      <div className="main-content" style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center" 
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "50px",
            height: "50px",
            border: "4px solid rgba(99, 102, 241, 0.3)",
            borderTop: "4px solid #6366f1",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px"
          }}></div>
          <p className="muted">Chargement de la boutique...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-content" style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center" 
      }}>
        <div className="card" style={{ maxWidth: "500px", textAlign: "center" }}>
          <p style={{ color: "#fca5a5", fontSize: "1.1rem" }}>{error}</p>
        </div>
      </div>
    );
  }

  const { totalProducts, totalCategories, avgPrice, featuredProduct } = stats;

  return (
    <div className="main-content" style={{ padding: "32px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* ================= HERO SECTION MODERNE ================= */}
      <section style={{ 
        marginBottom: "60px",
        position: "relative",
        overflow: "hidden"
      }}>
        <div className="card" style={{
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(15, 23, 42, 0.9) 100%)",
          border: "1px solid rgba(99, 102, 241, 0.3)",
          padding: "48px 40px",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Effet de glow animé */}
          <div style={{
            position: "absolute",
            top: "-50%",
            right: "-20%",
            width: "400px",
            height: "400px",
            background: "radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)",
            borderRadius: "50%",
            animation: "pulse 4s ease-in-out infinite"
          }}></div>
          
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1.5fr 1fr", 
            gap: "40px",
            position: "relative",
            zIndex: 1
          }}>
            <div>
              <div style={{
                display: "inline-block",
                padding: "6px 14px",
                borderRadius: "20px",
                background: "rgba(99, 102, 241, 0.2)",
                color: "#a5b4fc",
                fontSize: "0.75rem",
                fontWeight: "600",
                marginBottom: "20px",
                textTransform: "uppercase",
                letterSpacing: "1px"
              }}>
                Pro Gaming Store
              </div>
              
              <h1 style={{ 
                fontSize: "3.5rem", 
                fontWeight: "800",
                lineHeight: "1.1",
                marginBottom: "20px",
                background: "linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}>
                Construis ton<br />
                <span style={{ color: "#6366f1" }}>setup ultime</span>
              </h1>
              
              <p style={{ 
                color: "var(--text-muted)", 
                fontSize: "1.1rem",
                lineHeight: "1.6",
                maxWidth: "520px",
                marginBottom: "32px"
              }}>
                Découvre notre sélection premium de composants gaming : 
                GPUs dernière génération, CPUs haute performance, PC complets 
                et périphériques professionnels.
              </p>

              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <button className="btn btn-primary" style={{
                  padding: "14px 28px",
                  fontSize: "1rem",
                  fontWeight: "600",
                  boxShadow: "0 8px 24px rgba(99, 102, 241, 0.4)"
                }}>
                   Explorer les produits
                </button>
                <button className="btn btn-ghost" style={{
                  padding: "14px 28px",
                  fontSize: "1rem"
                }}>
                  📂 Voir les catégories
                </button>
              </div>
            </div>

            {/* Produit vedette avec design moderne */}
            {featuredProduct && (
              <div style={{
                position: "relative",
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)",
                borderRadius: "24px",
                padding: "32px",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                boxShadow: "0 20px 60px rgba(99, 102, 241, 0.2)"
              }}>
                <div style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  padding: "4px 12px",
                  borderRadius: "12px",
                  background: "rgba(34, 197, 94, 0.2)",
                  color: "#bbf7d0",
                  fontSize: "0.7rem",
                  fontWeight: "600"
                }}>
                  VEDETTE
                </div>
                
                <div style={{ marginTop: "8px" }}>
                  <p style={{ 
                    color: "#a5b4fc", 
                    fontSize: "0.85rem",
                    marginBottom: "12px"
                  }}>
                    Produit du moment
                  </p>
                  <h3 style={{ 
                    fontSize: "1.5rem", 
                    fontWeight: "700",
                    marginBottom: "12px",
                    color: "#ffffff"
                  }}>
                    {featuredProduct.name}
                  </h3>
                  {featuredProduct.description && (
                    <p style={{ 
                      color: "var(--text-muted)", 
                      fontSize: "0.9rem",
                      marginBottom: "20px",
                      lineHeight: "1.5"
                    }}>
                      {featuredProduct.description.length > 100 
                        ? featuredProduct.description.substring(0, 100) + "..." 
                        : featuredProduct.description}
                    </p>
                  )}
                  
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "24px",
                    paddingTop: "20px",
                    borderTop: "1px solid rgba(148, 163, 184, 0.2)"
                  }}>
                    <div>
                      <div style={{ 
                        fontSize: "2rem", 
                        fontWeight: "800",
                        color: "#6366f1"
                      }}>
                        {featuredProduct.price}
                        <span style={{ fontSize: "1rem", color: "var(--text-muted)" }}> TND</span>
                      </div>
                    </div>
                    <div style={{
                      padding: "6px 14px",
                      borderRadius: "20px",
                      background: featuredProduct.stock > 0 
                        ? "rgba(34, 197, 94, 0.2)" 
                        : "rgba(248, 113, 113, 0.2)",
                      color: featuredProduct.stock > 0 ? "#bbf7d0" : "#fecaca",
                      fontSize: "0.8rem",
                      fontWeight: "600"
                    }}>
                      {featuredProduct.stock > 0 ? `✓ Stock: ${featuredProduct.stock}` : "Rupture"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ================= STATS MODERNES ================= */}
      <section style={{ marginBottom: "60px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px"
        }}>
          {[
            { label: "Produits disponibles", value: totalProducts, icon: "📦", color: "#6366f1" },
            { label: "Catégories", value: totalCategories, icon: "🏷️", color: "#0ea5e9" },
            { label: "Prix moyen", value: `${avgPrice.toFixed(0)} TND`, icon: "💰", color: "#10b981" },
            { label: "Qualité premium", value: "100%", icon: "⭐", color: "#f59e0b" }
          ].map((stat, idx) => (
            <div key={idx} className="card" style={{
              background: `linear-gradient(135deg, rgba(${stat.color === "#6366f1" ? "99, 102, 241" : stat.color === "#0ea5e9" ? "14, 165, 233" : stat.color === "#10b981" ? "16, 185, 129" : "245, 158, 11"}, 0.1) 0%, rgba(15, 23, 42, 0.9) 100%)`,
              border: `1px solid rgba(${stat.color === "#6366f1" ? "99, 102, 241" : stat.color === "#0ea5e9" ? "14, 165, 233" : stat.color === "#10b981" ? "16, 185, 129" : "245, 158, 11"}, 0.3)`,
              padding: "28px",
              textAlign: "center",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              cursor: "pointer"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = `0 12px 40px rgba(${stat.color === "#6366f1" ? "99, 102, 241" : stat.color === "#0ea5e9" ? "14, 165, 233" : stat.color === "#10b981" ? "16, 185, 129" : "245, 158, 11"}, 0.3)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 24px 50px rgba(15, 23, 42, 0.9)";
            }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>{stat.icon}</div>
              <div style={{ 
                fontSize: "2.2rem", 
                fontWeight: "800",
                color: stat.color,
                marginBottom: "8px"
              }}>
                {stat.value}
              </div>
              <p style={{ 
                color: "var(--text-muted)", 
                fontSize: "0.9rem",
                margin: 0
              }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= CATEGORIES MODERNES ================= */}
      {categories.length > 0 && (
        <section style={{ marginBottom: "60px" }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            marginBottom: "28px"
          }}>
            <h2 style={{ 
              fontSize: "2rem", 
              fontWeight: "700",
              background: "linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}>
              Catégories
            </h2>
            <span style={{
              padding: "6px 14px",
              borderRadius: "20px",
              background: "rgba(99, 102, 241, 0.2)",
              color: "#a5b4fc",
              fontSize: "0.85rem"
            }}>
              {categories.length} disponibles
            </span>
          </div>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px"
          }}>
            {categories.map((cat, idx) => (
              <div key={cat.id} className="card" style={{
                background: `linear-gradient(135deg, rgba(99, 102, 241, ${0.05 + idx * 0.05}) 0%, rgba(15, 23, 42, 0.9) 100%)`,
                border: "1px solid rgba(148, 163, 184, 0.2)",
                padding: "32px",
                minHeight: "160px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "all 0.3s ease",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px) scale(1.02)";
                e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.5)";
                e.currentTarget.style.boxShadow = "0 20px 60px rgba(99, 102, 241, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.2)";
                e.currentTarget.style.boxShadow = "0 24px 50px rgba(15, 23, 42, 0.9)";
              }}>
                <div style={{
                  position: "absolute",
                  top: "-30px",
                  right: "-30px",
                  width: "100px",
                  height: "100px",
                  background: `radial-gradient(circle, rgba(99, 102, 241, ${0.1 + idx * 0.1}) 0%, transparent 70%)`,
                  borderRadius: "50%"
                }}></div>
                
                <div>
                  <div style={{
                    fontSize: "2rem",
                    marginBottom: "12px"
                  }}>
                    {["🎮", "💻", "🖥️", "⌨️"][idx % 4]}
                  </div>
                  <h3 style={{ 
                    fontSize: "1.4rem", 
                    fontWeight: "700",
                    marginBottom: "8px",
                    color: "#ffffff"
                  }}>
                    {cat.name}
                  </h3>
                  <p style={{ 
                    color: "var(--text-muted)", 
                    fontSize: "0.9rem",
                    lineHeight: "1.5"
                  }}>
                    {cat.description || `Découvrez notre sélection ${cat.name.toLowerCase()}`}
                  </p>
                </div>
                
                <div style={{
                  marginTop: "16px",
                  paddingTop: "16px",
                  borderTop: "1px solid rgba(148, 163, 184, 0.2)"
                }}>
                  <span style={{
                    color: "#6366f1",
                    fontSize: "0.85rem",
                    fontWeight: "600"
                  }}>
                    Explorer →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ================= PRODUITS VEDETTES MODERNES ================= */}
      {products.length > 0 && (
        <section>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            marginBottom: "28px"
          }}>
            <h2 style={{ 
              fontSize: "2rem", 
              fontWeight: "700",
              background: "linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}>
              Produits vedettes
            </h2>
            <span style={{
              padding: "6px 14px",
              borderRadius: "20px",
              background: "rgba(99, 102, 241, 0.2)",
              color: "#a5b4fc",
              fontSize: "0.85rem"
            }}>
              {products.length} produits
            </span>
          </div>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px"
          }}>
            {products.map((prod, idx) => (
              
              <div key={prod.id} className="card" style={{
                background: "linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%)",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                padding: "28px",
                transition: "all 0.3s ease",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.5)";
                e.currentTarget.style.boxShadow = "0 24px 60px rgba(99, 102, 241, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.2)";
                e.currentTarget.style.boxShadow = "0 24px 50px rgba(15, 23, 42, 0.9)";
              }}>
                
                {/* Badge de position */}
                <div style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #6366f1, #0ea5e9)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontWeight: "700",
                  fontSize: "0.9rem",
                  boxShadow: "0 4px 12px rgba(99, 102, 241, 0.4)"
                }}>
                  #{idx + 1}
                </div>
                
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    fontSize: "1.3rem", 
                    fontWeight: "700",
                    marginBottom: "12px",
                    color: "#ffffff",
                    paddingRight: "50px"
                  }}>
                    {prod.name}
                  </h3>
                  
                  
                  {prod.description && (
                    <p style={{ 
                      color: "var(--text-muted)", 
                      fontSize: "0.9rem",
                      lineHeight: "1.6",
                      marginBottom: "20px",
                      minHeight: "60px"
                    }}>
                      {prod.description.length > 80 
                        ? prod.description.substring(0, 80) + "..." 
                        : prod.description}
                    </p>
                  )}
                  
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                    paddingTop: "16px",
                    borderTop: "1px solid rgba(148, 163, 184, 0.2)"
                  }}>
                    <div>
                      <div style={{ 
                        fontSize: "1.8rem", 
                        fontWeight: "800",
                        color: "#6366f1"
                      }}>
                        {prod.price}
                        <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}> TND</span>
                      </div>
                    </div>
                    <div style={{
                      padding: "6px 12px",
                      borderRadius: "16px",
                      background: prod.stock > 0 
                        ? "rgba(34, 197, 94, 0.2)" 
                        : "rgba(248, 113, 113, 0.2)",
                      color: prod.stock > 0 ? "#bbf7d0" : "#fecaca",
                      fontSize: "0.75rem",
                      fontWeight: "600"
                    }}>
                      {prod.stock > 0 ? `✓ ${prod.stock}` : "Rupture"}
                    </div>
                  </div>
                </div>
                
                <button
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    padding: "12px",
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    marginTop: "auto",
                  }}
                  disabled={prod.stock === 0}
                  onClick={() => addProductToCart(prod)}  
                >
                  {prod.stock === 0 ? "Rupture de stock" : "Ajouter au panier"}
              </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Animation CSS pour le spinner et pulse */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}

export default Home;
