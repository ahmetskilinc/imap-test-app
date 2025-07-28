"use client";

import { useState, useEffect } from "react";

interface Email {
  uid: number;
  subject: string;
  from: {
    name?: string;
    address: string;
  };
  date: string;
  flags: Set<string>;
  preview: string;
}

export default function Home() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [emailContent, setEmailContent] = useState<string>("");
  const [loadingContent, setLoadingContent] = useState(false);

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      const response = await fetch("/api/get-emails");
      if (!response.ok) {
        throw new Error("Failed to fetch emails");
      }
      const data = await response.json();
      setEmails(data.emails);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const openEmail = async (email: Email) => {
    setSelectedEmail(email);
    setLoadingContent(true);

    try {
      const response = await fetch(`/api/get-emails?uid=${email.uid}`);
      if (response.ok) {
        const data = await response.json();
        setEmailContent(data.email.content);
      } else {
        setEmailContent(email.preview);
      }
    } catch (err) {
      setEmailContent(email.preview);
    } finally {
      setLoadingContent(false);
    }
  };

  const closeDialog = () => {
    setSelectedEmail(null);
    setEmailContent("");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">iCloud Email Inbox</h1>

        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-700 dark:text-red-400">Error: {error}</p>
          </div>
        )}

        {!loading && !error && emails.length === 0 && <div className="text-center py-12 text-gray-500 dark:text-gray-400">No emails found in your inbox</div>}

        {!loading && !error && emails.length > 0 && (
          <div className="space-y-3">
            {emails.map((email) => (
              <div
                key={email.uid}
                onClick={() => openEmail(email)}
                className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow p-4 border border-gray-200 dark:border-gray-700 cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{email.subject}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">From: {email.from.name || email.from.address}</p>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap ml-4">{formatDate(email.date)}</span>
                </div>
                {email.preview && <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{email.preview}</p>}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={fetchEmails}
          disabled={loading}
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {selectedEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={closeDialog}>
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedEmail.subject}</h2>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">From:</span> {selectedEmail.from.name || selectedEmail.from.address} &lt;{selectedEmail.from.address}&gt;
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Date:</span> {formatDate(selectedEmail.date)}
                    </p>
                  </div>
                </div>
                <button onClick={closeDialog} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loadingContent ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="prose dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{emailContent || "No content available"}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
