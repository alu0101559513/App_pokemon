import React, { useEffect, useState, useRef } from "react";
import Header from "../components/Header/Header";
import Footer from "@/components/Footer";
import { useDispatch, useSelector } from "react-redux";
import { fetchWishlist } from "../features/whislist/whislistSlice";
import { fetchUserCollection } from "../features/collection/collectionSlice";
import { RootState, AppDispatch } from "../store/store";
import { authService } from "../services/authService";
import { useTranslation } from "react-i18next";
import "../styles/profile.css";

const DEFAULT_AVATAR = "/icono.png";
const ITEMS_PER_PAGE = 8;

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();

  const dispatch = useDispatch<AppDispatch>();
  const [user, setUser] = useState<any>(authService.getUser());
  const wishlist = useSelector((s: RootState) => s.wishlist.cards);
  const collection = useSelector((s: RootState) => s.collection.cards);

  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    if (user?.username) {
      dispatch(fetchWishlist(user.username));
      dispatch(fetchUserCollection(user.username));
    }
  }, [dispatch, user?.username]);

  if (!user) {
    return (
      <div className="loading-container">
        <p className="loading-text">{t("profile.loading")}</p>
      </div>
    );
  }

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result as string;

      try {
        const updatedUser = await authService.updateProfileImage(user.username, base64Image);
        setUser(updatedUser);
        authService.saveUser(updatedUser);
        showToast("success", t("profile.photoUpdated"));
      } catch {
        showToast("error", t("profile.errorUpdatingPhoto"));
      }
    };

    reader.readAsDataURL(file);
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    username: user.username,
    email: user.email,
  });

  const saveProfile = async () => {
    try {
      const updatedUser = await authService.updateProfile(user.username, editData);
      setUser(updatedUser);
      authService.saveUser(updatedUser);
      setIsEditing(false);
      showToast("success", t("profile.saved"));
    } catch (err: any) {
      if (err?.message === "USERNAME_EXISTS") return showToast("error", t("profile.usernameExists"));
      if (err?.message === "EMAIL_EXISTS") return showToast("error", t("profile.emailExists"));
      showToast("error", t("profile.saveError"));
    }
  };

  const tradeList = collection.filter((c) => c.forTrade);

  const [wishlistPage, setWishlistPage] = useState(1);
  const [tradePage, setTradePage] = useState(1);

  const wishlistTotalPages = Math.ceil(wishlist.length / ITEMS_PER_PAGE);
  const tradeTotalPages = Math.ceil(tradeList.length / ITEMS_PER_PAGE);

  const wishlistPaginated = wishlist.slice(
    (wishlistPage - 1) * ITEMS_PER_PAGE,
    wishlistPage * ITEMS_PER_PAGE
  );

  const tradePaginated = tradeList.slice(
    (tradePage - 1) * ITEMS_PER_PAGE,
    tradePage * ITEMS_PER_PAGE
  );

  return (
    <div className="profile-page">
      <Header />

      {toast && (
        <div className={`toast ${toast.type === "success" ? "toast-success" : "toast-error"}`}>
          {toast.message}
        </div>
      )}

      <main className="profile-main">
        <h1 className="profile-title">{t("profile.title")}</h1>

        <div className="profile-content">
          <div className="profile-photo-section">
            <img src={user.profileImage || DEFAULT_AVATAR} className="profile-photo" />

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handlePhotoUpload}
            />

            <div className="profile-photo-buttons">
              <button className="profile-btn" onClick={() => fileInputRef.current?.click()}>
                {t("profile.changePhoto")}
              </button>

              <button
                className="profile-btn profile-btn-red"
                onClick={async () => {
                  if (!confirm(t("profile.confirmDeletePhoto"))) return;

                  try {
                    const updatedUser = await authService.deleteProfileImage(user.username);
                    setUser(updatedUser);
                    showToast("success", t("profile.photoDeleted"));
                  } catch {
                    showToast("error", t("profile.errorDeletePhoto"));
                  }
                }}
              >
                {t("profile.deletePhoto")}
              </button>
            </div>
          </div>

          <div className="profile-info-card">
            <p><strong>{t("profile.username")}:</strong> {user.username}</p>
            <p><strong>{t("profile.email")}:</strong> {user.email}</p>

            <div className="profile-info-buttons">
              <button className="profile-btn" onClick={() => setIsEditing(true)}>
                {t("profile.edit")}
              </button>

              <button
                className="profile-btn-red profile-delete-account"
                onClick={async () => {
                  if (!confirm(t("profile.confirmDeleteAccount"))) return;

                  try {
                    await authService.deleteAccount(user.username);
                    showToast("success", t("profile.accountDeleted"));
                    setTimeout(() => (window.location.href = "/"), 1200);
                  } catch {
                    showToast("error", t("profile.errorDeleteAccount"));
                  }
                }}
              >
                {t("profile.deleteAccount")}
              </button>
            </div>
          </div>
        </div>

        <div className="profile-lists">
          <section className="profile-section">
            <h2 className="section-title">{t("profile.wishlist")}</h2>

            {wishlist.length === 0 && (
              <p className="section-empty">{t("profile.noWishlist")}</p>
            )}

            {wishlist.length > 0 && (
              <>
                <div className="cards-grid-two">
                  {wishlistPaginated.map((card) => (
                    <div key={card.id} className="card-item-yellow">
                      <img src={card.image} className="card-image" />
                      <p className="card-title">{card.name}</p>
                    </div>
                  ))}
                </div>

                <div className="pagination-controls">
                  <button
                    disabled={wishlistPage <= 1}
                    onClick={() => setWishlistPage((p) => p - 1)}
                  >
                    {t("profile.prev")}
                  </button>
                  <span>{wishlistPage} / {wishlistTotalPages}</span>
                  <button
                    disabled={wishlistPage >= wishlistTotalPages}
                    onClick={() => setWishlistPage((p) => p + 1)}
                  >
                    {t("profile.next")}
                  </button>
                </div>
              </>
            )}
          </section>

          <section className="profile-section">
            <h2 className="section-title">{t("profile.tradeList")}</h2>

            {tradeList.length === 0 && (
              <p className="section-empty">{t("profile.noTrade")}</p>
            )}

            {tradeList.length > 0 && (
              <>
                <div className="cards-grid-two">
                  {tradePaginated.map((card) => (
                    <div key={card.id} className="card-item-yellow">
                      <img src={card.image} className="card-image" />
                      <p className="card-title">{card.name}</p>
                    </div>
                  ))}
                </div>

                <div className="pagination-controls">
                  <button
                    disabled={tradePage <= 1}
                    onClick={() => setTradePage((p) => p - 1)}
                  >
                    {t("profile.prev")}
                  </button>
                  <span>{tradePage} / {tradeTotalPages}</span>
                  <button
                    disabled={tradePage >= tradeTotalPages}
                    onClick={() => setTradePage((p) => p + 1)}
                  >
                    {t("profile.next")}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      <footer className="profile-footer">
        <Footer />
      </footer>

      {isEditing && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2 className="modal-title">{t("profile.editProfile")}</h2>

            <label className="modal-label">{t("profile.username")}</label>
            <input
              className="modal-input"
              value={editData.username}
              onChange={(e) => setEditData({ ...editData, username: e.target.value })}
            />

            <label className="modal-label">{t("profile.email")}</label>
            <input
              className="modal-input"
              value={editData.email}
              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
            />

            <div className="modal-buttons">
              <button className="profile-btn bg-gray-400" onClick={() => setIsEditing(false)}>
                {t("profile.cancel")}
              </button>

              <button className="profile-btn" onClick={saveProfile}>
                {t("profile.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
