import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  doc, 
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { 
  ShieldAlert, 
  X,
  RefreshCcw,
  Globe,
  Info,
  Layers,
  ShieldCheck,
  Search,
  Phone,
  MapPin,
  AlertTriangle,
  Zap,
  Activity,
  ChevronRight,
  Crosshair,
  Clock,
  MessageSquareWarning
} from 'lucide-react';

const firebaseConfig = {
  apiKey: "AIzaSyAoTE62_pJFLSZERX8rZG3-Qqvn4Lc7OyI",
  authDomain: "world-conflict-mon.firebaseapp.com",
  projectId: "world-conflict-mon",
  storageBucket: "world-conflict-mon.firebasestorage.app",
  messagingSenderId: "154826481677",
  appId: "1:154826481677:web:e24aaed64070e21fe8b544",
  measurementId: "G-JJMCFHDY54"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'global-conflict-tracker-prod'; // Khai báo một chuỗi ID cố định cho dự án của bạn
const apiKey = "AIzaSyAoTE62_pJFLSZERX8rZG3-Qqvn4Lc7OyI"; // Giữ nguyên API Key Gemini này

const VIETNAM_EMBASSY_CONTACTS = {
  "Ukraine": { phone: "+380 93 468 1168", address: "51 Pouchkinska, Kiev" },
  "Israel": { phone: "+972 50 818 6116", address: "4th floor, Weizman St 14, Tel Aviv" },
  "Lebanon": { phone: "+84 981 84 84 84", address: "Liên hệ ĐSQ Việt Nam tại Ai Cập kiêm nhiệm" },
  "Myanmar": { phone: "+95 9660888998", address: "70-72 Than Lwin Road, Yangon" },
  "Russia": { phone: "+7 903 681 7599", address: "13 Bolshaya Pirogovskaya, Moscow" },
  "Sudan": { phone: "+20 106 501 1616", address: "Hỗ trợ qua ĐSQ Việt Nam tại Ai Cập" },
  "Iran": { phone: "+98 21 22411670", address: "No. 54, Ejazi St, Tehran" }
};

const DEFAULT_ZONES = [
  {
    id: 'ukraine-conflict-1',
    country_vn: 'Ukraine',
    country: 'Ukraine',
    lat: 48.37,
    lng: 31.16,
    severity: 'high',
    detail: 'Giao tranh tiếp diễn dữ dội tại các mặt trận phía Đông. Tình hình nhân đạo ở khu vực tiền tuyến đang ở mức báo động cao.',
    advisory: 'Khuyến cáo: Tuyệt đối không di chuyển đến các khu vực chiến sự phía Đông và Nam.'
  },
  {
    id: 'ukraine-conflict-2',
    country_vn: 'Ukraine',
    country: 'Ukraine',
    lat: 48.37,
    lng: 31.16,
    severity: 'medium',
    detail: 'Hệ thống hạ tầng năng lượng tại Thủ đô Kiev gặp sự cố diện rộng do oanh kích. Điện và nước sạch luân phiên bị cắt giảm.',
    advisory: 'Khuyến cáo: Công dân tại Kiev cần dự trữ đủ lương thực, nước uống và thiết bị sạc dự phòng.'
  },
  {
    id: 'israel-gaza-1',
    country_vn: 'Israel',
    country: 'Israel',
    lat: 31.04,
    lng: 34.85,
    severity: 'high',
    detail: 'Căng thẳng leo thang nghiêm trọng tại khu vực biên giới phía Nam. Hệ thống phòng không hoạt động liên tục.',
    advisory: 'Khuyến cáo: Hạn chế di chuyển đến khu vực giáp ranh Gaza.'
  },
  {
    id: 'israel-gaza-2',
    country_vn: 'Israel',
    country: 'Israel',
    lat: 31.04,
    lng: 34.85,
    severity: 'medium',
    detail: 'Các cuộc biểu tình quy mô lớn diễn ra tại Tel Aviv gây gián đoạn giao thông và thắt chặt an ninh đô thị.',
    advisory: 'Khuyến cáo: Tránh xa các tụ điểm tập trung đông người và tuân thủ tuyệt đối cảnh báo địa phương.'
  }
];

const ThreeGlobe = ({ zones, onSelect, selectedZone }) => {
  const mountRef = useRef(null);
  const zonesRef = useRef(zones);
  const markersGroupRef = useRef(new THREE.Group());
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);

  useEffect(() => { zonesRef.current = zones; }, [zones]);

  // Camera animation movement to selected grouped zone
  useEffect(() => {
    if (selectedZone && cameraRef.current && controlsRef.current) {
      const lat = parseFloat(selectedZone.lat);
      const lng = parseFloat(selectedZone.lng);
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);
      
      const r = 260; 
      const targetX = -(r * Math.sin(phi) * Math.cos(theta));
      const targetY = r * Math.cos(phi);
      const targetZ = r * Math.sin(phi) * Math.sin(theta);
      
      cameraRef.current.position.set(targetX, targetY, targetZ);
      controlsRef.current.update();
    }
  }, [selectedZone]);

  useEffect(() => {
    const markers = markersGroupRef.current;
    while(markers.children.length > 0) markers.remove(markers.children[0]);
    
    zones.forEach(z => {
      const lat = parseFloat(z.lat);
      const lng = parseFloat(z.lng);
      if (isNaN(lat) || isNaN(lng)) return;

      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);
      const radius = 100.8;
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const y = radius * Math.cos(phi);
      const zPos = radius * Math.sin(phi) * Math.sin(theta);
      
      const isSelected = selectedZone?.id === z.id;
      
      // Pin base visual based on consolidated threat severity
      const pinColor = isSelected ? 0x60a5fa : (z.severity === 'high' ? 0xef4444 : 0xf97316);
      
      // Draw single composite pin for the location group
      const pin = new THREE.Mesh(
        new THREE.SphereGeometry(isSelected ? 4.2 : 3.0, 16, 16), 
        new THREE.MeshBasicMaterial({ color: pinColor })
      );
      pin.position.set(x, y, zPos);
      pin.userData = { id: z.id };
      markers.add(pin);

      // Pulse ring animation
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(isSelected ? 5.0 : 4.0, isSelected ? 7.5 : 6.0, 32), 
        new THREE.MeshBasicMaterial({ 
          color: pinColor, 
          transparent: true, 
          side: THREE.DoubleSide, 
          opacity: 0.8 
        })
      );
      ring.position.set(x, y, zPos);
      ring.lookAt(0, 0, 0);
      ring.userData = { pulse: true, s: 1, speed: isSelected ? 0.04 : 0.02 };
      markers.add(ring);
    });
  }, [zones, selectedZone]);

  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1500);
    camera.position.z = 320;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotateSpeed = 0.4;
    controlsRef.current = controls;

    // Vector border styled high-visibility map
    const geometry = new THREE.SphereGeometry(100, 64, 64);
    const textureLoader = new THREE.TextureLoader();
    
    const earthMaterial = new THREE.MeshPhongMaterial({
      color: 0x111111,
      emissive: 0x0a1a24,
      specular: 0x333333,
      shininess: 5,
    });
    
    textureLoader.load(
      'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
      (texture) => { 
        earthMaterial.map = texture; 
        earthMaterial.color.setHex(0xffffff);
        earthMaterial.needsUpdate = true; 
      }
    );

    const earth = new THREE.Mesh(geometry, earthMaterial);
    scene.add(earth);

    // Matrix grid system overlay
    const gridGeo = new THREE.SphereGeometry(101, 32, 32);
    const gridMat = new THREE.MeshBasicMaterial({ 
      color: 0x3b82f6, 
      wireframe: true, 
      transparent: true, 
      opacity: 0.05 
    });
    scene.add(new THREE.Mesh(gridGeo, gridMat));

    // Atmosphere glowing ring
    const glowGeo = new THREE.SphereGeometry(114, 64, 64);
    const glowMat = new THREE.ShaderMaterial({
      uniforms: {
        'c': { type: 'f', value: 0.25 },
        'p': { type: 'f', value: 4.5 },
        glowColor: { type: 'c', value: new THREE.Color(0x3b82f6) },
        viewVector: { type: 'v3', value: camera.position }
      },
      vertexShader: `
        uniform vec3 viewVector;
        varying float intensity;
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
          vec3 actual_normal = vec3(modelMatrix * vec4(normal, 0.0));
          intensity = pow( dot(normalize(actual_normal), normalize(viewVector)), 4.0 );
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying float intensity;
        void main() {
          vec3 glow = glowColor * intensity;
          gl_FragColor = vec4( glow, intensity );
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true
    });
    scene.add(new THREE.Mesh(glowGeo, glowMat));

    scene.add(markersGroupRef.current);
    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(5, 3, 5);
    scene.add(mainLight);

    const handleClick = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(markersGroupRef.current.children);
      if (intersects.length > 0) {
        const zone = zonesRef.current.find(z => z.id === intersects[0].object.userData.id);
        if (zone) onSelect(zone);
      }
    };
    renderer.domElement.addEventListener('click', handleClick);

    const animate = () => {
      requestAnimationFrame(animate);
      if (controlsRef.current) controlsRef.current.autoRotate = !selectedZone;
      markersGroupRef.current.children.forEach(m => {
        if (m.userData.pulse) {
          m.userData.s += m.userData.speed || 0.02;
          if (m.userData.s > 2) m.userData.s = 1;
          m.scale.set(m.userData.s, m.userData.s, 1);
          m.material.opacity = 0.8 * (1 - (m.userData.s - 1));
        }
      });
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full" />;
};

export default function App() {
  const [user, setUser] = useState(null);
  const [zones, setZones] = useState(DEFAULT_ZONES);
  const [selectedZone, setSelectedZone] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const addNotification = (msg) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, msg }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };

  useEffect(() => {
    const init = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth error:", err);
      } finally {
        setTimeout(() => setIsInitializing(false), 2000);
      }
    };
    init();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'zones');
    return onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setZones(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    });
  }, [user]);

  const groupedZones = React.useMemo(() => {
    const groups = {};
    zones.forEach(z => {
      const key = z.country_vn || z.country;
      if (!groups[key]) {
        groups[key] = {
          id: `group-${key.toLowerCase().replace(/\s+/g, '-')}`,
          country_vn: z.country_vn,
          country: z.country,
          lat: parseFloat(z.lat),
          lng: parseFloat(z.lng),
          severity: z.severity,
          events: []
        };
      }
      
      // Push specific event to this country's event timeline
      groups[key].events.push(z);
      
      // Elevate the entire country's warning level if any sub-event is 'high'
      if (z.severity === 'high') {
        groups[key].severity = 'high';
      }
    });
    return Object.values(groups);
  }, [zones]);

  // Adjust selected group reference if coordinates/list updates
  const activeSelectedGroup = React.useMemo(() => {
    if (!selectedZone) return null;
    return groupedZones.find(g => g.id === selectedZone.id || g.country_vn === selectedZone.country_vn) || null;
  }, [selectedZone, groupedZones]);

  const runScanner = async () => {
    if (loading || !user) return;
    setLoading(true);
    addNotification("Tiến hành quét dữ liệu AI...");
    try {
      const prompt = `Phân tích 5 điểm nóng xung đột quốc tế hiện nay. Tên quốc gia tiếng Anh. Nếu có nhiều sự kiện tại một vùng, hãy cung cấp các sự kiện riêng lẻ nhưng chung country. JSON format: { "zones": [{ "id": "slug", "country_vn": "Tên Việt", "country": "English Name", "lat": number, "lng": number, "severity": "high"|"medium", "detail": "Mô tả cụ thể tin tức", "advisory": "Lời khuyên an ninh" }] }`;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ "google_search": {} }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      const data = await response.json();
      const result = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text);
      if (result?.zones) {
        for (const zone of result.zones) {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'zones', zone.id), { ...zone, timestamp: serverTimestamp() });
        }
        addNotification("Cập nhật mạng lưới thành công");
      }
    } catch (e) {
      addNotification("Lỗi kết nối vệ tinh AI");
    } finally {
      setLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="h-screen w-full bg-[#020408] flex flex-col items-center justify-center">
        <div className="relative mb-8">
           <Globe size={80} className="text-blue-500 animate-spin-slow opacity-20" />
           <div className="absolute inset-0 flex items-center justify-center">
              <Activity size={32} className="text-blue-400 animate-pulse" />
           </div>
           <div className="absolute -inset-4 border border-blue-500/10 rounded-full animate-ping" />
        </div>
        <div className="text-center space-y-4">
           <h2 className="text-xs font-black tracking-[0.8em] text-white uppercase italic">Secure Uplink Establishing</h2>
           <div className="w-64 h-1 bg-white/5 rounded-full overflow-hidden mx-auto">
              <div className="h-full bg-blue-600 animate-progress" />
           </div>
        </div>
        <style>{`
          .animate-spin-slow { animation: spin 10s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes progress { 0% { width: 0%; transform: translateX(-100%); } 50% { width: 40%; } 100% { width: 100%; transform: translateX(200%); } }
          .animate-progress { animation: progress 2.5s infinite ease-in-out; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#020408] text-slate-300 overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Notifications */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className="bg-blue-600/90 backdrop-blur-md text-white text-[10px] font-black uppercase px-6 py-2.5 rounded-full shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 border border-white/20">
            <Zap size={14} fill="currentColor" /> {n.msg}
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-black/40 backdrop-blur-2xl z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <ShieldAlert className="text-red-600" size={28} />
              <div className="absolute -inset-1 bg-red-600 blur-sm opacity-20 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-[0.3em] text-white leading-none italic uppercase">GLOBAL<span className="text-red-600">INTEL</span> CENTER</h1>
              <div className="flex items-center gap-2 mt-2">
                 <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Live Monitoring Active</p>
              </div>
            </div>
          </div>
          <div className="h-10 w-px bg-white/10 hidden lg:block" />
          <div className="hidden lg:flex items-center gap-6">
             <div className="text-center">
                <p className="text-[8px] font-black text-slate-600 uppercase mb-1 tracking-tighter">Bản tin hiện tại</p>
                <p className="text-[10px] font-bold text-blue-400 uppercase">{groupedZones.length} Điểm Nóng Hợp Nhất</p>
             </div>
          </div>
        </div>
        
        <button 
          onClick={runScanner}
          disabled={loading}
          className="group relative px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all disabled:opacity-50 overflow-hidden shadow-2xl shadow-blue-600/20 active:scale-95"
        >
          <div className="flex items-center gap-3 relative z-10">
            {loading ? <RefreshCcw size={16} className="animate-spin" /> : <Search size={16} className="group-hover:scale-110 transition-transform" />}
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Cập nhật mạng lưới AI</span>
          </div>
        </button>
      </header>

      {}
      <main className="flex-1 flex overflow-hidden">
        {/* Globe Visualization */}
        <div className="flex-1 relative bg-[radial-gradient(circle_at_center,_#0a1a2f_0%,_#020408_100%)]">
          <ThreeGlobe zones={groupedZones} onSelect={setSelectedZone} selectedZone={activeSelectedGroup} />
          
          {/* Legend Area */}
          <div className="absolute bottom-12 left-12 space-y-6 pointer-events-none">
            <div className="p-6 border border-white/10 bg-black/60 backdrop-blur-2xl rounded-3xl shadow-2xl space-y-4 w-64 animate-in fade-in slide-in-from-left-4">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2 mb-2">
                <Layers size={14} className="text-blue-500" /> Hệ thống phân cấp
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-2.5 h-2.5 bg-red-600 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.8)]" />
                    <span className="text-[10px] font-bold text-white/90 uppercase tracking-tighter">Nguy hiểm cực độ</span>
                  </div>
                  <div className="h-px flex-1 mx-4 bg-white/5" />
                  <span className="text-[9px] text-red-500 font-black">HIGH</span>
                </div>
                <div className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-2.5 h-2.5 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.4)]" />
                    <span className="text-[10px] font-bold text-white/90 uppercase tracking-tighter">Cảnh báo rủi ro</span>
                  </div>
                  <div className="h-px flex-1 mx-4 bg-white/5" />
                  <span className="text-[9px] text-orange-500 font-black">MED</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 border border-blue-500/20 bg-blue-500/5 rounded-2xl w-fit">
               <Crosshair size={16} className="text-blue-400 animate-pulse" />
               <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-none">Global Vector Grid Sync: 100%</p>
            </div>
          </div>

          {/* Quick List Overlay */}
          <div className="absolute top-12 right-12 flex flex-col gap-3 max-h-[60%] overflow-y-auto no-scrollbar pb-10">
             {groupedZones.map(z => (
               <button 
                key={z.id}
                onClick={() => setSelectedZone(z)}
                className={`flex items-center gap-4 px-6 py-3 border rounded-2xl transition-all backdrop-blur-md group ${activeSelectedGroup?.id === z.id ? 'bg-blue-600 border-blue-400 translate-x-[-12px] shadow-xl shadow-blue-600/30' : 'bg-black/30 border-white/5 hover:border-white/20 hover:bg-white/5'}`}
               >
                 <div className={`w-2 h-2 rounded-full ${z.severity === 'high' ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`} />
                 <div className="flex flex-col items-start gap-0.5">
                   <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${activeSelectedGroup?.id === z.id ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                      {z.country_vn}
                   </span>
                   <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                      {z.events.length} Diễn biến
                   </span>
                 </div>
                 <ChevronRight size={14} className={`ml-2 transition-transform ${activeSelectedGroup?.id === z.id ? 'translate-x-1 opacity-100' : 'opacity-0 group-hover:opacity-40'}`} />
               </button>
             ))}
          </div>
        </div>

        {/* Intelligence Side Panel */}
        {}
        <aside className={`w-[500px] bg-black/60 border-l border-white/10 backdrop-blur-3xl flex flex-col transition-all duration-700 ease-out z-[60] ${activeSelectedGroup ? 'translate-x-0' : 'translate-x-[40px] opacity-0 pointer-events-none'}`}>
          <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-blue-600/20 rounded-xl">
                 <Activity size={20} className="text-blue-500" />
              </div>
              <div>
                 <h2 className="text-xs font-black italic tracking-[0.4em] text-white uppercase leading-none">Báo cáo thực địa</h2>
                 <p className="text-[9px] font-bold text-slate-500 mt-2 uppercase">Gộp nhóm: {activeSelectedGroup?.events.length} tin tức liên quan</p>
              </div>
            </div>
            <button 
               onClick={() => setSelectedZone(null)} 
               className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
            {activeSelectedGroup && (
              <div key={activeSelectedGroup.id} className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-10">
                <div className="space-y-6">
                   <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-red-600/10 border border-red-500/20 text-red-500 rounded-full">
                     <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                     <span className="text-[10px] font-black uppercase tracking-[0.2em]">Cấp độ: {activeSelectedGroup.severity === 'high' ? 'Khẩn cấp tối đa' : 'Cảnh giác cao'}</span>
                   </div>
                   <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-[0.9] break-words">
                    {activeSelectedGroup.country_vn}
                   </h1>
                   <div className="flex items-center gap-4 text-slate-500">
                      <Globe size={14} />
                      <p className="text-xs font-black uppercase tracking-[0.4em] border-l border-white/10 pl-4">{activeSelectedGroup.country} Region</p>
                   </div>
                </div>

                {/* Event feeds chronological layout */}
                <div className="space-y-8">
                  <div className="border-l border-blue-500/30 ml-4 pl-8 space-y-10 relative">
                    {activeSelectedGroup.events.map((event, index) => (
                      <div key={event.id} className="relative group space-y-4">
                        {/* Timeline node */}
                        <div className={`absolute -left-[41px] top-1 w-6 h-6 rounded-full border-4 border-black flex items-center justify-center ${event.severity === 'high' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]'}`}>
                          <Clock size={10} className="text-black font-bold" />
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">DIỄN BIẾN #{index + 1}</span>
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${event.severity === 'high' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'}`}>
                              {event.severity === 'high' ? 'Nghiêm trọng' : 'Chú ý'}
                            </span>
                          </div>
                          
                          <div className="p-6 bg-white/[0.02] rounded-[24px] border border-white/5 space-y-4 hover:bg-white/[0.04] transition-colors">
                            <p className="text-[14px] text-slate-200 leading-relaxed italic font-medium tracking-tight">
                              "{event.detail}"
                            </p>
                            
                            <div className="pt-3 border-t border-white/5 space-y-2">
                              <p className="text-[9px] font-black text-orange-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <MessageSquareWarning size={12} /> Chỉ thị an toàn riêng biệt:
                              </p>
                              <p className="text-[12px] font-medium text-slate-300 leading-relaxed pl-4 border-l border-orange-500/40">
                                {event.advisory}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Consular Hotline section */}
                  <div className="p-10 bg-gradient-to-br from-red-600/20 via-transparent to-transparent border border-red-500/20 rounded-[40px] shadow-3xl">
                    <h4 className="text-[11px] font-black text-red-500 uppercase mb-8 tracking-[0.3em] flex items-center gap-3 border-b border-red-500/10 pb-4">
                      <ShieldCheck size={18} /> Hotline Bảo hộ công dân
                    </h4>
                    
                    {VIETNAM_EMBASSY_CONTACTS[activeSelectedGroup.country] ? (
                      <div className="space-y-8">
                        <div className="group cursor-pointer">
                          <p className="text-[10px] text-red-500 font-black uppercase mb-3 tracking-widest opacity-60">Emergency Line 24/7</p>
                          <div className="flex items-center gap-6 p-4 bg-red-600/10 rounded-3xl border border-red-500/10 hover:bg-red-600/20 transition-all">
                             <div className="p-4 bg-red-600 rounded-2xl shadow-lg shadow-red-600/40">
                                <Phone size={24} className="text-white" />
                             </div>
                             <p className="text-3xl font-black text-white tracking-tighter">{VIETNAM_EMBASSY_CONTACTS[activeSelectedGroup.country].phone}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-6 p-4">
                          <div className="p-4 bg-white/5 rounded-2xl">
                            <MapPin size={24} className="text-slate-500" />
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 font-black uppercase mb-2 tracking-widest">Embassy Location</p>
                            <p className="text-[13px] font-bold text-slate-300 leading-relaxed italic pr-4">{VIETNAM_EMBASSY_CONTACTS[activeSelectedGroup.country].address}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-black/40 rounded-3xl border border-white/5 border-dashed">
                        <p className="text-[12px] font-bold text-slate-400 italic">Vui lòng liên hệ trực tiếp qua Tổng đài Lãnh sự Bộ Ngoại giao:</p>
                        <div className="mt-4 p-4 bg-white/5 rounded-2xl inline-block border border-white/10">
                           <p className="text-2xl font-black text-white">+84 981 84 84 84</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </main>
      
      <footer className="h-12 border-t border-white/5 bg-black/80 backdrop-blur-md px-10 flex items-center justify-between text-[10px] font-bold text-slate-700 tracking-[0.5em] uppercase italic">
         <div className="flex items-center gap-6">
            <span className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" /> 
               Secure Comms: Online
            </span>
            <span className="opacity-40">// Data Latency: 24ms</span>
         </div>
         <div className="flex items-center gap-6">
            <span>Center of Crisis Management - VN</span>
            <span className="opacity-30">OS_V3.1.2</span>
         </div>
      </footer>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(59, 130, 246, 0.3); }
      `}</style>
    </div>
  );
}
