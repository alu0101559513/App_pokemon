import React, { useEffect, useState, useMemo } from 'react';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer';
import { authService } from '../services/authService';
import { authenticatedFetch } from '../utils/fetchHelpers';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/request.css';
import ConfirmModal from '@/components/ConfirmModal';

interface TradeUser {
  _id: string;
  username: string;
  email?: string;
  profileImage?: string;
}

interface TradeRef {
  _id: string;
  privateRoomCode?: string;
  status?: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
}

interface TradeRequest {
  _id: string;
  from: TradeUser;
  to: TradeUser;
  pokemonTcgId: string | null;
  cardName?: string;
  cardImage?: string;
  note?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: string;
  tradeId?: TradeRef | null;
  isManual?: boolean;
}

type Direction = 'received' | 'sent';

const TradeRequestsPage: React.FC = () => {
  const { t } = useTranslation();

  const [user, setUser] = useState<any>(authService.getUser());
  const [receivedRequests, setReceivedRequests] = useState<TradeRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<TradeRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    variant?: 'success' | 'error' | 'info';
  } | null>(null);

  const [actionModal, setActionModal] = useState<{
    type: 'accept' | 'reject' | 'cancel';
    requestId: string;
  } | null>(null);

  const userId = user?.id;

  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      const u = authService.getUser();
      setUser(u);
    }
  }, [user]);

  const isFinal = (req: TradeRequest): boolean => {
    if (req.status === 'rejected' || req.status === 'cancelled') return true;
    const tradeStatus = req.tradeId?.status;
    if (tradeStatus && tradeStatus !== 'pending') return true;
    return false;
  };

  const loadRequests = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const [recResp, sentResp] = await Promise.all([
        authenticatedFetch(`/trade-requests/received/${userId}`),
        authenticatedFetch(`/trade-requests/sent/${userId}`),
      ]);

      if (!recResp.ok) {
        const data = await recResp.json().catch(() => ({}));
        throw new Error(
          data.error ||
            t('tradeReq.errorReceived', 'Error loading received requests.')
        );
      }
      if (!sentResp.ok) {
        const data = await sentResp.json().catch(() => ({}));
        throw new Error(
          data.error || t('tradeReq.errorSent', 'Error loading sent requests.')
        );
      }

      const recData = await recResp.json();
      const sentData = await sentResp.json();

      setReceivedRequests(recData.requests || []);
      setSentRequests(sentData.requests || []);
    } catch (e: any) {
      const msg =
        e.message ||
        t(
          'tradeReq.errorGeneral',
          'An error occurred while loading trade requests.'
        );

      setConfirmModal({
        title: t('common.error', 'Error'),
        message: msg,
        variant: 'error',
      });

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadRequests();
    }
  }, [userId]);

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
      .map((r) => ({ ...r, __direction: 'received' as Direction }));

    const sentHistory = sentRequests
      .filter((r) => isFinal(r))
      .map((r) => ({ ...r, __direction: 'sent' as Direction }));

    return [...receivedHistory, ...sentHistory].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [receivedRequests, sentRequests]);
  const executeAction = async () => {
    if (!actionModal) return;

    const { type, requestId } = actionModal;

    try {
      if (type === 'accept') {
        await handleAccept(requestId);
      }
      if (type === 'reject') {
        await handleReject(requestId);
      }
      if (type === 'cancel') {
        await handleCancel(requestId);
      }
    } finally {
      setActionModal(null);
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      const resp = await authenticatedFetch(
        `/trade-requests/${requestId}/accept`,
        {
          method: 'POST',
        }
      );

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) throw new Error(data.error || t('tradeReq.errorAccept'));

      if (data.privateRoomCode) {
        navigate(`/trade-room/${data.privateRoomCode}`);
      } else {
        setConfirmModal({
          title: t('tradeReq.acceptedStatus'),
          message: t('tradeReq.accepted', 'Request accepted successfully.'),
          variant: 'success',
        });

        await loadRequests();
      }
    } catch (e: any) {
      setConfirmModal({
        title: t('common.error', 'Error'),
        message: e.message || t('tradeReq.errorAccept'),
        variant: 'error',
      });
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const resp = await authenticatedFetch(
        `/trade-requests/${requestId}/reject`,
        {
          method: 'POST',
        }
      );

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || t('tradeReq.errorReject'));

      setConfirmModal({
        title: t('tradeReq.rejected', 'Request rejected.'),
        message: t('tradeReq.rejected', 'Request rejected.'),
        variant: 'success',
      });
      loadRequests();
    } catch (e: any) {
      setConfirmModal({
        title: t('common.error', 'Error'),
        message: e.message || t('tradeReq.errorAccept'),
        variant: 'error',
      });
    }
  };

  const handleCancel = async (requestId: string) => {
    try {
      const resp = await authenticatedFetch(
        `/trade-requests/${requestId}/cancel`,
        {
          method: 'DELETE',
        }
      );

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || t('tradeReq.errorCancel'));

      setConfirmModal({
        title: t('tradeReq.cancelled', 'Request cancelled.'),
        message: t('tradeReq.cancelled', 'Request cancelled.'),
        variant: 'success',
      });
      loadRequests();
    } catch (e: any) {
      setConfirmModal({
        title: t('common.error', 'Error'),
        message: e.message || t('tradeReq.errorAccept'),
        variant: 'error',
      });
    }
  };

  const goToRoomIfAvailable = (req: TradeRequest) => {
    const roomCode = req.tradeId?.privateRoomCode;
    const tradeStatus = req.tradeId?.status;

    const canGo = roomCode && tradeStatus === 'pending';
    if (!canGo) return;

    navigate(`/trade-room/${roomCode}`);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString();
  };

  const renderStatusBadge = (status: TradeRequest['status']) => {
    if (status === 'pending')
      return (
        <span className="status-badge status-pending">
          {t('tradeReq.pending')}
        </span>
      );
    if (status === 'accepted')
      return (
        <span className="status-badge status-accepted">
          {t('tradeReq.acceptedStatus')}
        </span>
      );
    if (status === 'rejected')
      return (
        <span className="status-badge status-rejected">
          {t('tradeReq.rejectedStatus')}
        </span>
      );
    if (status === 'cancelled')
      return (
        <span className="status-badge status-cancelled">
          {t('tradeReq.cancelledStatus')}
        </span>
      );
    return null;
  };

  const renderRoomChip = (req: TradeRequest) => {
    const roomCode = req.tradeId?.privateRoomCode;
    const tradeStatus = req.tradeId?.status;

    if (!roomCode) return null;

    if (tradeStatus !== 'pending') {
      return (
        <span className="room-chip room-chip-disabled">
          {t('tradeReq.roomUnavailable')}
        </span>
      );
    }

    return (
      <button
        className="room-chip room-chip-active"
        onClick={() => goToRoomIfAvailable(req)}
      >
        {t('tradeReq.goRoom')}
      </button>
    );
  };
  return (
    <div className="trade-requests-container trade-requests-page">
      <Header />

      <main className="trade-requests-main">
        <div className="discover-header">
          <h1 className="trade-requests-title">{t('tradeReq.title')}</h1>
        </div>

        {loading && (
          <p className="trade-requests-loading">
            {t('tradeReq.loading', 'Loading trade requests...')}
          </p>
        )}

        {!loading && !error && (
          <div className="trade-requests-columns">
            <section className="trade-panel">
              <h2 className="trade-panel-title">
                {t('tradeReq.received', 'Received Requests')}
              </h2>

              {activeReceived.length === 0 ? (
                <p className="trade-empty">
                  {t('tradeReq.noReceived', 'No received requests.')}
                </p>
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
                            {t('tradeReq.noImage')}
                          </div>
                        )}
                      </div>

                      <div className="trade-info">
                        <div className="trade-info-header">
                          <span className="trade-user">
                            {t('tradeReq.from')}{' '}
                            <strong>
                              @{req.from?.username || t('tradeReq.unknown')}
                            </strong>
                          </span>
                          {renderStatusBadge(req.status)}
                        </div>

                        <p className="trade-card-name">
                          {req.cardName ||
                            t('tradeReq.noName', 'No name available')}
                        </p>

                        {req.note && (
                          <p className="trade-note">
                            <span>{t('tradeReq.message', 'Message')}:</span>{' '}
                            {req.note}
                          </p>
                        )}

                        <p className="trade-date">
                          {formatDate(req.createdAt)}
                        </p>

                        <div className="trade-actions">
                          {req.status === 'pending' && (
                            <>
                              <button
                                className="btn-blue-small"
                                onClick={() =>
                                  setActionModal({
                                    type: 'accept',
                                    requestId: req._id,
                                  })
                                }
                              >
                                {t('tradeReq.accept')}
                              </button>
                              <button
                                className="btn-red-small"
                                onClick={() =>
                                  setActionModal({
                                    type: 'reject',
                                    requestId: req._id,
                                  })
                                }
                              >
                                {t('tradeReq.reject')}
                              </button>
                            </>
                          )}

                          {req.status === 'accepted' && renderRoomChip(req)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="trade-panel">
              <h2 className="trade-panel-title">
                {t('tradeReq.sent', 'Sent Requests')}
              </h2>

              {activeSent.length === 0 ? (
                <p className="trade-empty">
                  {t('tradeReq.noSent', 'No sent requests.')}
                </p>
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
                            {t('tradeReq.noImage')}
                          </div>
                        )}
                      </div>

                      <div className="trade-info">
                        <div className="trade-info-header">
                          <span className="trade-user">
                            {t('tradeReq.to')}{' '}
                            <strong>
                              @{req.to?.username || t('tradeReq.unknown')}
                            </strong>
                          </span>
                          {renderStatusBadge(req.status)}
                        </div>

                        <p className="trade-card-name">
                          {req.cardName ||
                            t('tradeReq.noName', 'No name available')}
                        </p>

                        {req.note && (
                          <p className="trade-note">
                            <span>{t('tradeReq.message', 'Message')}:</span>{' '}
                            {req.note}
                          </p>
                        )}

                        <p className="trade-date">
                          {formatDate(req.createdAt)}
                        </p>

                        <div className="trade-actions">
                          {req.status === 'pending' && (
                            <button
                              className="btn-red-small"
                              onClick={() =>
                                setActionModal({
                                  type: 'cancel',
                                  requestId: req._id,
                                })
                              }
                            >
                              {t('tradeReq.cancel')}
                            </button>
                          )}

                          {req.status === 'accepted' && renderRoomChip(req)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section className="trade-panel trade-panel-history">
              <h2 className="trade-panel-title">
                {t('tradeReq.history', 'History')}
              </h2>

              {historyCombined.length === 0 ? (
                <p className="trade-empty">
                  {t('tradeReq.noHistory', 'No trade history available.')}
                </p>
              ) : (
                <div className="trade-list">
                  {historyCombined.map((req: any) => {
                    const dir: Direction = req.__direction;
                    const isReceived = dir === 'received';

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
                              {t('tradeReq.noImage')}
                            </div>
                          )}
                        </div>

                        <div className="trade-info">
                          <div className="trade-info-header">
                            <span className="trade-user">
                              {isReceived
                                ? t('tradeReq.from')
                                : t('tradeReq.to')}{' '}
                              <strong>
                                @
                                {isReceived
                                  ? req.from?.username || t('tradeReq.unknown')
                                  : req.to?.username || t('tradeReq.unknown')}
                              </strong>
                            </span>
                            {renderStatusBadge(req.status)}
                          </div>

                          <p className="trade-card-name">
                            {req.cardName ||
                              t('tradeReq.noName', 'No name available')}
                          </p>

                          {req.note && (
                            <p className="trade-note">
                              <span>{t('tradeReq.message', 'Message')}:</span>{' '}
                              {req.note}
                            </p>
                          )}

                          <p className="trade-date">
                            {formatDate(req.createdAt)}
                          </p>

                          <div className="trade-actions">
                            {req.tradeId?.status === 'completed' && (
                              <span className="history-chip">
                                {t('tradeReq.tradeDone', 'Trade completed')}
                              </span>
                            )}
                            {req.tradeId?.status === 'cancelled' && (
                              <span className="history-chip">
                                {t(
                                  'tradeReq.tradeCancelled',
                                  'Trade cancelled'
                                )}
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
      {confirmModal && (
        <ConfirmModal
          open={true}
          title={confirmModal.title}
          message={confirmModal.message}
          variant={confirmModal.variant}
          onClose={() => setConfirmModal(null)}
        />
      )}
      {actionModal && (
        <ConfirmModal
          open={true}
          title={
            actionModal.type === 'accept'
              ? t('tradeReq.confirmAcceptTitle', 'Accept trade request')
              : actionModal.type === 'reject'
                ? t('tradeReq.confirmRejectTitle', 'Reject trade request')
                : t('tradeReq.confirmCancelTitle', 'Cancel trade request')
          }
          message={
            actionModal.type === 'accept'
              ? t(
                  'tradeReq.confirmAccept',
                  'Are you sure you want to accept this trade request?'
                )
              : actionModal.type === 'reject'
                ? t(
                    'tradeReq.confirmReject',
                    'Are you sure you want to reject this trade request?'
                  )
                : t(
                    'tradeReq.confirmCancel',
                    'Are you sure you want to cancel this trade request?'
                  )
          }
          variant={actionModal.type === 'accept' ? 'success' : 'error'}
          onConfirm={executeAction}
          onClose={() => setActionModal(null)}
        />
      )}
    </div>
  );
};

export default TradeRequestsPage;
