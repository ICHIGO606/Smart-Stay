import React, { useState } from 'react';
import adminHotelService from '../../services/adminHotelService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { API_BASE_URL } from '../../services/api';
import { QrCode, Search, CheckCircle2, AlertCircle, BedDouble, Calendar, User, ShieldCheck, Ticket, X } from 'lucide-react';

const CheckInStationModal = ({ isOpen, onClose, onCheckInComplete }) => {
  const [tokenInput, setTokenInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [error, setError] = useState('');
  const [verifiedVoucher, setVerifiedVoucher] = useState(null);
  const [notes, setNotes] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (!tokenInput.trim()) {
      setError('Please enter a voucher verification token or check-in code');
      return;
    }

    try {
      setVerifying(true);
      setError('');
      setSuccessMessage('');
      setVerifiedVoucher(null);

      const response = await adminHotelService.verifyCheckInToken(tokenInput.trim());
      const data = response.data || response;
      setVerifiedVoucher(data);
    } catch (err) {
      setError(err.message || 'No active reservation matches this check-in token');
    } finally {
      setVerifying(false);
    }
  };

  const handleConfirmCheckIn = async () => {
    if (!verifiedVoucher) return;
    try {
      setCheckingIn(true);
      setError('');

      const token = verifiedVoucher.verificationToken || verifiedVoucher.checkInCode || tokenInput.trim();
      const result = await adminHotelService.checkInGuest(token, notes);

      setSuccessMessage(
        result.message || `Guest ${verifiedVoucher.guest?.name} checked in. Room allocated.`
      );

      if (onCheckInComplete) {
        onCheckInComplete(result);
      }
    } catch (err) {
      setError(err.message || 'Failed to complete guest check-in');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleReset = () => {
    setTokenInput('');
    setVerifiedVoucher(null);
    setNotes('');
    setError('');
    setSuccessMessage('');
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card-base max-w-xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-elevated bg-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-control bg-stone-100 flex items-center justify-center text-stone-800">
              <QrCode size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-ink-primary font-serif">Front-Desk Arrival & Check-In</h2>
              <p className="text-xs text-ink-muted font-mono">Voucher verification & instant room allocation</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-control text-ink-muted hover:text-ink-primary hover:bg-stone-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Verification Form */}
        <form onSubmit={handleVerify} className="mb-5">
          <label className="block text-xs font-mono uppercase text-ink-muted mb-1.5 font-medium">
            Scan or Enter Voucher Token / Check-In Code
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                placeholder="e.g. STAY-9F2B4A or RES-A1B2"
                className="input-base !text-xs font-mono uppercase tracking-wider pl-8 w-full"
                autoFocus
              />
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
            </div>
            <button
              type="submit"
              disabled={verifying || !tokenInput.trim()}
              className="btn-primary !text-xs !py-2 !px-4 inline-flex items-center gap-1.5 flex-shrink-0"
            >
              {verifying ? 'Verifying...' : 'Verify Pass'}
            </button>
          </div>
        </form>

        {error && (
          <div className="card-base p-3.5 mb-5 border-red-200 bg-red-50/70 text-xs text-red-800 flex items-start gap-2.5">
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="card-base p-4 mb-5 border-emerald-200 bg-emerald-50/70 text-xs text-emerald-900 flex items-start gap-2.5">
            <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-emerald-700" />
            <div>
              <p className="font-semibold text-emerald-950 mb-0.5">{successMessage}</p>
              <p className="text-[11px] text-emerald-800">
                Floor map updated in real time via Server-Sent Events. Room status is now marked Occupied.
              </p>
            </div>
          </div>
        )}

        {/* Verified Guest Dossier */}
        {verifiedVoucher && (
          <div className="space-y-4">
            <div className="card-base p-4 border-stone-200 bg-stone-50/60">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-200/70">
                <div className="flex items-center gap-2">
                  <span className="tag-signature">
                    № {verifiedVoucher.checkInCode || verifiedVoucher.verificationToken}
                  </span>
                  <span className="text-xs font-medium text-ink-primary">
                    {verifiedVoucher.hotel?.name}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <ShieldCheck size={11} />
                  <span>Verified Pass</span>
                </span>
              </div>

              {/* Grid Metadata */}
              <div className="grid grid-cols-2 gap-3 text-xs mb-3 font-mono">
                <div>
                  <span className="text-[10px] text-ink-muted uppercase block">Guest Name</span>
                  <span className="font-semibold text-ink-primary text-sm">
                    {verifiedVoucher.guest?.name || 'Guest'}
                  </span>
                  <span className="text-[11px] text-ink-secondary block font-sans">
                    {verifiedVoucher.guest?.email || 'N/A'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-ink-muted uppercase block">Room Allocation</span>
                  <span className="font-semibold text-ink-primary text-sm">
                    Key № {verifiedVoucher.room?.roomNumbers?.join(', ') || 'Unassigned'}
                  </span>
                  <span className="text-[11px] text-ink-secondary block font-sans">
                    {verifiedVoucher.room?.type || 'Standard Suite'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-ink-muted uppercase block">Stay Window</span>
                  <span className="text-ink-primary tabular-nums">
                    {formatDate(verifiedVoucher.dates?.checkIn)} — {formatDate(verifiedVoucher.dates?.checkOut)}
                  </span>
                  <span className="text-[11px] text-ink-muted block">
                    ({verifiedVoucher.dates?.nights || 1} nights · {verifiedVoucher.guest?.guestsCount || 1} guests)
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-ink-muted uppercase block">Settlement & Gateway</span>
                  <span className="font-semibold text-ink-primary tabular-nums">
                    {formatCurrency(verifiedVoucher.payment?.totalAmount)}
                  </span>
                  <span className="text-[11px] text-ink-secondary block">
                    Status: <strong className="text-ink-primary">{verifiedVoucher.payment?.status}</strong>
                    {verifiedVoucher.payment?.utr && ` (UTR: ${verifiedVoucher.payment.utr.slice(-6)})`}
                  </span>
                </div>
              </div>

              {/* Housekeeping / Check-In Notes */}
              <div className="pt-3 border-t border-stone-200/70">
                <label className="block text-xs font-mono text-ink-muted mb-1">
                  Arrival & Front-Desk Instructions
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Physical keycard issued, welcome beverage served, luggage delivered"
                  className="w-full text-xs p-2 rounded-control border border-stone-200 focus:border-stone-900 focus:outline-none bg-white font-sans"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() =>
                  window.open(
                    `${API_BASE_URL}/bookings/${verifiedVoucher.bookingId}/voucher?format=html&token=${localStorage.getItem('accessToken') || ''}`,
                    '_blank'
                  )
                }
                className="btn-secondary !text-xs !py-2 w-full sm:w-auto inline-flex items-center justify-center gap-1.5"
              >
                <Ticket size={13} className="text-stone-500" />
                <span>View Full Voucher Pass</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn-secondary !text-xs !py-2 flex-1 sm:flex-initial"
                >
                  Clear
                </button>
                <button
                  type="button"
                  disabled={checkingIn}
                  onClick={handleConfirmCheckIn}
                  className="btn-primary !text-xs !py-2 !px-4 flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={13} />
                  <span>{checkingIn ? 'Occupying Room...' : 'Confirm Arrival & Occupy'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckInStationModal;

