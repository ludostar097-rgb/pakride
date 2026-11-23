import React, { useState } from 'react';
import { Star, CheckCircle2 } from 'lucide-react';

interface RideRatingModalProps {
  rideId: string;
  driverName?: string;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  onDismiss: () => void;
  loading: boolean;
}

export const RideRatingModal: React.FC<RideRatingModalProps> = ({
  rideId,
  driverName = 'Captain',
  onSubmit,
  onDismiss,
  loading
}) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(rating, comment.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center">
        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>

        <div>
          <h3 className="font-bold text-lg text-charcoal-900">Trip Completed!</h3>
          <p className="text-xs text-slate-500 mt-1">
            How was your ride with <strong className="text-slate-800">{driverName}</strong>?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star selector */}
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-1 hover:scale-110 transition"
              >
                <Star
                  className={`w-7 h-7 ${
                    star <= rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-200 fill-slate-100'
                  }`}
                />
              </button>
            ))}
          </div>

          <textarea
            rows={2}
            placeholder="Share feedback on cleanliness, driving, etc. (Optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pakgreen-500 outline-none resize-none"
          />

          <div className="space-y-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-pakgreen-500 hover:bg-pakgreen-600 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
            >
              {loading ? 'Submitting Review...' : 'Submit Rating & Done'}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              Skip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
