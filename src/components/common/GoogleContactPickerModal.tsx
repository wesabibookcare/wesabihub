import React, { useState } from 'react';
import { User, Phone, Mail, MapPin, Search, Calendar, RefreshCw, CheckCircle2, Globe } from 'lucide-react';
import { fetchGoogleContacts, connectGoogleServices, getGoogleAccessToken, GoogleContact } from '../../services/googleService';
import { toast } from 'sonner';

interface GoogleContactPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectContact: (contact: GoogleContact) => void;
}

export const GoogleContactPickerModal: React.FC<GoogleContactPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectContact,
}) => {
  const [contacts, setContacts] = useState<GoogleContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isConnected, setIsConnected] = useState(!!getGoogleAccessToken());

  if (!isOpen) return null;

  const handleConnectAndLoad = async () => {
    setLoading(true);
    try {
      let token = getGoogleAccessToken();
      if (!token) {
        token = await connectGoogleServices();
      }
      if (token) {
        setIsConnected(true);
        const contactList = await fetchGoogleContacts(token);
        setContacts(contactList);
        if (contactList.length === 0) {
          toast.info('No contacts found in connected Google account.');
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error loading Google contacts');
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Google Contacts</h3>
              <p className="text-xs text-blue-100">Import address or recipient details instantly</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-xl font-bold p-1 rounded-lg hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {!isConnected || contacts.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <User className="w-8 h-8" />
              </div>
              <div className="max-w-xs mx-auto">
                <h4 className="font-semibold text-gray-900 text-base">Connect Google Account</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Connect your Google account to select contacts directly for parcel delivery and address auto-fill.
                </p>
              </div>
              <button
                onClick={handleConnectAndLoad}
                disabled={loading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 mx-auto disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Loading Contacts...</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4" />
                    <span>{isConnected ? 'Fetch Contacts' : 'Authorize & Fetch Contacts'}</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <>
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search contacts by name, phone or email..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Contacts List */}
              <div className="divide-y divide-gray-100 max-h-[50vh] overflow-y-auto pr-1">
                {filteredContacts.length === 0 ? (
                  <p className="text-center text-sm text-gray-500 py-6">No matching contacts found.</p>
                ) : (
                  filteredContacts.map(contact => (
                    <div
                      key={contact.id}
                      onClick={() => {
                        onSelectContact(contact);
                        toast.success(`Selected contact: ${contact.name}`);
                        onClose();
                      }}
                      className="p-3 hover:bg-blue-50/50 rounded-xl cursor-pointer transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center space-x-3">
                        {contact.photoUrl ? (
                          <img src={contact.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover border" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                            {contact.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm group-hover:text-blue-600">
                            {contact.name}
                          </h4>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-0.5">
                            {contact.phone && (
                              <span className="flex items-center space-x-1">
                                <Phone className="w-3 h-3 text-gray-400" />
                                <span>{contact.phone}</span>
                              </span>
                            )}
                            {contact.email && (
                              <span className="flex items-center space-x-1">
                                <Mail className="w-3 h-3 text-gray-400" />
                                <span>{contact.email}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        Select
                      </span>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>Protected with Google OAuth</span>
          <button onClick={onClose} className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
