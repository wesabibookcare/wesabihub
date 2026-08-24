import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { CustomerLayout } from '@/src/layouts/CustomerLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { Input } from '@/src/components/ui/Input';
import { cn } from '@/src/lib/utils';
import { FlutterwavePayment } from '@/src/components/payment/FlutterwavePayment';
import { useAuth } from '@/src/context/AuthContext';
import { configurationEngine } from '@/src/engines';
import { HubCenter, Parcel } from '@/src/types';
import { toast } from 'sonner';
import {
  User,
  MapPin,
  Package,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Info,
  ShieldCheck,
  CreditCard,
  Truck,
  Box,
  Scale,
  Maximize2,
  Search,
  Zap,
  Loader2,
  Building2,
  Calendar,
  Globe
} from 'lucide-react';
import { GoogleContactPickerModal } from '@/src/components/common/GoogleContactPickerModal';
import { AddToGoogleCalendarModal } from '@/src/components/common/AddToGoogleCalendarModal';
import { GoogleContact } from '@/src/services/googleService';
import {
  workflowEngine,
  centreEngine
} from '@/src/engines';

const NIGERIAN_STATES_LGAS: Record<string, string[]> = {
  'Abia': ['Aba North', 'Aba South', 'Arochukwu', 'Bende', 'Ikwuano', 'Isiala Ngwa North', 'Isiala Ngwa South', 'Isuikwuato', 'Obi Ngwa', 'Ohafia', 'Osisioma', 'Ugwunagbo', 'Ukwa East', 'Ukwa West', 'Umuahia North', 'Umuahia South', 'Umunneochi'],
  'Adamawa': ['Demsa', 'Fufure', 'Ganye', 'Gayuk', 'Gombi', 'Girei', 'Hong', 'Jada', 'Lamurde', 'Madagali', 'Maiha', 'Mayo Belwa', 'Michika', 'Mubi North', 'Mubi South', 'Numan', 'Shelleng', 'Song', 'Toungo', 'Yola North', 'Yola South'],
  'Akwa Ibom': ['Abak', 'Eastern Obolo', 'Eket', 'Esit Eket', 'Essien Udim', 'Etim Ekpo', 'Etinan', 'Ibeno', 'Ibesikpo Asutan', 'Ibiono-Ibom', 'Ika', 'Ikono', 'Ikot Abasi', 'Ikot Ekpene', 'Ini', 'Itu', 'Mbo', 'Mkpat-Enin', 'Nsit-Atai', 'Nsit-Ibom', 'Nsit-Ubium', 'Obot Akara', 'Okobo', 'Onna', 'Oron', 'Oruk Anam', 'Udung-Uko', 'Ukanafun', 'Uruan', 'Urue-Offong/Oruko', 'Uyo'],
  'Anambra': ['Aguata', 'Anambra East', 'Anambra West', 'Anaocha', 'Awka North', 'Awka South', 'Ayamelum', 'Dunukofia', 'Ekwusigo', 'Idemili North', 'Idemili South', 'Ihiala', 'Njikoka', 'Nnewi North', 'Nnewi South', 'Ogbaru', 'Onitsha North', 'Onitsha South', 'Orumba North', 'Orumba South', 'Oyi'],
  'Bauchi': ['Alkaleri', 'Bauchi', 'Bogoro', 'Damban', 'Darazo', 'Dass', 'Gamawa', 'Ganjuwa', 'Giade', 'Itas/Gadau', 'Jama\'are', 'Katagum', 'Kirfi', 'Misau', 'Ningi', 'Shira', 'Tafawa Balewa', 'Toro', 'Warji', 'Zaki'],
  'Bayelsa': ['Brass', 'Ekeremor', 'Kolokuma/Opokuma', 'Nembe', 'Ogbia', 'Sagbama', 'Southern Ijaw', 'Yenagoa'],
  'Benue': ['Agatu', 'Apa', 'Ado', 'Buruku', 'Gboko', 'Guma', 'Gwer East', 'Gwer West', 'Katsina-Ala', 'Konshisha', 'Kwande', 'Logo', 'Makurdi', 'Obi', 'Ogbadibo', 'Ohimini', 'Oju', 'Okpokwu', 'Oturkpo', 'Tarka', 'Ukum', 'Ushongo', 'Vandeikya'],
  'Borno': ['Abadam', 'Askira/Uba', 'Bama', 'Bayo', 'Biu', 'Chibok', 'Damboa', 'Dikwa', 'Gubio', 'Guzamala', 'Gwoza', 'Hawul', 'Jere', 'Kaga', 'Kala/Balge', 'Konduga', 'Kukawa', 'Kwaya Kusar', 'Mafa', 'Magumeri', 'Maiduguri', 'Marte', 'Mobbar', 'Monguno', 'Ngala', 'Nganzai', 'Shani'],
  'Cross River': ['Abi', 'Akamkpa', 'Akpabuyo', 'Bakassi', 'Bekwarra', 'Biase', 'Boki', 'Calabar Municipal', 'Calabar South', 'Etung', 'Ikom', 'Obanliku', 'Obubra', 'Obudu', 'Odukpani', 'Ogoja', 'Yakuur', 'Yala'],
  'Delta': ['Aniocha North', 'Aniocha South', 'Bomadi', 'Burutu', 'Ethiope East', 'Ethiope West', 'Ika North East', 'Ika South', 'Isoko North', 'Isoko South', 'Ndokwa East', 'Ndokwa West', 'Okpe', 'Oshimili North', 'Oshimili South', 'Patani', 'Sapele', 'Udu', 'Ughelli North', 'Ughelli South', 'Ukwuani', 'Uvwie', 'Warri North', 'Warri South West'],
  'Ebonyi': ['Abakaliki', 'Afikpo North', 'Afikpo South', 'Ebonyi', 'Ezza North', 'Ezza South', 'Ikwo', 'Ishielu', 'Ivo', 'Izzi', 'Ohaozara', 'Ohaukwu', 'Onicha'],
  'Edo': ['Akoko-Edo', 'Egor', 'Esan Central', 'Esan North-East', 'Esan South-East', 'Esan West', 'Etsako Central', 'Etsako East', 'Etsako West', 'Igueben', 'Ikpoba Okha', 'Orhionmwon', 'Oredo', 'Ovia North-East', 'Ovia South-West', 'Owan East', 'Owan West', 'Uhunmwonde'],
  'Ekiti': ['Ado Ekiti', 'Efon', 'Ekiti East', 'Ekiti Southwest', 'Ekiti West', 'Emure', 'Gbonyin', 'Ido Osi', 'Ijero', 'Ikere', 'Ikole', 'Ilejemeje', 'Irepodun/Ifelodun', 'Ise/Orun', 'Moba', 'Oye'],
  'Enugu': ['Aninri', 'Awgu', 'Enugu East', 'Enugu North', 'Enugu South', 'Ezeagu', 'Igbo Etiti', 'Igbo Eze North', 'Igbo Eze South', 'Isi Uzo', 'Nkanu East', 'Nkanu West', 'Nsukka', 'Oji River', 'Udenu', 'Udi', 'Uzo-Uwani'],
  'FCT - Abuja': ['Abaji', 'Bwari', 'Gwagwalada', 'Kuje', 'Kwali', 'Municipal Area Council'],
  'Gombe': ['Akko', 'Balanga', 'Billiri', 'Dukku', 'Funakaye', 'Gombe', 'Kaltungo', 'Kwami', 'Nafada', 'Shongom', 'Yamaltu/Deba'],
  'Imo': ['Aboh Mbaise', 'Ahiazu Mbaise', 'Ehime Mbano', 'Ezinihitte', 'Ideato North', 'Ideato South', 'Ihitte/Uboma', 'Ikeduru', 'Isiala Mbano', 'Isu', 'Mbaitoli', 'Ngor Okpala', 'Njaba', 'Nkwerre', 'Nwangele', 'Obowo', 'Oguta', 'Ohaji/Egbema', 'Okigwe', 'Orlu', 'Orsu', 'Oru East', 'Oru West', 'Owerri Municipal', 'Owerri North', 'Owerri West', 'Unuimo'],
  'Jigawa': ['Auyo', 'Babura', 'Biriniwa', 'Birnin Kudu', 'Buji', 'Dutse', 'Gagarawa', 'Garki', 'Gumel', 'Guri', 'Gwaram', 'Gwiwa', 'Hadejia', 'Jahun', 'Kafur', 'Kaugama', 'Kazaure', 'Kiri Kasama', 'Kiyawa', 'Maigatari', 'Malam Madori', 'Miga', 'Ringim', 'Roni', 'Sule Tankarkar', 'Taura', 'Yankwashi'],
  'Kaduna': ['Birnin Gwari', 'Chikun', 'Giwa', 'Igabi', 'Ikara', 'Jaba', 'Jema\'a', 'Kachia', 'Kaduna North', 'Kaduna South', 'Kagarko', 'Kajuru', 'Kaura', 'Kauru', 'Kubau', 'Kudan', 'Lere', 'Makarfi', 'Sabon Gari', 'Sanga', 'Soba', 'Zangon Kataf', 'Zaria'],
  'Kano': ['Ajingi', 'Albasu', 'Bagwai', 'Bebeji', 'Bichi', 'Bunkure', 'Dala', 'Dambatta', 'Dawakin Kudu', 'Dawakin Tofa', 'Doguwa', 'Fagge', 'Gabasawa', 'Garko', 'Garun Mallam', 'Gaya', 'Gezawa', 'Gwale', 'Gwarzo', 'Kabo', 'Kano Municipal', 'Karaye', 'Kibiya', 'Kiru', 'Kumbotso', 'Kunchi', 'Kura', 'Madobi', 'Makoda', 'Minjibir', 'Nasarawa', 'Rano', 'Rimin Gado', 'Rogo', 'Shanono', 'Sumaila', 'Takai', 'Tarauni', 'Tofa', 'Tsanyawa', 'Tudun Wada', 'Ungogo', 'Warawa', 'Wudil'],
  'Katsina': ['Bakori', 'Batagarawa', 'Batsari', 'Baure', 'Bindawa', 'Charanchi', 'Dandume', 'Danji', 'Dan Musa', 'Daura', 'Dutsin Ma', 'Faskari', 'Funtua', 'Ingawa', 'Jibia', 'Kafur', 'Kaita', 'Kankara', 'Kankia', 'Kantom', 'Katsina', 'Kurfi', 'Kusada', 'Mai\'Adua', 'Malumfashi', 'Mani', 'Mashi', 'Musawa', 'Rimi', 'Sabuwa', 'Safana', 'Sandamu', 'Zango'],
  'Kebbi': ['Aleiro', 'Arewa Dandi', 'Argungu', 'Augie', 'Bagudo', 'Birnin Kebbi', 'Bunza', 'Dandi', 'Fakai', 'Gwandu', 'Jega', 'Kalgo', 'Koko/Besse', 'Maiyama', 'Ngaski', 'Sakaba', 'Shanga', 'Suru', 'Wasagu/Danko', 'Yauri', 'Zuru'],
  'Kogi': ['Adavi', 'Ajaokuta', 'Ankpa', 'Bassa', 'Dekina', 'Ibaji', 'Idah', 'Igalamela Odolu', 'Ijumu', 'Kabba/Bunu', 'Kogi', 'Lokoja', 'Mopa Muro', 'Ofu', 'Ogori/Magongo', 'Okehi', 'Okene', 'Olamaboro', 'Omala', 'Yagba East', 'Yagba West'],
  'Kwara': ['Asa', 'Baruten', 'Edu', 'Ekiti', 'Ifelodun', 'Ilorin East', 'Ilorin South', 'Ilorin West', 'Irepodun', 'Isin', 'Kaiama', 'Moro', 'Offa', 'Oke Ero', 'Oyun', 'Pategi'],
  'Lagos': ['Agege', 'Ajeromi-Ifelodun', 'Alimosho', 'Amuwo-Odofin', 'Apapa', 'Badagry', 'Epe', 'Eti Osa', 'Ibeju-Lekki', 'Ifako-Ijaiye', 'Ikeja', 'Ikorodu', 'Kosofe', 'Lagos Island', 'Lagos Mainland', 'Mushin', 'Ojo', 'Oshodi-Isolo', 'Shomolu', 'Surulere'],
  'Nasarawa': ['Akwanga', 'Awe', 'Doma', 'Karu', 'Keana', 'Keffi', 'Kokona', 'Lafia', 'Nasarawa', 'Nasarawa Egon', 'Obi', 'Toto', 'Wamba'],
  'Niger': ['Agaie', 'Agwara', 'Bida', 'Borgu', 'Bosso', 'Chanchaga', 'Edati', 'Gbako', 'Gurara', 'Katcha', 'Kontagora', 'Lapai', 'Lavun', 'Magama', 'Mariga', 'Mashegu', 'Mokwa', 'Moya', 'Paikoro', 'Rafi', 'Rijau', 'Shiroro', 'Suleja', 'Tafa', 'Wushishi'],
  'Ogun': ['Abeokuta North', 'Abeokuta South', 'Ado-Odo/Ota', 'Egbado North', 'Egbado South', 'Ewekoro', 'Ifo', 'Ijebu East', 'Ijebu North', 'Ijebu North East', 'Ijebu Ode', 'Ikenne', 'Imeko Afon', 'Ipokia', 'Obafemi Owode', 'Odeda', 'Odogbolu', 'Ogun Waterside', 'Remo North', 'Shagamu'],
  'Ondo': ['Akoko North-East', 'Akoko North-West', 'Akoko South-West', 'Akoko South-East', 'Akure North', 'Akure South', 'Ese Odo', 'Idanre', 'Ifedore', 'Ilaje', 'Ile Oluji/Okeigbo', 'Irele', 'Odigbo', 'Okitipupa', 'Ondo East', 'Ondo West', 'Ose', 'Owo'],
  'Osun': ['Atakunmosa East', 'Atakunmosa West', 'Aiyedaade', 'Aiyedire', 'Boluwaduro', 'Boripe', 'Ede East', 'Ede West', 'Egbado South', 'Egbedore', 'Ejigbo', 'Ife Central', 'Ife East', 'Ife North', 'Ife South', 'Ifedayo', 'Ifelodun', 'Ila', 'Ilesa East', 'Ilesa West', 'Irepodun', 'Irewole', 'Isokan', 'Iwo', 'Obokun', 'Odo Otin', 'Ola Oluwa', 'Olorunda', 'Oriade', 'Orolu', 'Osogbo'],
  'Oyo': ['Afijio', 'Akinyele', 'Atiba', 'Atisbo', 'Egbeda', 'Ibadan North', 'Ibadan North-East', 'Ibadan North-West', 'Ibadan South-East', 'Ibadan South-West', 'Ibarapa Central', 'Ibarapa East', 'Ibarapa North', 'Ido', 'Irepo', 'Iseyin', 'Itesiwaju', 'Iwajowa', 'Kajola', 'Lagelu', 'Ogbomosho North', 'Ogbomosho South', 'Ogo Oluwa', 'Olorunsogo', 'Oluyole', 'Ona Ara', 'Orelope', 'Ori Ire', 'Oyo East', 'Oyo West', 'Saki East', 'Saki West', 'Surulere'],
  'Plateau': ['Bokkos', 'Barkin Ladi', 'Bassa', 'Jos East', 'Jos North', 'Jos South', 'Kanam', 'Kanke', 'Langtang North', 'Langtang South', 'Mangu', 'Mikang', 'Pankshin', 'Qua\'an Pan', 'Riyom', 'Shendam', 'Wase'],
  'Rivers': ['Abua/Odual', 'Ahoada East', 'Ahoada West', 'Akuku Toru', 'Andoni', 'Asari-Toru', 'Bonny', 'Degema', 'Eleme', 'Emuoha', 'Etche', 'Gokana', 'Ikwerre', 'Khana', 'Obio/Akpor', 'Ogba/Egbema/Ndoni', 'Ogu/Bolo', 'Okrika', 'Omuma', 'Opobo/Nkoro', 'Oyigbo', 'Port Harcourt', 'Tai'],
  'Sokoto': ['Binji', 'Bodinga', 'Dange Shuni', 'Gada', 'Goronyo', 'Gudu', 'Gwadabawa', 'Illela', 'Isa', 'Kebbe', 'Kware', 'Rabah', 'Sabon Birni', 'Shagari', 'Silame', 'Sokoto North', 'Sokoto South', 'Tambuwal', 'Tangaza', 'Tureta', 'Wamako', 'Wurno', 'Yabo'],
  'Taraba': ['Ardo Kola', 'Bali', 'Donga', 'Gashaka', 'Gassol', 'Ibi', 'Jalingo', 'Karim Lamido', 'Kumi', 'Lau', 'Sardauna', 'Takum', 'Ussa', 'Wukari', 'Yentu', 'Zing'],
  'Yobe': ['Bade', 'Bursari', 'Damaturu', 'Fika', 'Fune', 'Geidam', 'Gujba', 'Gulani', 'Jakusko', 'Karasuwa', 'Karawa', 'Machina', 'Nangere', 'Nguru', 'Potiskum', 'Tarmuwa', 'Yunusari', 'Yusufari'],
  'Zamfara': ['Anka', 'Bakura', 'Birnin Magaji/Kiyaw', 'Bukkuyum', 'Bungudu', 'Gummi', 'Gusau', 'Kaura Namoda', 'Maradun', 'Maru', 'Shinkafi', 'Talata Mafara', 'Chafe', 'Zurmi']
};

