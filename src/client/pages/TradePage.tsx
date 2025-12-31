import React, { useState, useEffect, useMemo } from 'react';
import { Socket } from 'socket.io-client';
import { initSocket } from '../socket';
import { normalizeImageUrl } from '../utils/imageHelpers';
import { authenticatedFetch } from '../utils/fetchHelpers';
import { API_BASE_URL } from '../config/constants';
import Header from '../components/Header/Header';
import Footer from '@/components/Footer';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/authService';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/trade-room.css';

interface UserCard {
  id: string;
  name: string;
  image: string;
  rarity: string;
  pokemonTcgId?: string;
}

const TradePage: React.FC = () => {
  const { t } = useTranslation();
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const user = authService.getUser();
  const userImage = user?.profileImage || '/icono.png';
  const username = user?.username;
  const userId = user?.id;

  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');

  const [roomCode] = useState(() => code || 'sala-demo-123');

  const [trade, setTrade] = useState<any | null>(null);
  const [loadingTrade, setLoadingTrade] = useState(true);
  const [tradeError, setTradeError] = useState<string | null>(null);

  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<UserCard | null>(null);
  const [cardsPage, setCardsPage] = useState(1);
  const PAGE_SIZE = 6;

  const [opponentCard, setOpponentCard] = useState<UserCard | null>(null);
  const [opponentName, setOpponentName] = useState<string>('');
  const [opponentImage, setOpponentImage] = useState<string>('/icono.png');
  const [requestedCardDisplay, setRequestedCardDisplay] = useState<UserCard | null>(null);

  useEffect(() => {
    const fetchTrade = async () => {
      try {
        setLoadingTrade(true);
        const res = await authenticatedFetch(
          `/trades/room/${roomCode}`
        );
        const data = await res.json();
        if (!res.ok) {
          setTradeError(
            data?.error || t('tradeRoom.roomNotFound', 'Room not found.')
          );
          return;
        }
        setTrade(data);
      } catch (e) {
        setTradeError(t('tradeRoom.errorLoadingTrade', 'Error loading trade.'));
      } finally {
        setLoadingTrade(false);
      }
    };

    if (roomCode) fetchTrade();
  }, [roomCode, t]);

  const isFriendPrivateRoom =
    trade?.tradeType === 'private' && !trade?.requestId;

  const requestedPokemonTcgId: string | undefined =
    trade?.requestedPokemonTcgId || undefined;

  useEffect(() => {
    const s = initSocket() as Socket | null;
    if (!s) return;

    setSocket(s);

    s.emit('joinRoom', roomCode);

    const onReceiveMessage = (data: any) =>
      setMessages((prev) => [...prev, data]);

    const onCardSelected = (data: any) => {
      setOpponentCard(data.card);
      setOpponentName(data.user);
    };

    const onUserJoined = (data: any) => {
      if (data.user !== username) setOpponentName(data.user);
    };

    const onRoomUsers = async (data: any) => {
      if (!data || !Array.isArray(data.users)) return;
      const others = data.users.filter((u: string) => u !== username);
      if (others.length > 0) {
        const opponent = others[0];
        setOpponentName(opponent);

        try {
          const res = await fetch(`${API_BASE_URL}/users/${opponent}`);
          const rival = await res.json();
          setOpponentImage(rival.profileImage || '/icono.png');
        } catch {
          setOpponentImage('/icono.png');
        }
      }
    };

    const onTradeCompleted = () => {
      window.alert(
        t('tradeRoom.tradeCompleted', 'Trade completed successfully.')
      );
      navigate('/discover');
    };

    const onTradeRejected = () => {
      window.alert(t('tradeRoom.tradeRejected', 'Trade rejected.'));
      navigate('/discover');
    };

    s.on('receiveMessage', onReceiveMessage);
    s.on('cardSelected', onCardSelected);
    s.on('userJoined', onUserJoined);
    s.on('roomUsers', onRoomUsers);
    s.on('tradeCompleted', onTradeCompleted);
    s.on('tradeRejected', onTradeRejected);

    return () => {
      s.off('receiveMessage', onReceiveMessage);
      s.off('cardSelected', onCardSelected);
      s.off('userJoined', onUserJoined);
      s.off('roomUsers', onRoomUsers);
      s.off('tradeCompleted', onTradeCompleted);
      s.off('tradeRejected', onTradeRejected);
      setSocket(null);
    };
  }, [username, roomCode, navigate, t]);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const query = isFriendPrivateRoom ? '' : '?forTrade=true';

        const res = await fetch(
          `${API_BASE_URL}/usercards/${username}/collection${query}`
        );
        const data = await res.json();

        const normalized: UserCard[] = (data.cards || []).map((item: any) => {
          const card = item.cardId || {};

          let image = card.imageUrl || card.imageUrlHiRes || card.image || '';
          if (!image && card.images) {
            image = card.images.large || card.images.small || '';
          }

          const pokemonTcgId = item.pokemonTcgId || card.pokemonTcgId || '';

          if (!image && pokemonTcgId) {
            const [setCode, number] = pokemonTcgId.split('-');
            if (setCode && number) {
              // Usar normalizeImageUrl para corregir cualquier problema con la URL
              image = normalizeImageUrl(`https://assets.tcgdex.net/en/${setCode}/${number}/high.png`);
            }
          } else {
            // Normalizar la imagen que ya tenemos
            image = normalizeImageUrl(image);
          }

          return {
            id: item._id || card._id || card.id || pokemonTcgId || '',
            name: card.name || item.name || '',
            image,
            rarity: card.rarity || item.rarity || '',
            pokemonTcgId: pokemonTcgId || undefined,
          };
        });

        setUserCards(normalized);
      } catch {
        setUserCards([]);
      }
    };

    if (username) fetchCards();
  }, [username, isFriendPrivateRoom]);

  // Cargar la carta solicitada si el usuario NO es el propietario (es el iniciador)
  useEffect(() => {
    const fetchRequestedCard = async () => {
      if (!requestedPokemonTcgId || !trade) return;
      
      // Si ya tengo la carta en mis cartas, no necesito cargarla
      const myCard = userCards.find((c) => c.pokemonTcgId === requestedPokemonTcgId);
      if (myCard) return;

      try {
        // Cargar la carta desde el endpoint de cards
        const res = await fetch(`${API_BASE_URL}/cards`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: requestedPokemonTcgId }),
        });
        
        if (!res.ok) return;
        
        const data = await res.json();
        const card = data.card || data;

        let image = card.imageUrl || card.imageUrlHiRes || card.image || '';
        if (!image && card.images) {
          image = card.images.large || card.images.small || '';
        }

        if (!image && requestedPokemonTcgId) {
          const [setCode, number] = requestedPokemonTcgId.split('-');
          if (setCode && number) {
            // Usar normalizeImageUrl para corregir cualquier problema con la URL
            image = normalizeImageUrl(`https://assets.tcgdex.net/en/${setCode}/${number}/high.png`);
          }
        } else {
          // Normalizar la imagen que ya tenemos
          image = normalizeImageUrl(image);
        }

        const requestedCard: UserCard = {
          id: requestedPokemonTcgId,
          name: card.name || '',
          image,
          rarity: card.rarity || '',
          pokemonTcgId: requestedPokemonTcgId,
        };

        setRequestedCardDisplay(requestedCard);
      } catch (error) {
        console.error('Error fetching requested card:', error);
      }
    };

    fetchRequestedCard();
  }, [requestedPokemonTcgId, trade, userCards]);

  const forcedCard = useMemo(() => {
    if (!requestedPokemonTcgId) return null;
    return (
      userCards.find((c) => c.pokemonTcgId === requestedPokemonTcgId) || null
    );
  }, [userCards, requestedPokemonTcgId]);

  const isOwnerOfRequestedCard = !!forcedCard;

  useEffect(() => {
    if (forcedCard && socket && username) {
      setSelectedCard(forcedCard);
      socket.emit('selectCard', { roomCode, card: forcedCard, user: username });
    }
  }, [forcedCard, socket, username, roomCode]);

  const handleSend = () => {
    if (!input.trim() || !socket) return;

    const message = {
      text: input,
      roomCode,
      user: username,
    };

    // Solo enviar al servidor, el servidor lo devolverá via receiveMessage
    socket.emit('sendMessage', message);
    setInput('');
  };

  const handleSelectCard = (card: UserCard) => {
    if (forcedCard && card.id !== forcedCard.id) {
      window.alert(
        t('tradeRoom.cardForcedOnly', 'You can only select the requested card.')
      );
      return;
    }

    setSelectedCard(card);
    socket?.emit('selectCard', { roomCode, card, user: username });
  };

  const handleAccept = async () => {
    try {
      if (!trade) {
        window.alert(t('tradeRoom.noTradeLoaded', 'No trade loaded.'));
        return;
      }
      if (!selectedCard || !opponentCard) {
        window.alert(
          t('tradeRoom.mustSelectBoth', 'Both users must select a card.')
        );
        return;
      }

      const res = await authenticatedFetch(
        `/trades/${trade._id}/complete`,
        {
          method: 'POST',
          body: JSON.stringify({
            myUserCardId: selectedCard.id,
            opponentUserCardId: opponentCard.id,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        if (data?.error === 'TRADE_VALUE_DIFF_TOO_HIGH') {
          window.alert(
            t(
              'tradeRoom.errorValueDiff',
              'The value difference between cards is too high.'
            )
          );
        } else if (data?.error === 'REQUESTED_CARD_MISMATCH') {
          window.alert(
            t(
              'tradeRoom.errorRequestedMismatch',
              'The selected card does not match the requested card.'
            )
          );
        } else {
          window.alert(
            data?.error ||
              t('tradeRoom.errorCompleteTrade', 'Error completing the trade.')
          );
        }
        return;
      }

      if (data.message === 'WAITING_OTHER_USER') {
        window.alert(
          t(
            'tradeRoom.waitingOtherUser',
            'Waiting for the other user to confirm.'
          )
        );
        return;
      }

      if (data.message === 'TRADE_COMPLETED') {
        window.alert(
          t('tradeRoom.tradeCompleted', 'Trade completed successfully.')
        );
        navigate('/discover');
        return;
      }

      window.alert(
        t(
          'tradeRoom.unexpectedResponse',
          'Unexpected response from the server.'
        )
      );
    } catch {
      window.alert(
        t('tradeRoom.errorCompleteTrade', 'Error completing the trade.')
      );
    }
  };

  const handleReject = async () => {
    try {
      if (!trade) {
        window.alert(t('tradeRoom.noTradeLoaded', 'No trade loaded.'));
        return;
      }

      const res = await authenticatedFetch(`/trades/${trade._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'rejected' }),
      });

      const data = await res.json();
      if (!res.ok) {
        window.alert(
          data?.error ||
            t('tradeRoom.errorReject', 'Error rejecting the trade.')
        );
        return;
      }

      window.alert(t('tradeRoom.tradeRejected', 'Trade rejected.'));
      navigate('/discover');
    } catch {
      window.alert(t('tradeRoom.errorReject', 'Error rejecting the trade.'));
    }
  };
  if (!user || !authService.isAuthenticated()) {
    return (
      <div className="trade-page">
        <Header />
        <main className="trade-main">
          <p>
            {t('tradeRoom.mustLogin', 'You must log in to access this page.')}
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  if (loadingTrade) {
    return (
      <div className="trade-page">
        <Header />
        <main className="trade-main">
          <p>{t('tradeRoom.loadingRoom', 'Loading trade room...')}</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (tradeError || !trade) {
    return (
      <div className="trade-page">
        <Header />
        <main className="trade-main">
          <p>{tradeError || t('tradeRoom.roomNotFound', 'Room not found.')}</p>
        </main>
        <Footer />
      </div>
    );
  }

  const pageTitle = isFriendPrivateRoom
    ? t('tradeRoom.privateRoom')
    : t('tradeRoom.publicRoom');

  return (
    <div className="trade-page">
      <Header />

      <main className="trade-main">
        <div className="trade-container">
          <section className="trade-left">
            <h2 className="trade-title">{pageTitle}</h2>
            <p className="trade-room-code">
              {t('tradeRoom.roomCode', 'Room Code')}: <b>{roomCode}</b>
            </p>

            <div className="trade-fight">
              <div className="player-block">
                <img src={userImage} className="player-avatar" />
                <p className="player-name">{t('tradeRoom.you', 'You')}</p>

                <div className="player-card">
                  {selectedCard ? (
                    <img src={selectedCard.image} className="selected-card" />
                  ) : (
                    <span className="no-card">
                      {t('tradeRoom.selectYourCard', 'Select your card')}
                    </span>
                  )}
                </div>
              </div>

              <div className="trade-icon">⚡</div>

              <div className="player-block">
                <img src={opponentImage} className="player-avatar" />
                <p className="player-name opponent">
                  {opponentName || t('tradeRoom.otherUser', 'Other User')}
                </p>

                <div className="player-card">
                  {opponentCard ? (
                    <img src={opponentCard.image} className="selected-card" />
                  ) : requestedCardDisplay && !isOwnerOfRequestedCard ? (
                    // Mostrar la carta solicitada si el usuario es el iniciador
                    <div className="requested-card-preview">
                      <img src={requestedCardDisplay.image} className="selected-card" />
                      <span className="requested-label">
                        {t('tradeRoom.requestedCard', 'Requested')}
                      </span>
                    </div>
                  ) : (
                    <span className="no-card">
                      {t(
                        'tradeRoom.waitingOpponentCard',
                        "Waiting for opponent's card"
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="trade-subtitle">
              {isFriendPrivateRoom
                ? t('tradeRoom.yourCards')
                : t('tradeRoom.yourTradeCards')}
            </p>
            <div className="trade-cards-grid">
              {userCards.map((card) => {
                const disabled =
                  isOwnerOfRequestedCard &&
                  forcedCard &&
                  card.id !== forcedCard.id;

                return (
                  <div
                    key={card.id}
                    className={
                      'trade-card' + (disabled ? ' trade-card-disabled' : '')
                    }
                    onClick={() => !disabled && handleSelectCard(card)}
                  >
                    <img src={card.image} className="trade-card-img" />
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="trade-chat">
            <h3 className="chat-title">
              {isFriendPrivateRoom
                ? t('tradeRoom.privateChat', 'Private Chat')
                : t('tradeRoom.chat', 'Chat')}
            </h3>

            <div className="chat-window">
              <div className="messages-list">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`chat-message-row ${
                      m.user === username ? 'self' : 'other'
                    }`}
                  >
                    <div
                      className={`chat-bubble-2 ${
                        m.user === username ? 'self' : 'other'
                      }`}
                    >
                      {m.user !== username && (
                        <p className="sender-name">
                          {opponentName ||
                            t('tradeRoom.otherUser', 'Other User')}
                        </p>
                      )}
                      <p>{m.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="chat-input-row">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  isFriendPrivateRoom
                    ? t(
                        'tradeRoom.placeholderFriend',
                        'Send a message to your friend...'
                      )
                    : t('tradeRoom.placeholder', 'Send a message...')
                }
                className="chat-input"
              />
              <button onClick={handleSend} className="chat-send">
                {t('tradeRoom.send', 'Send')}
              </button>
            </div>

            <div className="trade-actions">
              <button className="btn-accept" onClick={handleAccept}>
                {t('tradeRoom.acceptTrade', 'Accept Trade')}
              </button>
              <button className="btn-reject" onClick={handleReject}>
                {t('tradeRoom.rejectTrade', 'Reject Trade')}
              </button>
            </div>
          </aside>
        </div>
      </main>

      <footer className="trade-footer">
        <Footer />
      </footer>
    </div>
  );
};

export default TradePage;
