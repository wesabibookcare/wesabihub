import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  MapPin,
  Filter,
  LayoutGrid,
  List,
  Navigation,
  Star,
  Clock,
  ShieldCheck,
  ChevronRight,
  Globe,
  CheckCircle2,
  Phone,
  Building2
} from 'lucide-react';
import { CustomerLayout } from '@/src/layouts/CustomerLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Badge } from '@/src/components/ui/Badge';
import { centreEngine } from '@/src/engines';
import { configurationEngine } from '@/src/engines';
import { searchService } from '@/src/services/SearchService';
import { DiscoveryEngine } from '@/src/components/DiscoveryEngine';
import { HubCenter } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { toast } from 'sonner';

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
  'Delta': ['Aniocha North', 'Aniocha South', 'Bomadi', 'Burutu', 'Ethiope East', 'Ethiope West', 'Ika North East', 'Ika South', 'Isoko North', 'Isoko South', 'Ndokwa East', 'Ndokwa West', 'Okpe', 'Oshimili North', 'Oshimili South', 'Patani', 'Sapele', 'Udu', 'Ughelli North', 'Ughelli South', 'Ukwuani', 'Uvwie', 'Warri North', 'Warri South', 'Warri South West'],
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

export const FindHubPointPage = () => {
  const [hubs, setHubs] = useState<HubCenter[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('Nigeria');
  const [selectedState, setSelectedState] = useState('');
  const [selectedLGA, setSelectedLGA] = useState('');
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<string[]>(Object.keys(NIGERIAN_STATES_LGAS).sort());
  const [lgas, setLgas] = useState<string[]>([]); // Added LGA state

  useEffect(() => {
    // Fetch all countries
    configurationEngine.getAllCountries().then(setCountries);
    // Initial search
    searchService.searchPoints('').then(setHubs);
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const results = await centreEngine.searchHubs({
        country: selectedCountry,
        state: selectedState,
        lga: selectedLGA,
        query: searchQuery
    });
    setHubs(results);
    if (results.length === 0) {
        toast.info("No hubs found matching your search criteria.");
    }
  };

  const handleFindNearMe = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const results = await centreEngine.listNearbyHubs(latitude, longitude, 10);
                if (results.length === 0) {
                    toast.info("No hubs found within 10km of your location.");
                } else {
                    setHubs(results);
                    toast.success(`Found ${results.length} hubs near you.`);
                }
            } catch (error) {
                toast.error("Failed to fetch hubs near your location.");
            }
        }, (error) => {
            toast.error("Unable to retrieve your location. Please ensure location services are enabled.");
        });
    } else {
        toast.error("Geolocation is not supported by your browser.");
    }
  };

  return (
    <CustomerLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold dark:text-white font-display">Find WeSabiHub Point</h1>
            <p className="text-slate-600 dark:text-slate-300">Locate the nearest verified center to send or receive your parcels.</p>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
             <button
               onClick={() => setViewMode('grid')}
               className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-primary-600 text-white shadow-md" : "text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800")}
             >
                 <LayoutGrid size={20} />
             </button>
             <button
               onClick={() => setViewMode('list')}
               className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-primary-600 text-white shadow-md" : "text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800")}
             >
                 <List size={20} />
             </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1 space-y-6">
                 <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-6">
                   <div className="flex items-center justify-between">
                      <h3 className="font-bold dark:text-white">Filters</h3>
                      <Button variant="text" size="sm" className="text-primary-600 font-bold p-0" onClick={() => { setSearchQuery(''); setSelectedState(''); setSelectedCountry('Nigeria'); setSelectedLGA(''); handleSearch(); }}>Reset</Button>
                   </div>

                   <div className="space-y-4">
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Country</label>
                         <select
                           value={selectedCountry}
                           onChange={(e) => setSelectedCountry(e.target.value)}
                           className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm font-semibold outline-none focus:ring-2 focus:ring-primary-500/20 dark:text-white"
                         >
                            <option value="Nigeria">Nigeria</option>
                            {countries.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                         </select>
                      </div>

                      <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">State / Region</label>
                         <select
                           value={selectedState}
                           onChange={(e) => {
                             setSelectedState(e.target.value);
                             setSelectedLGA('');
                           }}
                           className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm font-semibold outline-none focus:ring-2 focus:ring-primary-500/20 dark:text-white"
                         >
                            <option value="">All States</option>
                            {states.map(s => <option key={s} value={s}>{s}</option>)}
                         </select>
                      </div>

                      <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">LGA / Area</label>
                         <select
                           value={selectedLGA}
                           onChange={(e) => setSelectedLGA(e.target.value)}
                           disabled={!selectedState}
                           className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm font-semibold outline-none focus:ring-2 focus:ring-primary-500/20 dark:text-white disabled:opacity-50"
                         >
                            <option value="">All LGAs / Areas</option>
                            {selectedState && NIGERIAN_STATES_LGAS[selectedState]?.map(lga => (
                              <option key={lga} value={lga}>{lga}</option>
                            ))}
                         </select>
                      </div>

                      <Button
                        className="w-full h-12 rounded-xl mt-4"
                        onClick={() => handleSearch()}
                      >
                         <Search size={18} className="mr-2" /> Find Hubs
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full h-12 rounded-xl mt-2"
                        onClick={() => handleFindNearMe()}
                      >
                         <Navigation size={18} className="mr-2" /> Find Hubs Near Me
                      </Button>
                   </div>
                </Card>

               {/* Map Promotion */}
               <Card className="p-6 bg-slate-900 border-none text-white overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/20 blur-3xl rounded-full" />
                  <div className="relative z-10 space-y-4">
                     <Globe className="text-primary-400" size={32} />
                     <h4 className="font-bold font-display">Interactive Map</h4>
                     <p className="text-xs text-slate-800 leading-relaxed">Visualize all hubs on a live map with real-time route optimization.</p>
                     <Button className="w-full h-10 rounded-xl bg-primary-600 hover:bg-primary-700" onClick={() => setViewMode('map')}>Open Map View</Button>
                  </div>
               </Card>
            </div>

            {/* Results Area */}
            <div className="lg:col-span-3 space-y-6">
               <form onSubmit={handleSearch} className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-800 group-focus-within:text-primary-600 transition-colors" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by city, area, or hub name..."
                    className="w-full h-16 pl-12 pr-40 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all dark:text-white text-lg font-medium"
                  />
                  <div className="absolute right-2 top-2 bottom-2">
                     <Button
                       type="submit"
                       className="h-full px-8 rounded-xl bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-500/20 font-bold"
                     >
                       <Search size={20} className="mr-2" /> Search Hubs
                     </Button>
                  </div>
               </form>

                <AnimatePresence mode="wait">
                  {viewMode === 'map' ? (
                    <motion.div
                      key="map"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-[600px] w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
                    >
                      <DiscoveryEngine points={hubs} />
                    </motion.div>
                  ) : viewMode === 'grid' ? (
                    <motion.div
                      key="grid"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="grid sm:grid-cols-2 gap-6"
                    >
                       {hubs.map((hub) => (
                         <Card key={hub.id} className="p-6 border-slate-200 dark:border-slate-800 group hover:border-primary-500 transition-all duration-300 relative overflow-hidden bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between h-full">
                            <div className="space-y-4">
                               <div className="flex items-start justify-between">
                                  <div>
                                     <span className="text-[10px] font-black uppercase tracking-widest text-primary-600 block mb-1">{hub.type?.replace('_', ' ') || 'Logistics Point'}</span>
                                     <h3 className="font-bold font-display text-lg dark:text-white flex items-center gap-1.5 group-hover:text-primary-600 transition-colors">
                                        {hub.name}
                                        {hub.isVerified && <ShieldCheck size={18} className="text-primary-500 fill-primary-50" />}
                                     </h3>
                                  </div>
                                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                                     <Badge variant="success" className="text-[9px] font-black">
                                        {hub.tier || 'Bronze'}
                                     </Badge>
                                     {(hub as any).distanceKm !== undefined && (
                                        <Badge variant="outline" className="text-[9px] font-bold border-primary-500/20 text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-950/20 py-0.5 flex items-center gap-0.5">
                                           <Navigation size={8} className="fill-current rotate-45" />
                                           {(hub as any).distanceKm} km
                                        </Badge>
                                     )}
                                  </div>
                               </div>

                               <div className="flex items-center gap-1 text-yellow-400">
                                  {[...Array(5)].map((_, i) => (
                                     <Star
                                       key={i}
                                       size={14}
                                       fill={i < (hub.starRating || Math.ceil(hub.rating || 4)) ? "currentColor" : "none"}
                                       className={i < (hub.starRating || Math.ceil(hub.rating || 4)) ? "text-yellow-400" : "text-slate-200 dark:text-slate-700"}
                                     />
                                  ))}
                                  <span className="text-xs text-slate-600 dark:text-slate-300 font-bold ml-1">({hub.reviews || 12})</span>
                               </div>

                               <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                                  <p className="flex items-center gap-2">
                                     <MapPin size={14} className="text-slate-400 shrink-0" />
                                     <span className="truncate">{hub.address}, {hub.city}</span>
                                  </p>
                                  <p className="flex items-center gap-2">
                                     <Clock size={14} className="text-slate-400 shrink-0" />
                                     <span>{hub.operatingHours || '8:00 AM - 6:00 PM'}</span>
                                  </p>
                                  <p className="flex items-center gap-2">
                                     <ShieldCheck size={14} className="text-slate-400 shrink-0" />
                                     <span className="text-emerald-600 dark:text-emerald-400 font-bold">{hub.trustScore || 85}% Trust Score</span>
                                  </p>
                               </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-6">
                               <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{(hub as any).totalPoints || 0} WeSabiPoints</span>
                               <Button size="sm" className="rounded-xl font-bold bg-primary-600 hover:bg-primary-700 h-9" onClick={() => {
                                  localStorage.setItem('selected_hub', JSON.stringify(hub));
                                  toast.success(`Selected "${hub.name}" as your active hub point!`);
                               }}>
                                  Select Hub <ChevronRight size={14} className="ml-1" />
                               </Button>
                            </div>
                         </Card>
                       ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="list"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                       {hubs.map((hub) => (
                         <Card key={hub.id} className="p-4 border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center gap-6 hover:border-primary-500 transition-colors bg-white dark:bg-slate-900/50 w-full justify-between">
                            <div className="flex items-center gap-4 flex-1">
                               <div className="p-3 bg-primary-50 dark:bg-primary-950/20 text-primary-600 rounded-2xl shrink-0">
                                  <Building2 size={24} />
                               </div>
                               <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                     <h3 className="font-bold font-display dark:text-white flex items-center gap-1.5">
                                        {hub.name}
                                        {hub.isVerified && <ShieldCheck size={16} className="text-primary-500" />}
                                     </h3>
                                     <Badge variant="success" className="text-[8px]">{hub.tier || 'Bronze'}</Badge>
                                     {(hub as any).distanceKm !== undefined && (
                                        <Badge variant="outline" className="text-[8px] font-bold border-primary-500/20 text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-950/20 py-0.5 flex items-center gap-0.5">
                                           <Navigation size={8} className="fill-current rotate-45" />
                                           {(hub as any).distanceKm} km away
                                        </Badge>
                                     )}
                                  </div>
                                   <p className="text-xs text-slate-600 dark:text-slate-300 truncate flex items-center gap-1.5">
                                     <MapPin size={12} /> {hub.address}, {hub.city}, {hub.state}
                                  </p>
                               </div>
                            </div>

                            <div className="flex items-center gap-6 justify-between w-full md:w-auto shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                               <div className="text-left md:text-right space-y-1">
                                  <div className="flex items-center gap-1 text-yellow-400 justify-start md:justify-end">
                                     {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          size={12}
                                          fill={i < (hub.starRating || Math.ceil(hub.rating || 4)) ? "currentColor" : "none"}
                                          className={i < (hub.starRating || Math.ceil(hub.rating || 4)) ? "text-yellow-400" : "text-slate-200 dark:text-slate-700"}
                                        />
                                     ))}
                                  </div>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">{hub.trustScore || 85}% Trust Score • {(hub as any).totalPoints || 0} pts</p>
                               </div>
                               <Button size="sm" className="rounded-xl font-bold bg-primary-600 hover:bg-primary-700 h-9 shrink-0" onClick={() => {
                                  localStorage.setItem('selected_hub', JSON.stringify(hub));
                                  toast.success(`Selected "${hub.name}" as your active hub point!`);
                               }}>
                                  Select Hub <ChevronRight size={14} className="ml-1" />
                               </Button>
                            </div>
                         </Card>
                       ))}
                    </motion.div>
                  )}
               </AnimatePresence>
            </div>
         </div>
      </div>
    </CustomerLayout>
  );
};
