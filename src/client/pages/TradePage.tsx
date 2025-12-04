import React, { useState, useEffect, useMemo } from "react";
import { Socket } from "socket.io-client";
import { initSocket } from "../socket";
import Header from "../components/Header/Header";
import Footer from "@/components/Footer";
import { useTranslation } from "react-i18next";
import { authService } from "../services/authService";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/trade-room.css";

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
  const userImage = user?.profileImage || "/icono.png";
  const username = user?.username;
  const userId = user?.id;

  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");

  const [roomCode] = useState(() => code || "sala-demo-123");

  const [trade, setTrade] = useState<any | null>(null);
  const [loadingTrade, setLoadingTrade] = useState(true);
  const [tradeError, setTradeError] = useState<string | null>(null);

  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<UserCard | null>(null);
  const [cardsPage, setCardsPage] = useState(1);
  const PAGE_SIZE = 6;

  const [opponentCard, setOpponentCard] = useState<UserCard | null>(null);
  const [opponentName, setOpponentName] = useState<string>("");
  const [opponentImage, setOpponentImage] = useState<string>("/icono.png");

  useEffect(() => {
    const fetchTrade = async () => {
      try {
        setLoadingTrade(true);
        const token = localStorage.getItem("token") || "";
        const res = await fetch(
          `http://localhost:3000/trades/room/${roomCode}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();
        if (!res.ok) {
          setTradeError(
            data?.error || t("tradeRoom.errorSalaNoEncontrada")
          );
          return;
        }
        setTrade(data);
      } catch (e) {
        setTradeError(t("tradeRoom.errorCargarIntercambio"));
      } finally {
        setLoadingTrade(false);
      }
    };

    if (roomCode) fetchTrade();
  }, [roomCode, t]);

  const isFriendPrivateRoom =
    trade?.tradeType === "private" && !trade?.requestId;

  const requestedPokemonTcgId: string | undefined =
    trade?.requestedPokemonTcgId || undefined;

  useEffect(() => {
    const s = initSocket() as Socket | null;
    if (!s) return;

    setSocket(s);

    s.emit("joinRoom", roomCode);

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
          const res = await fetch(`http://localhost:3000/users/${opponent}`);
          const rival = await res.json();
          setOpponentImage(rival.profileImage || "/icono.png");
        } catch {
          setOpponentImage("/icono.png");
        }
      }
    };

    const onTradeCompleted = () => {
      window.alert(t("tradeRoom.tradeCompleted"));
      navigate("/discover");
    };

    const onTradeRejected = () => {
      window.alert(t("tradeRoom.tradeRejected"));
      navigate("/discover");
    };

    s.on("receiveMessage", onReceiveMessage);
    s.on("cardSelected", onCardSelected);
    s.on("userJoined", onUserJoined);
    s.on("roomUsers", onRoomUsers);
    s.on("tradeCompleted", onTradeCompleted);
    s.on("tradeRejected", onTradeRejected);

    return () => {
      s.off("receiveMessage", onReceiveMessage);
      s.off("cardSelected", onCardSelected);
      s.off("userJoined", onUserJoined);
      s.off("roomUsers", onRoomUsers);
      s.off("tradeCompleted", onTradeCompleted);
      s.off("tradeRejected", onTradeRejected);
      setSocket(null);
    };
  }, [username, roomCode, navigate, t]);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const query = isFriendPrivateRoom ? "" : "?forTrade=true";

        const res = await fetch(
          `http://localhost:3000/usercards/${username}/collection${query}`
        );
        const data = await res.json();

        const normalized: UserCard[] = (data.cards || []).map((item: any) => {
          const card = item.cardId || {};

          let image =
            card.imageUrl || card.imageUrlHiRes || card.image || "";
          if (!image && card.images) {
            image = card.images.large || card.images.small || "";
          }

          const pokemonTcgId = item.pokemonTcgId || card.pokemonTcgId || "";

          if (!image && pokemonTcgId) {
            const [setCode, number] = pokemonTcgId.split("-");
            const series = setCode ? setCode.slice(0, 2) : "";
            if (setCode && number) {
              image = `https://assets.tcgdex.net/en/${series}/${setCode}/${number}/high.png`;
            }
          }

          return {
            id: item._id || card._id || card.id || pokemonTcgId || "",
            name: card.name || item.name || "",
            image,
            rarity: card.rarity || item.rarity || "",
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
      socket.emit("selectCard", { roomCode, card: forcedCard, user: username });
    }
  }, [forcedCard, socket, username, roomCode]);

  const handleSend = () => {
    if (!input.trim() || !socket) return;

    const message = {
      text: input,
      roomCode,
      user: username,
    };

    socket.emit("sendMessage", message);
    setMessages((prev) => [...prev, message]);
    setInput("");
  };

  const handleSelectCard = (card: UserCard) => {
    if (forcedCard && card.id !== forcedCard.id) {
      window.alert(
        t("tradeRoom.cardForcedOnly")
      );
      return;
    }

    setSelectedCard(card);
    socket?.emit("selectCard", { roomCode, card, user: username });
  };

  const handleAccept = async () => {
    try {
      if (!trade) {
        window.alert(t("tradeRoom.noTradeLoaded"));
        return;
      }
      if (!selectedCard || !opponentCard) {
        window.alert(t("tradeRoom.mustSelectBoth"));
        return;
      }

      const token = localStorage.getItem("token") || "";
      const res = await fetch(
        `http://localhost:3000/trades/${trade._id}/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            myUserCardId: selectedCard.id,
            opponentUserCardId: opponentCard.id,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        if (data?.error === "TRADE_VALUE_DIFF_TOO_HIGH") {
          window.alert(t("tradeRoom.errorValueDiff"));
        } else if (data?.error === "REQUESTED_CARD_MISMATCH") {
          window.alert(t("tradeRoom.errorRequestedMismatch"));
        } else {
          window.alert(data?.error || t("tradeRoom.errorCompleteTrade"));
        }
        return;
      }

      if (data.message === "WAITING_OTHER_USER") {
        window.alert(t("tradeRoom.waitingOtherUser"));
        return;
      }

      if (data.message === "TRADE_COMPLETED") {
        window.alert(t("tradeRoom.tradeCompleted"));
        navigate("/discover");
        return;
      }

      window.alert(t("tradeRoom.unexpectedResponse"));
    } catch {
      window.alert(t("tradeRoom.errorCompleteTrade"));
    }
  };

  const handleReject = async () => {
    try {
      if (!trade) {
        window.alert(t("tradeRoom.noTradeLoaded"));
        return;
      }

      const token = localStorage.getItem("token") || "";
      const res = await fetch(`http://localhost:3000/trades/${trade._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "rejected" }),
      });

      const data = await res.json();
      if (!res.ok) {
        window.alert(data?.error || t("tradeRoom.errorReject"));
        return;
      }

      window.alert(t("tradeRoom.tradeRejected"));
      navigate("/discover");
    } catch {
      window.alert(t("tradeRoom.errorReject"));
    }
  };
  if (!user || !authService.isAuthenticated()) {
    return (
      <div className="trade-page">
        <Header />
        <main className="trade-main">
          <p>{t("tradeRoom.mustLogin")}</p>
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
          <p>{t("tradeRoom.loadingRoom")}</p>
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
          <p>{tradeError || t("tradeRoom.roomNotFound")}</p>
        </main>
        <Footer />
      </div>
    );
  }

  const pageTitle = isFriendPrivateRoom
    ? t("tradeRoom.privateRoom")
    : t("tradeRoom.publicRoom");

  return (
    <div className="trade-page">
      <Header />

      <main className="trade-main">
        <div className="trade-container">
          <section className="trade-left">
            <h2 className="trade-title">{pageTitle}</h2>
            <p className="trade-room-code">
              {t("tradeRoom.roomCode")}: <b>{roomCode}</b>
            </p>

            <div className="trade-fight">
              <div className="player-block">
                <img src={userImage} className="player-avatar" />
                <p className="player-name">{t("tradeRoom.you")}</p>

                <div className="player-card">
                  {selectedCard ? (
                    <img src={selectedCard.image} className="selected-card" />
                  ) : (
                    <span className="no-card">
                      {t("tradeRoom.selectYourCard")}
                    </span>
                  )}
                </div>
              </div>

              <div className="trade-icon">⚡</div>

              <div className="player-block">
                <img src={opponentImage} className="player-avatar" />
                <p className="player-name opponent">
                  {opponentName || t("tradeRoom.otherUser")}
                </p>

                <div className="player-card">
                  {opponentCard ? (
                    <img src={opponentCard.image} className="selected-card" />
                  ) : (
                    <span className="no-card">
                      {t("tradeRoom.waitingOpponentCard")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="trade-subtitle">
              {isFriendPrivateRoom
                ? t("tradeRoom.yourCards")
                : t("tradeRoom.yourTradeCards")}
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
                      "trade-card" + (disabled ? " trade-card-disabled" : "")
                    }
                    onClick={() => !disabled && handleSelectCard(card)}
                  >
                    <img src={card.image} className="trade-card-img" />
                    <p className="trade-card-title">{card.name}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="trade-chat">
            <h3 className="chat-title">
              {isFriendPrivateRoom
                ? t("tradeRoom.privateChat")
                : t("tradeRoom.chat")}
            </h3>

            <div className="chat-window">
              <div className="messages-list">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`chat-message-row ${
                      m.user === username ? "self" : "other"
                    }`}
                  >
                    <div
                      className={`chat-bubble-2 ${
                        m.user === username ? "self" : "other"
                      }`}
                    >
                      {m.user !== username && (
                        <p className="sender-name">
                          {opponentName || t("tradeRoom.otherUser")}
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
                    ? t("tradeRoom.placeholderFriend")
                    : t("tradeRoom.placeholder")
                }
                className="chat-input"
              />
              <button onClick={handleSend} className="chat-send">
                {t("tradeRoom.send")}
              </button>
            </div>

            <div className="trade-actions">
              <button className="btn-accept" onClick={handleAccept}>
                {t("tradeRoom.acceptTrade")}
              </button>
              <button className="btn-reject" onClick={handleReject}>
                {t("tradeRoom.rejectTrade")}
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
