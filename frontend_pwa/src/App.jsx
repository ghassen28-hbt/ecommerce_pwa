import React from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Products from "./pages/Products.jsx";
import Contact from "./pages/Contact.jsx";
import NotFound from "./pages/NotFound.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Logopanier from "./pages/Logopanier.jsx";
import Panier from "./pages/Panier.jsx";
import UserMenu from "./pages/UserMenu.jsx";
import { useAuth } from "./pages/AuthContext";
import NotificationsMenu from "./pages/NotificationsMenu.jsx"
import FacturePage from "./pages/FacturePage";


function App() {
  const { user, logout } = useAuth();

  // extraire prénom + nom (simple)
  let firstName = "";
  let lastName = "";
  if (user?.fullName) {
    const parts = user.fullName.split(" ");
    firstName = parts[0];
    lastName = parts.slice(1).join(" ");
  }

  

  return (
    <div>
      {/* Menu simple */}
      <nav className="top-nav">
        <NavLink to="/" end className="nav-link" >Home</NavLink>
        <NavLink to="/products" className="nav-link" >Products</NavLink>
        <NavLink to="/contact"className="nav-link" >Contact</NavLink>
        <NavLink to="/panier" className="cart-icon"> <Logopanier size={22} /> </NavLink>
        <UserMenu />
                  {/* zone utilisateur */}
                  {user ? (
            <div className="user-pill" title={user.email}>
              <div className="user-avatar">
               
              </div>
              <div className="user-text">
                <span className="user-name">
                  {firstName} {lastName}
                </span>
                <button
                  className="user-logout"
                  type="button"
                  onClick={logout}
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <NavLink to="/login" className="icon-btn" title="Se connecter">
              👤
            </NavLink>
          )}
          <div className="nav-right">
            <NotificationsMenu />
            
            
          </div>
          
          




      </nav>

      {/* Zone qui change selon l'URL */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
       
        <Route path="/contact" element={<Contact />} />
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/panier" element={<Panier />} />
        <Route path="/cart" element={<Panier />} />
        <Route path="/facture/:orderId" element={<FacturePage />} />
        


      </Routes>
    </div>
  );
}

export default App;
