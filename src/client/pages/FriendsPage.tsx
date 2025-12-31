import React, { useEffect, useRef, useState, useCallback } from 'react';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer';
import { initSocket } from '../socket';
import { authService } from '../services/authService';
import { authenticatedFetch, getAuthHeaders } from '../utils/fetchHelpers';
import '../styles/friends.css';
import { useTranslation } from 'react-i18next';

interface User {
  id: string;
  username: string;
  profileImage?: string;
}

interface Friend {
  _id: string;
  username: string;
  profileImage?: string;
}

interface Request {
  userId: string;
  username: string;
  profileImage?: string;
}

interface SentRequest {
  _id: string;
  username: string;
  profileImage?: string;
}

interface Message {
  from: string;
  to: string;
  text: string;
  createdAt?: string;
}

const FriendsPage: React.FC = () => {
  const { t } = useTranslation();
  const user = authService.getUser() as User | null;
  if (!user) return null;

  const [view, setView] = useState<'chat' | 'requests'>('chat');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [received, setReceived] = useState<Request[]>([]);
  const [sent, setSent] = useState<SentRequest[]>([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeFriend, setActiveFriend] = useState<Friend | null>(null);
  const [socket, setSocket] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    action?: () => void;
  }>({
    visible: false,
    message: '',
  });

  const loadAll = useCallback(async () => {
    try {
      const [f, r, s] = await Promise.all([
        authenticatedFetch(`/friends/user/${user.id}`).then((r) => r.json()),
        authenticatedFetch(`/friends/requests/user/${user.id}`).then((r) =>
          r.json()
        ),
        authenticatedFetch(`/friends/requests/sent/${user.id}`).then((r) =>
          r.json()
        ),
      ]);

      setFriends(f.friends || f.data?.friends || []);
      setReceived(r.requests || r.data?.requests || []);
      setSent(s.sent || s.data?.sent || []);
    } catch (err) {
      console.error('Error loading friends:', err);
      setToast({
        visible: true,
        message: 'Error al cargar solicitudes',
      });
    }
  }, [user.id]);

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    const s = initSocket();
    if (!s) return;

    setSocket(s);

    const onMessage = (msg: Message) => {
      if (
        activeFriend &&
        (msg.from === activeFriend._id || msg.to === activeFriend._id)
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    const onTyping = ({ from }: any) => {
      if (activeFriend && from === activeFriend._id) {
        setIsTyping(true);
      }
    };

    const onStopTyping = ({ from }: any) => {
      if (activeFriend && from === activeFriend._id) {
        setIsTyping(false);
      }
    };

    s.on('privateMessage', onMessage);
    s.on('typing', onTyping);
    s.on('stopTyping', onStopTyping);

    return () => {
      s.off('privateMessage', onMessage);
      s.off('typing', onTyping);
      s.off('stopTyping', onStopTyping);
    };
  }, [activeFriend?._id]);

  useEffect(() => {
    const s = initSocket();
    if (!s) return;

    // Estos listeners se registran una sola vez y escuchan independientemente
    const onFriendRequestReceived = () => {
      loadAll();
    };

    const onFriendRequestAccepted = () => {
      loadAll();
    };

    const onFriendRequestRejected = () => {
      loadAll();
    };

    s.on('friendRequestReceived', onFriendRequestReceived);
    s.on('friendRequestAccepted', onFriendRequestAccepted);
    s.on('friendRequestRejected', onFriendRequestRejected);

    return () => {
      s.off('friendRequestReceived', onFriendRequestReceived);
      s.off('friendRequestAccepted', onFriendRequestAccepted);
      s.off('friendRequestRejected', onFriendRequestRejected);
    };
  }, [loadAll]);

  const openChat = async (friend: Friend) => {
    setActiveFriend(friend);
    setIsTyping(false);

    const r = await authenticatedFetch(`/friends/messages/${friend._id}`);
    const data = await r.json();
    setMessages(data.messages || []);
  };

  const sendMessage = () => {
    if (!socket || !activeFriend || !messageInput.trim()) return;

    socket.emit('privateMessage', {
      from: user.id,
      to: activeFriend._id,
      text: messageInput,
    });

    socket.emit('stopTyping', { to: activeFriend._id });
    setMessageInput('');
  };

  const accept = async (id: string) => {
    try {
      const res = await authenticatedFetch(`/friends/accept/${id}`, {
        method: 'POST',
      });

      if (!res.ok) {
        const errorData = await res.json();
        setToast({
          visible: true,
          message: errorData.error || 'Error al aceptar solicitud',
        });
        return;
      }

      loadAll();
    } catch (err) {
      setToast({
        visible: true,
        message: 'Error en la conexión',
      });
    }
  };

  const reject = async (id: string) => {
    try {
      const res = await authenticatedFetch(`/friends/reject/${id}`, {
        method: 'POST',
      });

      if (!res.ok) {
        const errorData = await res.json();
        setToast({
          visible: true,
          message: errorData.error || 'Error al rechazar solicitud',
        });
        return;
      }

      loadAll();
    } catch (err) {
      setToast({
        visible: true,
        message: 'Error en la conexión',
      });
    }
  };

  const cancel = async (id: string) => {
    try {
      const res = await authenticatedFetch(`/friends/requests/cancel/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        setToast({
          visible: true,
          message: errorData.error || 'Error al cancelar solicitud',
        });
        return;
      }

      loadAll();
    } catch (err) {
      setToast({
        visible: true,
        message: 'Error en la conexión',
      });
    }
  };

  const sendFriendRequest = async (id: string) => {
    try {
      const res = await authenticatedFetch(`/friends/request/${id}`, {
        method: 'POST',
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        setToast({
          visible: true,
          message: errorData.error || 'Error al enviar solicitud',
        });
        return;
      }

      setToast({
        visible: true,
        message: 'Solicitud enviada',
      });
      loadAll();
    } catch (err) {
      setToast({
        visible: true,
        message: 'Error en la conexión',
      });
    }
  };

  const showConfirmToast = (message: string, onConfirm: () => void) => {
    setToast({
      visible: true,
      message: t('friends.confirmRemove', { username: message }),
      action: onConfirm,
    });
  };

  const removeFriend = (friend: Friend) => {
    showConfirmToast(friend.username, async () => {
      await authenticatedFetch(`/friends/remove/${friend._id}`, {
        method: 'DELETE',
      });

      setToast({ visible: false, message: '' });
      setActiveFriend(null);
      setMessages([]);
      loadAll();
    });
  };

  const handleSearch = async () => {
    if (!search.trim()) return;

    const r = await authenticatedFetch(`/users/search/${search}`);
    setSearchResults(await r.json());
  };

  return (
    <div className="friendsPage">
      <Header />

      <main className="friendsMain">
        <h1 className="friendsTitle">{t('friends.title')}</h1>

        <div className="friendsTabs">
          <button
            className={view === 'chat' ? 'isActive' : ''}
            onClick={() => setView('chat')}
          >
            {t('friends.myFriends')}
          </button>
          <button
            className={view === 'requests' ? 'isActive' : ''}
            onClick={() => setView('requests')}
          >
            {t('friends.requests')}
          </button>
        </div>

        {view === 'requests' && (
          <div className="trade-requests-container">
            <div className="trade-requests-main">
              <div className="trade-requests-columns">
                <section className="trade-panel">
                  <h3 className="trade-panel-title">
                    {t('friends.searchUsers')}
                  </h3>

                  <input
                    className="discover-search-input"
                    placeholder={t('friends.searchPlaceholder')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />

                  <button className="btn-blue-small" onClick={handleSearch}>
                    {t('friends.search')}
                  </button>

                  {searchResults.length === 0 ? null : (
                    <div className="trade-list">
                      {searchResults.map((u) => (
                        <div key={u._id} className="friendUserRow">
                          <div className="friendUserInfo">
                            <img
                              src={u.profileImage || '/icono.png'}
                              alt={u.username}
                              className="friendUserAvatar"
                            />
                            <span className="friendUserName">{u.username}</span>
                          </div>

                          <div className="friendUserActions">
                            <button
                              className="btn-accent-small"
                              onClick={() => sendFriendRequest(u._id)}
                            >
                              {t('friends.addFriend')}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="trade-panel">
                  <h3 className="trade-panel-title">{t('friends.received')}</h3>

                  {received.length === 0 ? (
                    <div className="trade-empty">{t('friends.noRequests')}</div>
                  ) : (
                    <div className="trade-list">
                      {received.map((r) => (
                        <div key={r.userId} className="friendUserRow">
                          <div className="friendUserInfo">
                            <img
                              src={r.profileImage || '/icono.png'}
                              alt={r.username}
                              className="friendUserAvatar"
                            />
                            <span className="friendUserName">{r.username}</span>
                          </div>

                          <div className="friendUserActions">
                            <button
                              className="btn-blue-small"
                              onClick={() => accept(r.userId)}
                            >
                              {t('friends.accept')}
                            </button>
                            <button
                              className="btn-red-small"
                              onClick={() => reject(r.userId)}
                            >
                              {t('friends.reject')}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="trade-panel">
                  <h3 className="trade-panel-title">{t('friends.sent')}</h3>

                  {sent.length === 0 ? (
                    <div className="trade-empty">
                      {t('friends.noSentRequests')}
                    </div>
                  ) : (
                    <div className="trade-list">
                      {sent.map((r) => (
                        <div key={r._id} className="friendUserRow">
                          <div className="friendUserInfo">
                            <img
                              src={r.profileImage || '/icono.png'}
                              alt={r.username}
                              className="friendUserAvatar"
                            />
                            <span className="friendUserName">{r.username}</span>
                          </div>

                          <div className="friendUserActions">
                            <button
                              className="btn-gray-small"
                              onClick={() => cancel(r._id)}
                            >
                              {t('friends.cancel')}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        )}

        {view === 'chat' && (
          <div className="friendsChatLayout">
            <aside className="friendsList">
              <h3>{t('friends.myFriends')}</h3>
              {friends.map((f) => (
                <div
                  key={f._id}
                  className={`friendRow ${activeFriend?._id === f._id ? 'active' : ''}`}
                  onClick={() => openChat(f)}
                >
                  <img src={f.profileImage || '/icono.png'} />
                  <span>{f.username}</span>

                  <button
                    className="removeFriendBtn"
                    title={t('friends.removeFriend')}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFriend(f);
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </aside>

            <section className="friendsChat">
              {!activeFriend ? (
                <div className="chatEmpty">{t('friends.selectFriend')}</div>
              ) : (
                <>
                  <header className="chatHeader">
                    <strong>{activeFriend.username}</strong>
                  </header>

                  <div className="chatMessages">
                    {messages.map((m, i) => (
                      <div
                        key={i}
                        className={`chatBubble ${m.from === user.id ? 'self' : 'other'}`}
                      >
                        {m.text}
                      </div>
                    ))}

                    {isTyping && (
                      <div className="chatBubble other typingBubble">
                        <span className="typingDot">.</span>
                        <span className="typingDot">.</span>
                        <span className="typingDot">.</span>
                      </div>
                    )}
                  </div>

                  <div className="chatComposer">
                    <textarea
                      placeholder={t('friends.writeMessage')}
                      value={messageInput}
                      onChange={(e) => {
                        setMessageInput(e.target.value);
                        socket?.emit('typing', { to: activeFriend._id });
                        clearTimeout((window as any)._typingTimeout);
                        (window as any)._typingTimeout = setTimeout(() => {
                          socket?.emit('stopTyping', { to: activeFriend._id });
                        }, 700);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!messageInput.trim()}
                    >
                      {t('friends.send')}
                    </button>
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </main>

      <Footer />
      {toast.visible && (
        <div className="toastOverlay">
          <div className="toastBox">
            <p>{toast.message}</p>

            <div className="toastActions">
              <button
                className="toastCancel"
                onClick={() => setToast({ visible: false, message: '' })}
              >
                {t('common.cancel')}
              </button>

              <button className="toastConfirm" onClick={toast.action}>
                {t('friends.remove')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FriendsPage;
