import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import ProfileNav from '../../components/ProfileNav';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const IncomingRequests = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [processingId, setProcessingId] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const limit = 10;

  useEffect(() => {
    if (!token || !user) {
      navigate('/login');
      return;
    }
    if (!['Transporter', 'Distributor'].includes(user.role)) {
      Swal.fire({
        icon: 'error',
        title: 'Access Denied',
        text: 'Only transporters and distributors can view requests',
        confirmButtonColor: '#10b981'
      });
      navigate('/dashboard');
      return;
    }
    fetchRequests();
  }, [token, user, filter, page]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: filter,
        page,
        limit
      });

      const res = await fetch(`${API_BASE_URL}/api/trips/incoming-requests?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to fetch requests');
      const data = await res.json();
      setRequests(data.requests || []);
      setTotal(data.total || 0);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
        confirmButtonColor: '#10b981'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    const result = await Swal.fire({
      title: 'Accept Request',
      text: 'Are you sure you want to accept this request?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Accept',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    setProcessingId(requestId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/trips/requests/${requestId}/accept`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to accept request');
      }

      Swal.fire({
        icon: 'success',
        title: 'Accepted!',
        text: 'Request has been accepted successfully',
        confirmButtonColor: '#10b981',
        timer: 2000
      });

      fetchRequests();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
        confirmButtonColor: '#10b981'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId) => {
    const result = await Swal.fire({
      title: 'Reject Request',
      input: 'textarea',
      inputPlaceholder: 'Reason for rejection (optional)',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Reject',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    setProcessingId(requestId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/trips/requests/${requestId}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          rejectionReason: result.value || 'No reason provided'
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to reject request');
      }

      Swal.fire({
        icon: 'success',
        title: 'Rejected!',
        text: 'Request has been rejected',
        confirmButtonColor: '#10b981',
        timer: 2000
      });

      fetchRequests();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
        confirmButtonColor: '#10b981'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getRequestTypeLabel = (request) => {
    if (user.role === 'Transporter') {
      return '📥 Distributor Request';
    } else {
      return '📤 Transporter Request';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'accepted':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  if (!token || !user) {
    return null;
  }

  return (
    <>
      <ProfileNav active={user.role === 'Transporter' ? 'trips' : 'orders'} />

      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Incoming Requests</h1>
            <p className="text-slate-600">
              {user.role === 'Transporter'
                ? 'View and manage requests from distributors'
                : 'View and manage requests from transporters'}
            </p>
          </div>

          {/* Filters */}
          <div className="mb-6 flex gap-2">
            {['pending', 'accepted', 'rejected'].map(status => (
              <button
                key={status}
                onClick={() => {
                  setFilter(status);
                  setPage(1);
                }}
                className={`rounded-lg px-4 py-2 font-semibold capitalize transition-all ${
                  filter === status
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Requests List */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="text-slate-500">Loading requests...</div>
              </div>
            ) : requests.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-slate-300 p-12 text-center">
                <p className="text-slate-500">No {filter} requests</p>
              </div>
            ) : (
              requests.map(request => (
                <div key={request._id} className="rounded-xl bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="grid gap-6 lg:grid-cols-4">
                    {/* Request Info */}
                    <div className="lg:col-span-2">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            {request.order?.product?.productName}
                          </h3>
                          <p className="text-sm text-slate-600">{getRequestTypeLabel(request)}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusBadgeColor(request.requestStatus)}`}>
                          {request.requestStatus}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm text-slate-600">
                        <p>
                          <strong>Order:</strong> Order #{request.order?._id?.slice(-6).toUpperCase() || 'N/A'}
                        </p>
                        <p>
                          <strong>Quantity:</strong> {request.order?.quantity} {request.order?.product?.unit}
                        </p>
                        <p>
                          <strong>
                            {user.role === 'Transporter' ? 'Distributor' : 'Transporter'}:
                          </strong> {' '}
                          {user.role === 'Transporter'
                            ? request.proposedBy?.businessName || request.proposedBy?.fullName
                            : request.transporter?.businessName || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Delivery Details */}
                    <div className="lg:col-span-1">
                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="text-slate-600">Pickup</p>
                          <p className="font-semibold text-slate-900">
                            {new Date(request.schedule?.scheduledPickup).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-600">Delivery</p>
                          <p className="font-semibold text-slate-900">
                            {new Date(request.schedule?.estimatedDelivery).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Fare & Actions */}
                    <div className="lg:col-span-1">
                      <div className="mb-4">
                        <p className="text-sm text-slate-600">Proposed Fare</p>
                        <p className="text-2xl font-bold text-emerald-600">
                          LKR {request.costs?.totalCost?.toLocaleString() || '0'}
                        </p>
                      </div>

                      {request.requestStatus === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAccept(request._id)}
                            disabled={processingId === request._id}
                            className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-slate-300"
                          >
                            {processingId === request._id ? 'Processing...' : 'Accept'}
                          </button>
                          <button
                            onClick={() => handleReject(request._id)}
                            disabled={processingId === request._id}
                            className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:bg-slate-300"
                          >
                            {processingId === request._id ? 'Processing...' : 'Reject'}
                          </button>
                        </div>
                      )}

                      {request.requestStatus === 'accepted' && (
                        <button
                          onClick={() => navigate(`/trips/${request._id}`)}
                          className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          View Trip
                        </button>
                      )}

                      {request.requestStatus === 'rejected' && (
                        <div className="rounded-lg bg-red-50 p-2">
                          <p className="text-xs text-red-700">
                            <strong>Reason:</strong> {request.rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="rounded-lg border border-slate-300 px-4 py-2 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-slate-600">
                Page {page} of {Math.ceil(total / limit)}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= Math.ceil(total / limit)}
                className="rounded-lg border border-slate-300 px-4 py-2 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default IncomingRequests;
