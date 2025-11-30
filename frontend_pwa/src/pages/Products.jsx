import { useEffect, useState, useMemo } from "react";
import { getProducts, getCategories, getProductById } from "../api";
import { useCart } from "../pages/CartContext";

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();
  
  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  
  // État pour le produit sélectionné (modal de détails)
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(false);



  //ajouter panier  
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
    try {
      const token = localStorage.getItem("accessToken");
  
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
      console.error("Erreur lors de l'envoi de la notif panier:", err);
    }
  
    // Optionnel : petit feedback utilisateur
    alert(`✅ ${product.name} ajouté au panier`);
  };
  // Chargement des données
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [prods, cats] = await Promise.all([
          getProducts(),
          getCategories(),
        ]);
        setProducts(prods);
        setCategories(cats);
      } catch (err) {
        console.error("Erreur API:", err);
        setError("Impossible de charger les produits depuis le serveur.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filtrage des produits
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtre par catégorie
    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category === parseInt(selectedCategory));
    }

    // Filtre par disponibilité
    if (availabilityFilter === "in_stock") {
      filtered = filtered.filter((p) => p.stock > 0);
    } else if (availabilityFilter === "low_stock") {
      filtered = filtered.filter((p) => p.stock > 0 && p.stock <= 5);
    } else if (availabilityFilter === "out_of_stock") {
      filtered = filtered.filter((p) => p.stock === 0);
    }

    // Filtre par prix
    if (priceRange.min) {
      filtered = filtered.filter((p) => Number(p.price) >= Number(priceRange.min));
    }
    if (priceRange.max) {
      filtered = filtered.filter((p) => Number(p.price) <= Number(priceRange.max));
    }

    return filtered;
  }, [products, searchTerm, selectedCategory, availabilityFilter, priceRange]);

  // Charger les détails d'un produit
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

  // Réinitialiser les filtres
  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setAvailabilityFilter("all");
    setPriceRange({ min: "", max: "" });
  };

  // Obtenir le nom de la catégorie
  const getCategoryName = (categoryId) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : "Sans catégorie";
  };

  // Obtenir le statut du stock
  const getStockStatus = (stock) => {
    if (stock === 0) return { label: "Rupture de stock", class: "out", color: "#fca5a5" };
    if (stock <= 5) return { label: "Stock faible", class: "low", color: "#facc15" };
    return { label: "En stock", class: "ok", color: "#bbf7d0" };
  };

  if (loading) {
    return (
      <div className="products-page" style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        minHeight: "80vh"
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
          <p className="muted">Chargement des produits...</p>
        </div>
      </div>
    );
  }

  if (error && !products.length) {
    return (
      <div className="products-page" style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        minHeight: "80vh"
      }}>
        <div className="card" style={{ maxWidth: "500px", textAlign: "center" }}>
          <p style={{ color: "#fca5a5", fontSize: "1.1rem" }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="products-page" style={{ padding: "32px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header avec titre et recherche */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px"
        }}>
          <div>
            <h1 style={{ 
              fontSize: "2.5rem", 
              fontWeight: "800",
              marginBottom: "8px",
              background: "linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}>
              Catalogue Produits
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>
              {filteredProducts.length} produit{filteredProducts.length > 1 ? "s" : ""} disponible{filteredProducts.length > 1 ? "s" : ""}
            </p>
          </div>
          
          <div style={{ 
            display: "flex", 
            gap: "12px",
            flexWrap: "wrap"
          }}>
            <input
              type="text"
              className="field"
              placeholder="🔍 Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                minWidth: "250px",
                padding: "12px 16px",
                fontSize: "0.95rem"
              }}
            />
            {(searchTerm || selectedCategory || availabilityFilter !== "all" || priceRange.min || priceRange.max) && (
              <button
                className="btn btn-ghost"
                onClick={resetFilters}
                style={{ padding: "12px 20px" }}
              >
                ✕ Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "24px" }}>
        {/* Liste des produits */}
        <section>
          {filteredProducts.length === 0 ? (
            <div className="card" style={{ 
              textAlign: "center", 
              padding: "60px 32px",
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(15, 23, 42, 0.9) 100%)"
            }}>
              <div style={{ fontSize: "4rem", marginBottom: "16px" }}>🔍</div>
              <h3 style={{ fontSize: "1.5rem", marginBottom: "8px" }}>Aucun produit trouvé</h3>
              <p style={{ color: "var(--text-muted)" }}>
                Essayez de modifier vos critères de recherche ou vos filtres.
              </p>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "24px"
            }}>
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.stock);
                const categoryName = getCategoryName(product.category);
                
                return (
                  <div
                    key={product.id}
                    className="card"
                    style={{
                      background: "linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%)",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      padding: "24px",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                      overflow: "hidden"
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
                    }}
                    onClick={() => handleProductClick(product.id)}
                  >
                    {/* Badge catégorie */}
                    <div style={{
                      position: "absolute",
                      top: "16px",
                      right: "16px",
                      padding: "4px 12px",
                      borderRadius: "12px",
                      background: "rgba(99, 102, 241, 0.2)",
                      color: "#a5b4fc",
                      fontSize: "0.75rem",
                      fontWeight: "600"
                    }}>
                      {categoryName}
                    </div>

                    {/* Image du produit */}
                    {product.image_url ? (
                      <div style={{
                        width: "100%",
                        height: "200px",
                        borderRadius: "16px",
                        overflow: "hidden",
                        marginBottom: "16px",
                        background: "rgba(15, 23, 42, 0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <img
                          src={product.image_url}
                          alt={product.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover"
                          }}
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.parentElement.innerHTML = '<div style="color: var(--text-muted); font-size: 3rem;">📦</div>';
                          }}
                        />
                      </div>
                    ) : (
                      <div style={{
                        width: "100%",
                        height: "200px",
                        borderRadius: "16px",
                        background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(15, 23, 42, 0.5) 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "16px",
                        fontSize: "4rem"
                      }}>
                        📦
                      </div>
                    )}

                    {/* Informations du produit */}
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: "1.3rem",
                        fontWeight: "700",
                        marginBottom: "8px",
                        color: "#ffffff",
                        paddingRight: "80px"
                      }}>
                        {product.name}
                      </h3>

                      {product.description && (
                        <p style={{
                          color: "var(--text-muted)",
                          fontSize: "0.9rem",
                          lineHeight: "1.6",
                          marginBottom: "16px",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden"
                        }}>
                          {product.description}
                        </p>
                      )}

                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "auto",
                        paddingTop: "16px",
                        borderTop: "1px solid rgba(148, 163, 184, 0.2)"
                      }}>
                        <div>
                          <div style={{
                            fontSize: "1.8rem",
                            fontWeight: "800",
                            color: "#6366f1"
                          }}>
                            {product.price}
                            <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}> TND</span>
                          </div>
                        </div>
                        <div style={{
                          padding: "6px 12px",
                          borderRadius: "16px",
                          background: stockStatus.class === "ok" 
                            ? "rgba(34, 197, 94, 0.2)" 
                            : stockStatus.class === "low"
                            ? "rgba(234, 179, 8, 0.18)"
                            : "rgba(248, 113, 113, 0.2)",
                          color: stockStatus.color,
                          fontSize: "0.75rem",
                          fontWeight: "600"
                        }}>
                          {stockStatus.label}
                        </div>
                      </div>
                    </div>

                    {/* Bouton voir détails */}
                    <button
                      className="btn btn-primary"
                      style={{
                        width: "100%",
                        marginTop: "16px",
                        padding: "12px",
                        fontSize: "0.95rem",
                        fontWeight: "600"
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProductClick(product.id);
                      }}
                    >
                       Voir les détails
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Filtres */}
        <section className="card" style={{
          background: "linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%)",
          border: "1px solid rgba(148, 163, 184, 0.2)",
          padding: "24px",
          height: "fit-content",
          position: "sticky",
          top: "100px"
        }}>
          <h2 style={{
            fontSize: "1.5rem",
            fontWeight: "700",
            marginBottom: "8px"
          }}>
            🔍 Filtres
          </h2>
          <p style={{
            color: "var(--text-muted)",
            fontSize: "0.9rem",
            marginBottom: "24px"
          }}>
            Affinez votre recherche
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Filtre par catégorie */}
            <div className="form-group">
              <label style={{
                fontSize: "0.85rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--text-muted)",
                marginBottom: "8px",
                display: "block"
              }}>
                Catégorie
              </label>
              <select
                className="field"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: "0.9rem"
                }}
              >
                <option value="">Toutes les catégories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre par disponibilité */}
            <div className="form-group">
              <label style={{
                fontSize: "0.85rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--text-muted)",
                marginBottom: "8px",
                display: "block"
              }}>
                Disponibilité
              </label>
              <select
                className="field"
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: "0.9rem"
                }}
              >
                <option value="all">Tous les produits</option>
                <option value="in_stock">En stock</option>
                <option value="low_stock">Stock faible</option>
                <option value="out_of_stock">Rupture de stock</option>
              </select>
            </div>

            {/* Filtre par prix */}
            <div className="form-group">
              <label style={{
                fontSize: "0.85rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--text-muted)",
                marginBottom: "8px",
                display: "block"
              }}>
                Prix (TND)
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="number"
                  className="field"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    fontSize: "0.9rem"
                  }}
                /> 
                <input
                  type="number"
                  className="field"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    fontSize: "0.9rem"
                  }}
                />
              </div>
            </div>

            {/* Statistiques */}
            <div style={{
              padding: "16px",
              borderRadius: "12px",
              background: "rgba(99, 102, 241, 0.1)",
              border: "1px solid rgba(99, 102, 241, 0.2)"
            }}>
              <p style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                marginBottom: "8px"
              }}>
                Résultats
              </p>
              <div style={{
                fontSize: "1.5rem",
                fontWeight: "700",
                color: "#6366f1"
              }}>
                {filteredProducts.length}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Modal de détails du produit */}
      {selectedProduct && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(8px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            animation: "fadeIn 0.3s ease"
          }}
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="card"
            style={{
              maxWidth: "800px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              position: "relative",
              animation: "slideUp 0.3s ease"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {loadingProduct ? (
              <div style={{ textAlign: "center", padding: "60px" }}>
                <div style={{
                  width: "50px",
                  height: "50px",
                  border: "4px solid rgba(99, 102, 241, 0.3)",
                  borderTop: "4px solid #6366f1",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto 16px"
                }}></div>
                <p className="muted">Chargement...</p>
              </div>
            ) : (
              <>
                {/* Bouton fermer */}
                <button
                  onClick={() => setSelectedProduct(null)}
                  style={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    border: "none",
                    background: "rgba(248, 113, 113, 0.2)",
                    color: "#fecaca",
                    fontSize: "1.2rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(248, 113, 113, 0.4)";
                    e.currentTarget.style.transform = "scale(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(248, 113, 113, 0.2)";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  ✕
                </button>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
                  {/* Image */}
                  <div>
                    {selectedProduct.image_url ? (
                      <div style={{
                        width: "100%",
                        borderRadius: "20px",
                        overflow: "hidden",
                        background: "rgba(15, 23, 42, 0.5)",
                        marginBottom: "20px"
                      }}>
                        <img
                          src={selectedProduct.image_url}
                          alt={selectedProduct.name}
                          style={{
                            width: "100%",
                            height: "auto",
                            display: "block"
                          }}
                        />
                      </div>
                    ) : (
                      <div style={{
                        width: "100%",
                        aspectRatio: "1",
                        borderRadius: "20px",
                        background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(15, 23, 42, 0.5) 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "8rem",
                        marginBottom: "20px"
                      }}>
                        📦
                      </div>
                    )}

                    {/* Badge catégorie */}
                    <div style={{
                      padding: "8px 16px",
                      borderRadius: "20px",
                      background: "rgba(99, 102, 241, 0.2)",
                      color: "#a5b4fc",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      display: "inline-block",
                      marginBottom: "16px"
                    }}>
                      {getCategoryName(selectedProduct.category)}
                    </div>
                  </div>

                  {/* Détails */}
                  <div>
                    <h2 style={{
                      fontSize: "2rem",
                      fontWeight: "800",
                      marginBottom: "16px",
                      color: "#ffffff"
                    }}>
                      {selectedProduct.name}
                    </h2>

                    {selectedProduct.description && (
                      <p style={{
                        color: "var(--text-muted)",
                        fontSize: "1rem",
                        lineHeight: "1.8",
                        marginBottom: "24px"
                      }}>
                        {selectedProduct.description}
                      </p>
                    )}

                    <div style={{
                      padding: "20px",
                      borderRadius: "16px",
                      background: "rgba(99, 102, 241, 0.1)",
                      border: "1px solid rgba(99, 102, 241, 0.2)",
                      marginBottom: "24px"
                    }}>
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "16px"
                      }}>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Prix</span>
                        <div style={{
                          fontSize: "2.5rem",
                          fontWeight: "800",
                          color: "#6366f1"
                        }}>
                          {selectedProduct.price}
                          <span style={{ fontSize: "1rem", color: "var(--text-muted)" }}> TND</span>
                        </div>
                      </div>

                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Stock</span>
                        <div style={{
                          padding: "8px 16px",
                          borderRadius: "16px",
                          background: getStockStatus(selectedProduct.stock).class === "ok"
                            ? "rgba(34, 197, 94, 0.2)"
                            : getStockStatus(selectedProduct.stock).class === "low"
                            ? "rgba(234, 179, 8, 0.18)"
                            : "rgba(248, 113, 113, 0.2)",
                          color: getStockStatus(selectedProduct.stock).color,
                          fontSize: "0.9rem",
                          fontWeight: "600"
                        }}>
                          {getStockStatus(selectedProduct.stock).label} ({selectedProduct.stock} unités)
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "12px" }}>
                    <button
                            className="btn btn-primary"
                            style={{
                              flex: 1,
                              padding: "14px",
                              fontSize: "1rem",
                              fontWeight: "600"
                            }}
                            disabled={selectedProduct.stock === 0}
                            onClick={() => addProductToCart(selectedProduct)}   // ✅ ici
                          >
                            Ajouter au panier
                      </button>
                      <button
                        className="btn btn-ghost"
                        style={{
                          padding: "14px 24px",
                          fontSize: "1rem"
                        }}
                        onClick={() => setSelectedProduct(null)}
                      >
                        Fermer
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Styles pour les animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default Products;
