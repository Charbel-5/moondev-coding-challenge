import { SubmissionResponse } from '@/types/submission';
import { FiCheckCircle, FiClock, FiThumbsUp, FiThumbsDown } from 'react-icons/fi';

interface SubmissionStatusProps {
  submission: SubmissionResponse;
}

export default function SubmissionStatus({ submission }: SubmissionStatusProps) {
  const renderStatusCard = () => {
    switch (submission.status) {
      case 'pending':
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center">
              <FiClock className="text-yellow-500 w-8 h-8 mr-4" />
              <div>
                <h3 className="font-bold text-lg text-yellow-700">Under Review</h3>
                <p className="text-yellow-600">
                  Your submission is being evaluated by our team. We'll provide feedback soon.
                </p>
              </div>
            </div>
          </div>
        );
      case 'accepted':
        return (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center">
              <FiThumbsUp className="text-green-500 w-8 h-8 mr-4" />
              <div>
                <h3 className="font-bold text-lg text-green-700">Welcome to the Team!</h3>
                <p className="text-green-600">
                  We're excited to have you join us. Our team will contact you with next steps.
                </p>
                {submission.feedback && (
                  <div className="mt-4 p-3 bg-white rounded-md">
                    <p className="font-medium text-sm text-gray-500">Feedback from evaluator:</p>
                    <p className="text-gray-700">{submission.feedback}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'rejected':
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <FiThumbsDown className="text-red-500 w-8 h-8 mr-4" />
              <div>
                <h3 className="font-bold text-lg text-red-700">We Are Sorry</h3>
                <p className="text-red-600">
                  Unfortunately, we won't be moving forward with your application at this time.
                </p>
                {submission.feedback && (
                  <div className="mt-4 p-3 bg-white rounded-md">
                    <p className="font-medium text-sm text-gray-500">Feedback from evaluator:</p>
                    <p className="text-gray-700">{submission.feedback}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center">
              <FiCheckCircle className="text-blue-500 w-8 h-8 mr-4" />
              <div>
                <h3 className="font-bold text-lg text-blue-700">Submission Received</h3>
                <p className="text-blue-600">
                  Your application has been submitted successfully.
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  return renderStatusCard();
}