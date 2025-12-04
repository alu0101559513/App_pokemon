import React, { useEffect, useState, useMemo } from "react";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer";
import { authService } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../styles/trade_request.css";

interface TradeUser {
  _id: string;
  username: string;
  email?: string;
  profileImage?: string;
}

interface TradeRef {
  _id: string;
  privateRoomCode?: string;
  status?: "pending" | "accepted" | "rejected" | "completed" | "cancelled";
}

interface TradeRequest {
  _id: string;
  from: TradeUser;
  to: TradeUser;
  pokemonTcgId: string | null;
  cardName?: string;
  cardImage?: string;
  note?: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  createdAt: string;
  tradeId?: TradeRef | null;
  isManual?: boolean;
}

type Direction = "received" | "sent";

const TradeRequestsPage: React.FC = () => {
  const { t } = useTranslation();

  const [user, setUser] = useState<any>(authService.getUser());
  const [receivedRequests, setReceivedRequests] = useState<TradeRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<TradeRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = "http://localhost:3000";
  const token = localStorage.getItem("token") || "";
  const userId = user?.id;

  const navigate = useNavigate();

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  useEffect(() => {
    if (!user) {
      const u = authService.getUser();
      setUser(u);
    }
  }, [user]);

  const isFinal = (req: TradeRequest): boolean => {
    if (req.status === "rejected" || req.status === "cancelled") return true;
    const tradeStatus = req.tradeId?.status;
    if (tradeStatus && tradeStatus !== "pending") return true;
    return false;
  };

  const loadRequests = async () => {
    if (!userId || !token) return;

    try {
      setLoading(true);
      setError(null);

      const [recResp, sentResp] = await Promise.all([
        fetch(`${baseUrl}/trade-requests/received/${userId}`, {
          headers: authHeaders,
        }),
        fetch(`${baseUrl}/trade-requests/sent/${userId}`, {
          headers: authHeaders,
        }),
      ]);

      if (!recResp.ok) {
        const data = await recResp.json().catch(() => ({}));
        throw new Error(data.error || t("tradeReq.errorReceived"));
      }
      if (!sentResp.ok) {
        const data = await sentResp.json().catch(() => ({}));
        throw new Error(data.error || t("tradeReq.errorSent"));
      }

      const recData = await recResp.json();
      const sentData = await sentResp.json();

      setReceivedRequests(recData.requests || []);
      setSentRequests(sentData.requests || []);
    } catch (e: any) {
      setError(e.message || t("tradeReq.errorGeneral"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId && token) {
      loadRequests();
    }
  }, [userId, token]);

  const activeReceived = useMemo(
    () => receivedRequests.filter((r) => !isFinal(r)),
    [receivedRequests]
  );
  const activeSent = useMemo(
    () => sentRequests.filter((r) => !isFinal(r)),
    [sentRequests]
  );

  const historyCombined = useMemo(() => {
    const receivedHistory = receivedRequests
      .filter((r) => isFinal(r))
      .map((r) => ({ ...r, __direction: "received" as Direction }));

    const sentHistory = sentRequests
      .filter((r) => isFinal(r))
      .map((r) => ({ ...r, __direction: "sent" as Direction }));

    return [...receivedHistory, ...sentHistory].sort((a, b) => {
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
  }, [receivedRequests, sentRequests]);
  const handleAccept = async (requestId: string) => {
    if (!confirm(t("tradeReq.confirmAccept"))) return;

    try {
      const resp = await fetch(
        `${baseUrl}/trade-requests/${requestId}/accept`,
        {
          method: "POST",
          headers: authHeaders,
        }
      );

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) throw new Error(data.error || t("tradeReq.errorAccept"));

      if (data.privateRoomCode) {
        navigate(`/trade-room/${data.privateRoomCode}`);
      } else {
        alert(t("tradeReq.accepted"));
        await loadRequests();
      }
    } catch (e: any) {
      alert(e.message || t("tradeReq.errorAccept"));
    }
  };

  const handleReject = async (requestId: string) => {
    if (!confirm(t("tradeReq.confirmReject"))) return;

    try {
      const resp = await fetch(
        `${baseUrl}/trade-requests/${requestId}/reject`,
        {
          method: "POST",
          headers: authHeaders,
        }
      );

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || t("tradeReq.errorReject"));

      alert(t("tradeReq.rejected"));
      loadRequests();
    } catch (e: any) {
      alert(e.message || t("tradeReq.errorReject"));
    }
  };

  const handleCancel = async (requestId: string) => {
    if (!confirm(t("tradeReq.confirmCancel"))) return;

    try {
      const resp = await fetch(
        `${baseUrl}/trade-requests/${requestId}/cancel`,
        {
          method: "DELETE",
          headers: authHeaders,
        }
      );

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || t("tradeReq.errorCancel"));

      alert(t("tradeReq.cancelled"));
      loadRequests();
    } catch (e: any) {
      alert(e.message || t("tradeReq.errorCancel"));
    }
  };

  const goToRoomIfAvailable = (req: TradeRequest) => {
    const roomCode = req.tradeId?.privateRoomCode;
    const tradeStatus = req.tradeId?.status;

    const canGo = roomCode && tradeStatus === "pending";
    if (!canGo) return;

    navigate(`/trade-room/${roomCode}`);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString();
  };

  const renderStatusBadge = (status: TradeRequest["status"]) => {
    if (status === "pending")
      return <span className="status-badge status-pending">{t("tradeReq.pending")}</span>;
    if (status === "accepted")
      return <span className="status-badge status-accepted">{t("tradeReq.acceptedStatus")}</span>;
    if (status === "rejected")
      return <span className="status-badge status-rejected">{t("tradeReq.rejectedStatus")}</span>;
    if (status === "cancelled")
      return <span className="status-badge status-cancelled">{t("tradeReq.cancelledStatus")}</span>;
    return null;
  };

  const renderRoomChip = (req: TradeRequest) => {
    const roomCode = req.tradeId?.privateRoomCode;
    const tradeStatus = req.tradeId?.status;

    if (!roomCode) return null;

    if (tradeStatus !== "pending") {
      return (
        <span className="room-chip room-chip-disabled">
          {t("tradeReq.roomUnavailable")}
        </span>
      );
    }

    return (
      <button
        className="room-chip room-chip-active"
        onClick={() => goToRoomIfAvailable(req)}
      >
        {t("tradeReq.goRoom")}
      </button>
    );
  };
  return (
    <div className="trade-requests-container">
      <Header />

      <main className="trade-requests-main">
        <h1 className="trade-requests-title">
          {t("tradeReq.title")}
        </h1>

        {loading && (
          <p className="trade-requests-loading">
            {t("tradeReq.loading")}
          </p>
        )}

        {error && !loading && (
          <p className="trade-requests-error">{error}</p>
        )}

        {!loading && !error && (
          <div className="trade-requests-columns">

            <section className="trade-panel">
              <h2 className="trade-panel-title">
                {t("tradeReq.received")}
              </h2>

              {activeReceived.length === 0 ? (
                <p className="trade-empty">{t("tradeReq.noReceived")}</p>
              ) : (
                <div className="trade-list">
                  {activeReceived.map((req) => (
                    <div key={req._id} className="trade-row">
                      <div className="trade-card-preview">
                        {req.cardImage ? (
                          <img
                            src={req.cardImage}
                            alt={req.cardName}
                            className="trade-card-img"
                          />
                        ) : (
                          <div className="trade-card-placeholder">
                            {t("tradeReq.noImage")}
                          </div>
                        )}
                      </div>

                      <div className="trade-info">
                        <div className="trade-info-header">
                          <span className="trade-user">
                            {t("tradeReq.from")}{" "}
                            <strong>
                              @{req.from?.username || t("tradeReq.unknown")}
                            </strong>
                          </span>
                          {renderStatusBadge(req.status)}
                        </div>

                        <p className="trade-card-name">
                          {req.cardName || t("tradeReq.noName")}
                        </p>

                        {req.note && (
                          <p className="trade-note">
                            <span>{t("tradeReq.message")}:</span> {req.note}
                          </p>
                        )}

                        <p className="trade-date">{formatDate(req.createdAt)}</p>

                        <div className="trade-actions">
                          {req.status === "pending" && (
                            <>
                              <button
                                className="btn-blue-small"
                                onClick={() => handleAccept(req._id)}
                              >
                                {t("tradeReq.accept")}
                              </button>
                              <button
                                className="btn-gray-small"
                                onClick={() => handleReject(req._id)}
                              >
                                {t("tradeReq.reject")}
                              </button>
                            </>
                          )}

                          {req.status === "accepted" && renderRoomChip(req)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="trade-panel">
              <h2 className="trade-panel-title">{t("tradeReq.sent")}</h2>

              {activeSent.length === 0 ? (
                <p className="trade-empty">{t("tradeReq.noSent")}</p>
              ) : (
                <div className="trade-list">
                  {activeSent.map((req) => (
                    <div key={req._id} className="trade-row">
                      <div className="trade-card-preview">
                        {req.cardImage ? (
                          <img
                            src={req.cardImage}
                            alt={req.cardName}
                            className="trade-card-img"
                          />
                        ) : (
                          <div className="trade-card-placeholder">
                            {t("tradeReq.noImage")}
                          </div>
                        )}
                      </div>

                      <div className="trade-info">
                        <div className="trade-info-header">
                          <span className="trade-user">
                            {t("tradeReq.to")}{" "}
                            <strong>
                              @{req.to?.username || t("tradeReq.unknown")}
                            </strong>
                          </span>
                          {renderStatusBadge(req.status)}
                        </div>

                        <p className="trade-card-name">
                          {req.cardName || t("tradeReq.noName")}
                        </p>

                        {req.note && (
                          <p className="trade-note">
                            <span>{t("tradeReq.message")}:</span> {req.note}
                          </p>
                        )}

                        <p className="trade-date">{formatDate(req.createdAt)}</p>

                        <div className="trade-actions">
                          {req.status === "pending" && (
                            <button
                              className="btn-gray-small"
                              onClick={() => handleCancel(req._id)}
                            >
                              {t("tradeReq.cancel")}
                            </button>
                          )}

                          {req.status === "accepted" && renderRoomChip(req)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section className="trade-panel trade-panel-history">
              <h2 className="trade-panel-title">
                {t("tradeReq.history")}
              </h2>

              {historyCombined.length === 0 ? (
                <p className="trade-empty">
                  {t("tradeReq.noHistory")}
                </p>
              ) : (
                <div className="trade-list">
                  {historyCombined.map((req: any) => {
                    const dir: Direction = req.__direction;
                    const isReceived = dir === "received";

                    return (
                      <div key={req._id} className="trade-row">
                        <div className="trade-card-preview">
                          {req.cardImage ? (
                            <img
                              src={req.cardImage}
                              alt={req.cardName}
                              className="trade-card-img"
                            />
                          ) : (
                            <div className="trade-card-placeholder">
                              {t("tradeReq.noImage")}
                            </div>
                          )}
                        </div>

                        <div className="trade-info">
                          <div className="trade-info-header">
                            <span className="trade-user">
                              {isReceived ? t("tradeReq.from") : t("tradeReq.to")}{" "}
                              <strong>
                                @
                                {isReceived
                                  ? req.from?.username || t("tradeReq.unknown")
                                  : req.to?.username || t("tradeReq.unknown")}
                              </strong>
                            </span>
                            {renderStatusBadge(req.status)}
                          </div>

                          <p className="trade-card-name">
                            {req.cardName || t("tradeReq.noName")}
                          </p>

                          {req.note && (
                            <p className="trade-note">
                              <span>{t("tradeReq.message")}:</span> {req.note}
                            </p>
                          )}

                          <p className="trade-date">{formatDate(req.createdAt)}</p>

                          <div className="trade-actions">
                            {req.tradeId?.status === "completed" && (
                              <span className="history-chip">
                                {t("tradeReq.tradeDone")}
                              </span>
                            )}
                            {req.tradeId?.status === "cancelled" && (
                              <span className="history-chip">
                                {t("tradeReq.tradeCancelled")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default TradeRequestsPage;