const STEPS = [
  'Sender',
  'Recipient',
  'Parcel',
  'Drop-off',
  'Destination',
  'Options',
  'Review',
  'Payment',
  'Success'
];

export const SendParcelPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState<'WALLET' | 'CARD' | 'BANK' | 'FLUTTERWAVE'>('BANK');
  const [showFlutterwave, setShowFlutterwave] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hubs, setHubs] = useState<HubCenter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [countries, setCountries] = useState<any[]>([]);
  const [states] = useState<string[]>(Object.keys(NIGERIAN_STATES_LGAS).sort());
  const [filterParams, setFilterParams] = useState({ country: 'Nigeria', state: '', lga: '', query: '' });
  const [isContactPickerOpen, setIsContactPickerOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  const handleSelectContact = (contact: GoogleContact) => {
    updateFormData({
      recipientName: contact.name,
      recipientPhone: contact.phone || formData.recipientPhone,
      recipientEmail: contact.email || formData.recipientEmail,
    });
  };

  const handleFilter = async () => {
    setLoading(true);
    try {
      const results = await centreEngine.searchHubs({
        country: filterParams.country,
        state: filterParams.state,
        lga: filterParams.lga,
        query: searchQuery
      });
      setHubs(results);
      if (results.length === 0) {
        toast.info("No hubs found matching your search criteria.");
      } else {
        toast.success(`Found ${results.length} matching hubs.`);
      }
    } catch (err) {
      console.error('Failed to filter hubs:', err);
      toast.error('Failed to filter hubs.');
    } finally {
      setLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    senderName: user?.displayName || '',
    senderPhone: user?.phone || user?.phoneNumber || '',
    recipientName: '',
    recipientPhone: '',
    recipientEmail: '',
    weight: '1.5',
    category: 'Electronics',
    isFragile: false,
    insurance: true,
    specialInstructions: '',
    dropOffHubId: '',
    destinationHubId: '',
    deliveryMethod: 'standard' as 'standard' | 'express',
    dimensions: { l: 0, w: 0, h: 0 },
    trackingNumber: '',
    dropOffHubName: ''
  });

  useEffect(() => {
    const fetchHubs = async () => {
      try {
        const allHubs = await centreEngine.getAllHubs();
        setHubs(allHubs);
        if (allHubs.length > 0) {
          setFormData(prev => ({
            ...prev,
            dropOffHubId: allHubs[0].id,
            destinationHubId: allHubs[1]?.id || allHubs[0].id
          }));
        }
      } catch (err) {
        console.error('Failed to fetch hubs:', err);
      }
    };
    fetchHubs();
    configurationEngine.getActiveCountries().then(setCountries).catch(console.error);
  }, []);

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleContinue = () => {
    if (currentStep === 0) {
      if (!formData.senderName || !formData.senderPhone) {
        toast.error('Please enter sender name and phone number.');
        return;
      }
    }
    if (currentStep === 1) {
      if (!formData.recipientName || !formData.recipientPhone) {
        toast.error('Please enter recipient name and phone number.');
        return;
      }
    }
    if (currentStep === 3) {
      if (!formData.dropOffHubId) {
        toast.error('Please select a drop-off hub.');
        return;
      }
    }
    if (currentStep === 4) {
      if (!formData.destinationHubId) {
        toast.error('Please select a destination hub.');
        return;
      }
    }
    if (currentStep === 6) {
      // Validate review before payment
      if (!formData.recipientName || !formData.recipientPhone || !formData.dropOffHubId || !formData.destinationHubId) {
        toast.error('Please complete all shipment details.');
        return;
      }
    }
    if (currentStep === 7) {
      if (selectedMethod === 'CARD' && !showFlutterwave) {
        setShowFlutterwave(true);
        return;
      }
      if (selectedMethod === 'WALLET') {
        handleCreateShipment('WALLET');
        return;
      }
      if (selectedMethod === 'BANK') {
        handleCreateShipment('BANK');
        return;
      }
    }
    nextStep();
  };

  const handleCreateShipment = async (paymentMethod: 'WALLET' | 'CARD' | 'BANK' | 'FLUTTERWAVE') => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await workflowEngine.runParcelCreationWorkflow(
        user.uid,
        {
          recipientInfo: {
            name: formData.recipientName,
            phone: formData.recipientPhone,
            email: formData.recipientEmail
          },
          originCenterId: formData.dropOffHubId,
          destinationCenterId: formData.destinationHubId,
          weightKg: Number(formData.weight),
          dimensions: formData.dimensions,
          deliveryMethod: formData.deliveryMethod as any
        },
        paymentMethod
      );

      if (response.success && response.data) {
        const parcel = response.data;
        const dropOffHub = hubs.find(h => h.id === formData.dropOffHubId);

        setFormData(prev => ({
          ...prev,
          trackingNumber: parcel.trackingNumber,
          dropOffHubName: dropOffHub?.name || 'Selected Hub'
        }));
        toast.success('Parcel booked successfully!');
        nextStep();
      } else {
        toast.error(response.message || 'Failed to create shipment.');
      }
    } catch (e) {
      console.error('Error creating shipment:', e);
      toast.error('Failed to create shipment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Sender
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold dark:text-white">Sender Information</h2>
              <p className="text-slate-900">Confirm your details as the sender.</p>
            </div>
            <div className="grid gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold dark:text-white">Full Name</label>
                <Input
                  value={formData.senderName}
                  onChange={(e) => updateFormData({ senderName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold dark:text-white">Phone Number</label>
                <Input
                  value={formData.senderPhone}
                  onChange={(e) => updateFormData({ senderPhone: e.target.value })}
                />
              </div>
            </div>
          </motion.div>
        );
      case 1: // Recipient
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold dark:text-white">Recipient Information</h2>
                <p className="text-slate-900">Who are you sending this parcel to?</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsContactPickerOpen(true)}
                className="rounded-xl border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100 flex items-center gap-2 text-xs font-semibold"
              >
                <Globe size={16} className="text-blue-600" />
                <span>Import from Google Contacts</span>
              </Button>
            </div>
            <div className="grid gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold dark:text-white">Recipient's Full Name</label>
                <Input
                  placeholder="Enter full name"
                  value={formData.recipientName}
                  onChange={(e) => updateFormData({ recipientName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold dark:text-white">Recipient's Phone Number</label>
                <Input
                  placeholder="+234 000 000 0000"
                  value={formData.recipientPhone}
                  onChange={(e) => updateFormData({ recipientPhone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold dark:text-white">Recipient's Email (Optional)</label>
                <Input
                  placeholder="email@example.com"
                  value={formData.recipientEmail}
                  onChange={(e) => updateFormData({ recipientEmail: e.target.value })}
                />
              </div>
              <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 flex gap-3 text-primary-600">
                <Info size={20} className="shrink-0" />
                <p className="text-sm font-medium">The recipient will receive a secure pickup code via SMS once the parcel arrives.</p>
              </div>
            </div>
          </motion.div>
        );
      case 2: // Parcel
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold dark:text-white">Parcel Details</h2>
              <p className="text-slate-900">Tell us more about the package.</p>
            </div>
            <div className="grid gap-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold dark:text-white">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => updateFormData({ category: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 outline-none"
                  >
                    <option>Electronics</option>
                    <option>Documents</option>
                    <option>Clothing</option>
                    <option>Books</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold dark:text-white">Weight (kg)</label>
                  <Input
                    type="number"
                    value={formData.weight}
                    step="0.1"
                    onChange={(e) => updateFormData({ weight: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold dark:text-white">Dimensions (cm)</label>
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    placeholder="L"
                    type="number"
                    value={formData.dimensions.l || ''}
                    onChange={(e) => updateFormData({ dimensions: { ...formData.dimensions, l: Number(e.target.value) } })}
                  />
                  <Input
                    placeholder="W"
                    type="number"
                    value={formData.dimensions.w || ''}
                    onChange={(e) => updateFormData({ dimensions: { ...formData.dimensions, w: Number(e.target.value) } })}
                  />
                  <Input
                    placeholder="H"
                    type="number"
                    value={formData.dimensions.h || ''}
                    onChange={(e) => updateFormData({ dimensions: { ...formData.dimensions, h: Number(e.target.value) } })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer" onClick={() => updateFormData({ isFragile: !formData.isFragile })}>
                <input
                  type="checkbox"
                  checked={formData.isFragile}
                  onChange={() => {}} // handled by click on parent
                  className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="font-semibold dark:text-white">Fragile Item</span>
              </div>
            </div>
          </motion.div>
        );
      case 3: // Drop-off Hub
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold dark:text-white">Choose Drop-off Point</h2>
              <p className="text-slate-900">Select where you will hand over the parcel.</p>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-800" />
                  <input
                    type="text"
                    placeholder="Search hub name or area..."
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-white dark:bg-slate-800 border-none text-sm font-semibold outline-none focus:ring-2 focus:ring-primary-500/20 dark:text-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select
                    className="h-12 px-4 rounded-xl bg-white dark:bg-slate-800 border-none text-sm font-semibold outline-none focus:ring-2 focus:ring-primary-500/20 dark:text-white"
                    value={filterParams.country}
                    onChange={(e) => setFilterParams({...filterParams, country: e.target.value})}
                  >
                    <option value="">All Countries</option>
                    <option value="Nigeria">Nigeria</option>
                    {countries.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                  <select
                    className="h-12 px-4 rounded-xl bg-white dark:bg-slate-800 border-none text-sm font-semibold outline-none focus:ring-2 focus:ring-primary-500/20 dark:text-white"
                    value={filterParams.state}
                    onChange={(e) => setFilterParams({...filterParams, state: e.target.value, lga: ''})}
                  >
                    <option value="">All States</option>
                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select
                    className="h-12 px-4 rounded-xl bg-white dark:bg-slate-800 border-none text-sm font-semibold outline-none focus:ring-2 focus:ring-primary-500/20 dark:text-white disabled:opacity-50"
                    value={filterParams.lga}
                    onChange={(e) => setFilterParams({...filterParams, lga: e.target.value})}
                    disabled={!filterParams.state}
                  >
                    <option value="">All LGAs / Areas</option>
                    {filterParams.state && NIGERIAN_STATES_LGAS[filterParams.state]?.map(lga => (
                      <option key={lga} value={lga}>{lga}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    onClick={async () => {
                      setFilterParams({ country: 'Nigeria', state: '', lga: '', query: '' });
                      setSearchQuery('');
                      const all = await centreEngine.getAllHubs();
                      setHubs(all);
                      toast.success("Filters reset.");
                    }}
                    variant="outline"
                    className="rounded-xl h-12 px-6 font-bold"
                  >
                    Reset
                  </Button>
                  <Button
                    onClick={() => handleFilter()}
                    className="rounded-xl h-12 px-8 font-bold shadow-lg shadow-primary-500/20"
                  >
                    Filter Hubs
                  </Button>
                </div>
              </div>
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {hubs.length === 0 ? (
                  <div className="p-12 text-center text-slate-800">
                    <MapPin size={40} className="mx-auto mb-3 opacity-20" />
                    <p>No hubs found matching your search.</p>
                  </div>
                ) : hubs.map((hub) => (
                  <Card
                    key={hub.id}
                    onClick={() => updateFormData({ dropOffHubId: hub.id })}
                    className={cn(
                      "p-5 cursor-pointer transition-all border-slate-200 dark:border-slate-800 hover:shadow-md",
                      formData.dropOffHubId === hub.id ? "ring-2 ring-primary-500 bg-primary-50/50 dark:bg-primary-900/10" : "hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    <div className="flex items-center justify-between">
                       <div className="flex gap-4">
                          <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-primary-600 shrink-0">
                             <Building2 size={24} />
                          </div>
                          <div className="space-y-1">
                             <p className="font-bold dark:text-white text-base">{hub.name}</p>
                             <p className="text-xs text-slate-900 flex items-center gap-1">
                                <MapPin size={12} /> {hub.address}, {hub.city}
                             </p>
                             <div className="flex items-center gap-2 mt-1">
                                <Badge variant="success" className="text-[9px] py-0">{hub.trustScore || 85}% Trust</Badge>
                                <span className="text-[10px] text-slate-800 font-bold uppercase tracking-wider">{hub.operatingHours || '8am - 9pm'}</span>
                             </div>
                          </div>
                       </div>
                       <div className={cn(
                         "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                         formData.dropOffHubId === hub.id ? "bg-primary-600 border-primary-600 text-white" : "border-slate-200"
                       )}>
                          {formData.dropOffHubId === hub.id && <CheckCircle2 size={14} />}
                       </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </motion.div>
        );
      case 4: // Destination Hub
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold dark:text-white">Choose Destination Point</h2>
              <p className="text-slate-900">Where should the recipient pick up the parcel?</p>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-800" />
                  <input
                    type="text"
                    placeholder="Search destination city or hub..."
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-white dark:bg-slate-800 border-none text-sm font-semibold outline-none focus:ring-2 focus:ring-primary-500/20 dark:text-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select
                    className="h-12 px-4 rounded-xl bg-white dark:bg-slate-800 border-none text-sm font-semibold outline-none focus:ring-2 focus:ring-primary-500/20 dark:text-white"
                    value={filterParams.country}
                    onChange={(e) => setFilterParams({...filterParams, country: e.target.value})}
                  >
                    <option value="">All Countries</option>
                    <option value="Nigeria">Nigeria</option>
                    {countries.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                  <select
                    className="h-12 px-4 rounded-xl bg-white dark:bg-slate-800 border-none text-sm font-semibold outline-none focus:ring-2 focus:ring-primary-500/20 dark:text-white"
                    value={filterParams.state}
                    onChange={(e) => setFilterParams({...filterParams, state: e.target.value, lga: ''})}
                  >
                    <option value="">All States</option>
                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select
                    className="h-12 px-4 rounded-xl bg-white dark:bg-slate-800 border-none text-sm font-semibold outline-none focus:ring-2 focus:ring-primary-500/20 dark:text-white disabled:opacity-50"
                    value={filterParams.lga}
                    onChange={(e) => setFilterParams({...filterParams, lga: e.target.value})}
                    disabled={!filterParams.state}
                  >
                    <option value="">All LGAs / Areas</option>
                    {filterParams.state && NIGERIAN_STATES_LGAS[filterParams.state]?.map(lga => (
                      <option key={lga} value={lga}>{lga}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    onClick={async () => {
                      setFilterParams({ country: 'Nigeria', state: '', lga: '', query: '' });
                      setSearchQuery('');
                      const all = await centreEngine.getAllHubs();
                      setHubs(all);
                      toast.success("Filters reset.");
                    }}
                    variant="outline"
                    className="rounded-xl h-12 px-6 font-bold"
                  >
                    Reset
                  </Button>
                  <Button
                    onClick={() => handleFilter()}
                    className="rounded-xl h-12 px-8 font-bold shadow-lg shadow-primary-500/20"
                  >
                    Filter Hubs
                  </Button>
                </div>
              </div>
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {hubs.length === 0 ? (
                  <div className="p-12 text-center text-slate-800">
                    <MapPin size={40} className="mx-auto mb-3 opacity-20" />
                    <p>No hubs found matching your search.</p>
                  </div>
                ) : hubs.map((hub) => (
                  <Card
                    key={hub.id}
                    onClick={() => updateFormData({ destinationHubId: hub.id })}
                    className={cn(
                      "p-5 cursor-pointer transition-all border-slate-200 dark:border-slate-800 hover:shadow-md",
                      formData.destinationHubId === hub.id ? "ring-2 ring-primary-500 bg-primary-50/50 dark:bg-primary-900/10" : "hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    <div className="flex items-center justify-between">
                       <div className="flex gap-4">
                          <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-primary-600 shrink-0">
                             <Building2 size={24} />
                          </div>
                          <div className="space-y-1">
                             <p className="font-bold dark:text-white text-base">{hub.name}</p>
                             <p className="text-xs text-slate-900 flex items-center gap-1">
                                <MapPin size={12} /> {hub.address}, {hub.city}
                             </p>
                             <div className="flex items-center gap-2 mt-1">
                                <Badge variant="success" className="text-[9px] py-0">{hub.trustScore || 85}% Trust</Badge>
                                <span className="text-[10px] text-slate-800 font-bold uppercase tracking-wider">{hub.operatingHours || '8am - 9pm'}</span>
                             </div>
                          </div>
                       </div>
                       <div className={cn(
                         "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                         formData.destinationHubId === hub.id ? "bg-primary-600 border-primary-600 text-white" : "border-slate-200"
                       )}>
                          {formData.destinationHubId === hub.id && <CheckCircle2 size={14} />}
                       </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </motion.div>
        );
      case 5: // Options
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold dark:text-white">Delivery Options</h2>
              <p className="text-slate-900">Select how quickly you want it delivered.</p>
            </div>
            <div className="space-y-4">
               {[
                 { id: 'standard', title: 'Standard Delivery', time: '2-4 Business Days', price: '₦1,200', icon: Truck },
                 { id: 'express', title: 'Express Delivery', time: '1-2 Business Days', price: '₦2,500', icon: Zap },
               ].map((option) => (
                 <Card
                  key={option.id}
                  onClick={() => updateFormData({ deliveryMethod: option.id as 'standard' | 'express' })}
                  className={cn(
                    "p-6 cursor-pointer flex items-center justify-between border-slate-200 dark:border-slate-800 transition-all",
                    formData.deliveryMethod === option.id ? "ring-2 ring-primary-500 bg-primary-50/50 dark:bg-primary-900/10 shadow-lg" : "hover:bg-slate-50 dark:hover:bg-slate-800"
                  )}
                >
                    <div className="flex items-center gap-4">
                       <div className={cn(
                         "w-12 h-12 rounded-xl shadow-sm flex items-center justify-center transition-colors",
                         formData.deliveryMethod === option.id ? "bg-primary-600 text-white" : "bg-white dark:bg-slate-800 text-primary-600"
                       )}>
                          <option.icon size={24} />
                       </div>
                       <div className="space-y-1">
                          <p className="font-bold dark:text-white">{option.title}</p>
                          <p className="text-sm text-slate-900">{option.time}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-primary-600">{option.price}</span>
                      {formData.deliveryMethod === option.id && <CheckCircle2 className="text-primary-600" size={20} />}
                    </div>
                 </Card>
               ))}
               <div className="flex items-center justify-between p-6 rounded-2xl bg-slate-900 text-white">
                  <div className="flex items-center gap-3">
                     <ShieldCheck className="text-primary-400" />
                     <div>
                        <p className="font-bold">Shipping Insurance</p>
                        <p className="text-xs text-slate-800">Coverage up to ₦500,000</p>
                     </div>
                  </div>
                  <Badge variant="info" className="bg-primary-500/20 text-primary-400 border-none">+ ₦200</Badge>
               </div>
            </div>
          </motion.div>
        );
      case 6: // Review
        const dropOffHub = hubs.find(h => h.id === formData.dropOffHubId);
        const destHub = hubs.find(h => h.id === formData.destinationHubId);
        const baseFee = formData.deliveryMethod === 'express' ? 2500 : 1200;
        const insuranceFee = 200;
        const total = baseFee + insuranceFee;

        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold dark:text-white">Review Shipment</h2>
              <p className="text-slate-900">Confirm everything is correct before payment.</p>
            </div>
            <div className="grid gap-6">
               <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                     <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">Sender</p>
                     <p className="font-bold dark:text-white">{formData.senderName}</p>
                     <p className="text-sm text-slate-900">{formData.senderPhone}</p>
                  </div>
                  <div className="space-y-3">
                     <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">Recipient</p>
                     <p className="font-bold dark:text-white">{formData.recipientName || 'Not Set'}</p>
                     <p className="text-sm text-slate-900">{formData.recipientPhone || 'Not Set'}</p>
                  </div>
               </div>
               <div className="h-px bg-slate-100 dark:bg-slate-800" />
               <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                     <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">Drop-off Hub</p>
                     <p className="font-bold dark:text-white">{dropOffHub?.name || 'Not Selected'}</p>
                     <p className="text-xs text-slate-800">{dropOffHub?.address}</p>
                  </div>
                  <div className="space-y-3">
                     <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">Destination Hub</p>
                     <p className="font-bold dark:text-white">{destHub?.name || 'Not Selected'}</p>
                     <p className="text-xs text-slate-800">{destHub?.address}</p>
                  </div>
               </div>
               <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex justify-between">
                     <span className="text-slate-900">Delivery Fee ({formData.deliveryMethod})</span>
                     <span className="font-bold dark:text-white">₦{baseFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-slate-900">Insurance</span>
                     <span className="font-bold dark:text-white">₦{insuranceFee.toLocaleString()}</span>
                  </div>
                  <div className="h-px bg-slate-200 dark:bg-slate-800" />
                  <div className="flex justify-between text-lg">
                     <span className="font-bold dark:text-white">Total Amount</span>
                     <span className="font-bold text-primary-600">₦{total.toLocaleString()}</span>
                  </div>
               </div>
            </div>
          </motion.div>
        );
      case 7: // Payment
        const totalAmount = (formData.deliveryMethod === 'express' ? 2500 : 1200) + 200;
        if (showFlutterwave) {
          return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <FlutterwavePayment
                amount={totalAmount}
                customerEmail={user?.email || 'wesabibookcare@gmail.com'}
                customerName={formData.senderName}
                customerPhone={formData.senderPhone}
                shipmentId={`SH-${Date.now()}`}
                trackingNumber="PENDING"
                onSuccess={(response) => {
                  console.log("Payment success:", response);
                  handleCreateShipment('FLUTTERWAVE');
                }}
                onClose={() => setShowFlutterwave(false)}
              />
            </motion.div>
          );
        }

        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
             <div className="text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary-600 mx-auto">
                   <CreditCard size={40} />
                </div>
                <h2 className="text-2xl font-bold dark:text-white">Payment Method</h2>
                <p className="text-slate-900">Choose how you want to pay for this shipment.</p>
             </div>
             <div className="space-y-4">
                {[
                  { id: 'BANK', label: 'Bank Transfer', sub: 'Instant bank-to-bank verification via Paystack', active: true },
                  { id: 'WALLET', label: 'OmorfiHub Wallet', sub: 'Pay directly from your wallet balance', active: true },
                  { id: 'CARD', label: 'Credit / Debit Card', sub: 'Temporarily disabled for normal platform payments', active: false },
                ].map((method) => {
                  const isSelected = selectedMethod === method.id;
                  return (
                    <Card
                      key={method.id}
                      onClick={() => {
                        if (!method.active) {
                          toast.error('Card payments are temporarily disabled for platform payments. Please select Bank Transfer or Wallet.');
                          return;
                        }
                        setSelectedMethod(method.id as any);
                      }}
                      className={cn(
                        "p-6 cursor-pointer border-slate-200 dark:border-slate-800 hover:border-primary-500 flex items-center gap-4 transition-all duration-200",
                        !method.active && "opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-900/50 hover:border-slate-200",
                        isSelected && method.active && "border-primary-500 ring-2 ring-primary-500/20 bg-primary-50/10 dark:bg-primary-950/10"
                      )}
                    >
                       <div className={cn(
                         "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                         isSelected && method.active ? "bg-primary-100 text-primary-600 dark:bg-primary-950 dark:text-primary-400" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                       )}>
                          <CreditCard size={20} />
                       </div>
                       <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold dark:text-white">{method.label}</p>
                            {!method.active && (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                                Temporarily Disabled
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{method.sub}</p>
                       </div>
                       <ChevronRight size={20} className={cn("transition-transform", isSelected && method.active ? "text-primary-600 translate-x-1" : "text-slate-400")} />
                    </Card>
                  );
                })}
             </div>
          </motion.div>
        );
      case 8: // Success
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8 py-10"
          >
             <div className="w-32 h-32 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30">
                <CheckCircle2 size={64} className="animate-bounce-slow" />
             </div>
             <div className="space-y-4">
                <h2 className="text-4xl font-bold dark:text-white font-display">Shipment Created!</h2>
                <p className="text-xl text-slate-900">Your parcel is ready for drop-off.</p>
             </div>
             <Card className="p-8 max-w-sm mx-auto border-dashed border-2 border-primary-500 bg-primary-50/50 dark:bg-primary-900/10">
                <p className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-2">Tracking Reference</p>
                <p className="text-4xl font-black text-primary-600 font-mono tracking-tighter">{formData.trackingNumber || 'WSH-GENERATING'}</p>
             </Card>
             <div className="space-y-4 max-w-md mx-auto">
                <p className="text-slate-900">
                   Please take your parcel to <strong>{formData.dropOffHubName}</strong> and show this tracking reference to the hub manager.
                </p>
                <div className="flex flex-col gap-3">
                  <Button
                    type="button"
                    onClick={() => setIsCalendarModalOpen(true)}
                    className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 shadow-md"
                  >
                    <Calendar size={18} />
                    <span>Sync Drop-off Reminder to Google Calendar</span>
                  </Button>
                  <div className="flex flex-col sm:flex-row gap-4">
                     <Button
                       onClick={() => toast.success('Shipment receipt downloaded successfully as PDF.')}
                       className="flex-1 h-14 rounded-2xl text-lg font-bold"
                     >
                       Download Receipt
                     </Button>
                     <Button variant="outline" className="flex-1 h-14 rounded-2xl text-lg" asChild>
                        <Link to="/dashboard">Go to Dashboard</Link>
                     </Button>
                  </div>
                </div>
             </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  const isCustomerOnly = user?.role === 'CUSTOMER' && !user?.roles?.includes('MERCHANT');

  return (
    <CustomerLayout>
      <div className="max-w-3xl mx-auto space-y-10">
        {isCustomerOnly && (
          <Card className="p-8 border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 space-y-4 rounded-3xl">
            <div className="flex items-start gap-4">
              <Info className="text-amber-600 shrink-0 mt-1" size={28} />
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-amber-900 dark:text-amber-300 font-display">
                  Merchant Account Required to Send Parcels
                </h2>
                <p className="text-sm text-amber-800 dark:text-amber-400 leading-relaxed">
                  Individual Customers on OmorfiHub are restricted from creating or sending shipments directly to ensure legal accountability, parcel safety, and SafePay protection. To send parcels, please apply for a Merchant account and complete identity verification.
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                  <Button asChild className="rounded-xl shadow-md">
                    <Link to="/merchant/register">Apply for Merchant Account</Link>
                  </Button>
                  <Button variant="outline" asChild className="rounded-xl">
                    <Link to="/track">Track an Existing Parcel</Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {currentStep < 8 && !isCustomerOnly && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
               <h1 className="text-3xl font-bold dark:text-white font-display">Send a Parcel</h1>
               <span className="text-slate-900 font-bold">Step {currentStep + 1} of {STEPS.length - 1}</span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex gap-1">
               {STEPS.slice(0, -1).map((_, i) => (
                 <div
                   key={i}
                   className={cn(
                     "flex-1 transition-all duration-500",
                     i <= currentStep ? "bg-primary-600" : "bg-transparent"
                   )}
                 />
               ))}
            </div>
          </div>
        )}

        <Card className={cn("p-8 md:p-12 border-slate-200 dark:border-slate-800", currentStep === 8 && "border-none shadow-none bg-transparent")}>
          {renderStep()}

          {currentStep < 8 && !showFlutterwave && (
            <div className="flex justify-between pt-12 mt-12 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="rounded-xl px-8 h-12"
              >
                <ChevronLeft size={20} className="mr-2" /> Back
              </Button>
              <Button
                onClick={handleContinue}
                disabled={loading}
                className="rounded-xl px-8 h-12 min-w-[140px]"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    {currentStep === 7 ? 'Complete Payment' : 'Continue'} <ChevronRight size={20} className="ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}
        </Card>

        {/* Google Integrations Modals */}
        <GoogleContactPickerModal
          isOpen={isContactPickerOpen}
          onClose={() => setIsContactPickerOpen(false)}
          onSelectContact={handleSelectContact}
        />

        <AddToGoogleCalendarModal
          isOpen={isCalendarModalOpen}
          onClose={() => setIsCalendarModalOpen(false)}
          defaultEvent={{
            summary: `OmorfiHub Parcel Drop-off Reminder: ${formData.trackingNumber || 'Pending'}`,
            description: `Please take your parcel to ${formData.dropOffHubName || 'selected drop-off hub'} and present reference ${formData.trackingNumber || 'code'}. Recipient: ${formData.recipientName} (${formData.recipientPhone}).`,
            startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
            location: formData.dropOffHubName,
          }}
        />
      </div>
    </CustomerLayout>
  );
};
