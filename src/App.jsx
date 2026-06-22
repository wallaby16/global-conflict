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
  Zap,
  Activity,
  ChevronRight,
  Crosshair
} from 'lucide-react';

// Khai báo an toàn chống lỗi crash trên GitHub Pages khi không có Firebase thật
let app, auth, db;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'global-conflict-tracker-prod';

// Cấu hình Firebase mặc định
const fallbackFirebaseConfig = {
  apiKey: "AIzaSyFakeKeyForGitHubPagesDemoOnly",
  authDomain: "global-conflict-tracker.firebaseapp.com",
  projectId: "global-conflict-tracker",
  storageBucket: "global-conflict-tracker.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
};

try {
  const config = typeof __firebase_config !== 'undefined' 
    ? JSON.parse(__firebase_config) 
    : fallbackFirebaseConfig;
  
  app = initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase không thể khởi tạo:", e);
}

// Cơ sở dữ liệu tọa độ cố định để ánh xạ khi quét từ khóa tin tức quốc tế
const LOCATION_DATABASE = {
  // Xung đột & Chiến sự
  "ukraine": { country_vn: "Ukraine", country: "Ukraine", lat: 48.37, lng: 31.16, defaultType: "conflict" },
  "israel": { country_vn: "Israel", country: "Israel", lat: 31.04, lng: 34.85, defaultType: "conflict" },
  "gaza": { country_vn: "Gaza (Palestine)", country: "Israel", lat: 31.50, lng: 34.46, defaultType: "conflict" },
  "myanmar": { country_vn: "Myanmar", country: "Myanmar", lat: 21.91, lng: 95.95, defaultType: "conflict" },
  "sudan": { country_vn: "Sudan", country: "Sudan", lat: 12.86, lng: 30.21, defaultType: "conflict" },
  "russia": { country_vn: "Nga", country: "Russia", lat: 61.52, lng: 105.31, defaultType: "conflict" },
  "lebanon": { country_vn: "Lebanon", country: "Lebanon", lat: 33.85, lng: 35.86, defaultType: "conflict" },
  "iran": { country_vn: "Iran", country: "Iran", lat: 32.42, lng: 53.68, defaultType: "conflict" },
  
  // Thiên tai & Khí hậu thường gặp
  "vietnam": { country_vn: "Việt Nam", country: "Vietnam", lat: 14.05, lng: 108.27, defaultType: "disaster" },
  "japan": { country_vn: "Nhật Bản", country: "Japan", lat: 36.20, lng: 138.25, defaultType: "disaster" },
  "philippines": { country_vn: "Philippines", country: "Philippines", lat: 12.87, lng: 121.77, defaultType: "disaster" },
  "indonesia": { country_vn: "Indonesia", country: "Indonesia", lat: -0.78, lng: 113.92, defaultType: "disaster" },
  "united states": { country_vn: "Hoa Kỳ", country: "USA", lat: 37.09, lng: -95.71, defaultType: "disaster" },
  "america": { country_vn: "Hoa Kỳ", country: "USA", lat: 37.09, lng: -95.71, defaultType: "disaster" },
  "china": { country_vn: "Trung Quốc", country: "China", lat: 35.86, lng: 104.19, defaultType: "disaster" },

  // Dịch bệnh y tế
  "congo": { country_vn: "CHDC Congo", country: "Congo", lat: -4.03, lng: 21.75, defaultType: "epidemic" },
  "brazil": { country_vn: "Brazil", country: "Brazil", lat: -14.23, lng: -51.92, defaultType: "epidemic" },
  "india": { country_vn: "Ấn Độ", country: "India", lat: 20.59, lng: 78.96, defaultType: "epidemic" }
};

const VIETNAM_EMBASSY_CONTACTS = {
  "Ukraine": { phone: "+380 93 468 1168", address: "51 Pouchkinska, Kiev" },
  "Israel": { phone: "+972 50 818 6116", address: "4th floor, Weizman St 14, Tel Aviv" },
  "Lebanon": { phone: "+84 981 84 84 84", address: "Liên hệ ĐSQ Việt Nam tại Ai Cập kiêm nhiệm" },
  "Myanmar": { phone: "+95 9660888998", address: "70-72 Than Lwin Road, Yangon" },
  "Russia": { phone: "+7 903 681 7599", address: "13 Bolshaya Pirogovskaya, Moscow" },
  "Sudan": { phone: "+20 106 501 1616", address: "Hỗ trợ qua ĐSQ Việt Nam tại Ai Cập" },
  "Iran": { phone: "+98 21 22411670", address: "No. 54, Ejazi St, Tehran" },
  "Vietnam": { phone: "112 / 114 / 115", address: "Cục Cứu hộ Cứu nạn - Ban Chỉ đạo Phòng chống Thiên tai" },
  "Japan": { phone: "+81 80 3590 7018", address: "Tokyo, Minato-ku, Motofujimicho 4-4-10" }
};

const DEFAULT_ZONES = [
  {
    id: 'ukraine-conflict',
    country_vn: 'Ukraine',
    country: 'Ukraine',
    lat: 48.37,
    lng: 31.16,
    severity: 'high',
    type: 'conflict',
    detail: 'Giao tranh tiếp diễn dữ dội tại các mặt trận phía Đông. Các đợt không kích gây tổn thất cơ sở hạ tầng nghiêm trọng.',
    advisory: 'Khuyến cáo: Tuyệt đối không di chuyển đến các khu vực chiến sự hoặc vùng lân cận.'
  },
  {
    id: 'israel-gaza',
    country_vn: 'Israel',
    country: 'Israel',
    lat: 31.04,
    lng: 34.85,
    severity: 'high',
    type: 'conflict',
    detail: 'Căng thẳng quân sự và các biện pháp phản áp leo thang mạnh mẽ tại khu vực biên giới Nam - Bắc.',
    advisory: 'Công dân cần đăng ký cứu khẩn cấp và theo dõi sát thông báo sơ tán từ Đại sứ quán.'
  },
  {
    id: 'vietnam-disaster',
    country_vn: 'Việt Nam',
    country: 'Vietnam',
    lat: 16.05,
    lng: 108.27,
    severity: 'medium',
    type: 'disaster',
    detail: 'Cảnh báo bão nhiệt đới kèm mưa lũ quét cục bộ đang đổ bộ sâu vào đất liền các tỉnh miền Trung.',
    advisory: 'Chỉ thị: Tránh xa các vùng sạt lở, tích trữ lương thực, theo dõi chặt chẽ radar khí tượng địa phương.'
  }
];

const getSeverityColor = (type, severity) => {
  if (type === 'conflict') return '#ef4444'; // Đỏ rực chiến sự
  if (type === 'disaster') return '#f97316'; // Cam bão lũ/thiên tai
  if (type === 'epidemic') return '#a855f7'; // Tím cảnh báo dịch bệnh dã chiến
  return '#eab308'; // Vàng mức độ cảnh báo nhẹ hơn
};

const ThreeGlobe = ({ zones, onSelect, selectedZone }) => {
  const mountRef = useRef(null);
  const zonesRef = useRef(zones);
  const markersGroupRef = useRef(new THREE.Group());
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);

  useEffect(() => { zonesRef.current = zones; }, [zones]);

  useEffect(() => {
    if (selectedZone && cameraRef.current && controlsRef.current) {
      const lat = parseFloat(selectedZone.lat);
      const lng = parseFloat(selectedZone.lng);
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);
      
      const r = 280; 
      const targetX = -(r * Math.sin(phi) * Math.cos(theta));
      const targetY = r * Math.cos(phi);
      const targetZ = r * Math.sin(phi) * Math.sin(theta);
      
      // Hoạt cảnh di chuyển mượt mà tới khu vực chỉ định
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
      
      // Chọn màu dựa trên loại biến động (Chiến sự, Thiên tai, Dịch bệnh)
      const colorHex = z.type === 'conflict' ? 0xef4444 : z.type === 'disaster' ? 0xf97316 : 0xa855f7;

      const pin = new THREE.Mesh(
        new THREE.SphereGeometry(isSelected ? 3.8 : 2.5, 16, 16), 
        new THREE.MeshBasicMaterial({ color: isSelected ? 0x60a5fa : colorHex })
      );
      pin.position.set(x, y, zPos);
      pin.userData = { id: z.id };
      markers.add(pin);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(isSelected ? 4.5 : 3.5, isSelected ? 6.5 : 5.5, 32), 
        new THREE.MeshBasicMaterial({ 
          color: isSelected ? 0x3b82f6 : colorHex, 
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
    camera.position.z = 350;
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

    // Lưới điện tử bao phủ quả địa cầu
    const gridGeo = new THREE.SphereGeometry(101, 32, 32);
    const gridMat = new THREE.MeshBasicMaterial({ 
      color: 0x3b82f6, 
      wireframe: true, 
      transparent: true, 
      opacity: 0.08 
    });
    scene.add(new THREE.Mesh(gridGeo, gridMat));

    // Hiệu ứng hào quang phát sáng (Glow Effect) bao quanh quả đất
    const glowGeo = new THREE.SphereGeometry(112, 64, 64);
    const glowMat = new THREE.ShaderMaterial({
      uniforms: {
        'c': { type: 'f', value: 0.25 },
        'p': { type: 'f', value: 3.5 },
        glowColor: { type: 'c', value: new THREE.Color(0x3b82f6) },
        viewVector: { type: 'v3', value: camera.position }
      },
      vertexShader: `
        uniform vec3 viewVector;
        varying float intensity;
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
          vec3 actual_normal = vec3(modelMatrix * vec4(normal, 0.0));
          intensity = pow( dot(normalize(actual_normal), normalize(viewVector)), 3.0 );
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying float intensity;
        void main() {
          vec3 glow = glowColor * intensity;
          gl_FragColor = vec4( glow, intensity * 0.5 );
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true
    });
    scene.add(new THREE.Mesh(glowGeo, glowMat));

    scene.add(markersGroupRef.current);
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
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
      if (!mountRef.current) return;
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

  // Tạo định danh ngẫu nhiên cực kỳ an toàn để giải quyết triệt để lỗi trùng khóa key trong React
  const addNotification = (msg) => {
    const id = Math.random().toString(36).substring(2, 11) + Date.now().toString();
    setNotifications(prev => [...prev, { id, msg }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };

  useEffect(() => {
    const init = async () => {
      try {
        if (!auth) throw new Error("Chưa khởi tạo Auth");
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.warn("Chế độ Offline/Local: Hoạt động không cần Đăng nhập Firebase.");
      } finally {
        setTimeout(() => setIsInitializing(false), 2000);
      }
    };
    init();
    if (auth) {
      return onAuthStateChanged(auth, setUser);
    } else {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'zones');
    return onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setZones(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    }, (err) => {
      console.warn("Firestore ngoại tuyến, đang hiển thị chế độ dữ liệu tĩnh mẫu.");
    });
  }, [user]);

  // Bộ lọc từ khóa thông minh để phân loại nguy hại và địa lý từ nguồn RSS
  const analyzeNewsText = (title, content) => {
    const combined = `${title} ${content}`.toLowerCase();
    
    // Từ khóa xác định chủng loại hiểm họa
    const conflictWords = ['military', 'clash', 'strike', 'attack', 'bomb', 'fire', 'missile', 'combat', 'war', 'army', 'xung đột', 'tấn công', 'giao tranh'];
    const disasterWords = ['flood', 'storm', 'earthquake', 'typhoon', 'hurricane', 'drought', 'volcano', 'tsunami', 'landslide', 'lũ', 'bão', 'động đất', 'hạn hán', 'thiên tai'];
    const epidemicWords = ['ebola', 'pandemic', 'epidemic', 'outbreak', 'virus', 'cholera', 'infection', 'disease', 'dengue', 'dịch bệnh', 'bùng phát', 'lây nhiễm'];

    let type = 'conflict'; // Mặc định
    if (disasterWords.some(w => combined.includes(w))) {
      type = 'disaster';
    } else if (epidemicWords.some(w => combined.includes(w))) {
      type = 'epidemic';
    }

    return type;
  };

  // Thiết lập cơ chế chống lỗi CORS và lỗi kết nối mạng an toàn (Fallback proxy)
  const fetchRSSWithFallback = async (rssUrl) => {
    const apiEndpoints = [
      `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`,
      `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`,
      `https://corsproxy.io/?${encodeURIComponent(rssUrl)}`
    ];

    let lastError = null;

    for (let i = 0; i < apiEndpoints.length; i++) {
      const endpoint = apiEndpoints[i];
      try {
        if (i === 0) {
          const response = await fetch(endpoint);
          const data = await response.json();
          if (data.status === 'ok' && data.items) {
            return data.items;
          }
        } else if (i === 1) {
          const response = await fetch(endpoint);
          const resJson = await response.json();
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(resJson.contents, "text/xml");
          const items = Array.from(xmlDoc.querySelectorAll("item")).map(el => ({
            title: el.querySelector("title")?.textContent || "",
            description: el.querySelector("description")?.textContent || "",
            link: el.querySelector("link")?.textContent || ""
          }));
          if (items.length > 0) return items;
        } else {
          const response = await fetch(endpoint);
          const xmlText = await response.text();
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlText, "text/xml");
          const items = Array.from(xmlDoc.querySelectorAll("item")).map(el => ({
            title: el.querySelector("title")?.textContent || "",
            description: el.querySelector("description")?.textContent || "",
            link: el.querySelector("link")?.textContent || ""
          }));
          if (items.length > 0) return items;
        }
      } catch (err) {
        console.warn(`Giao thức liên kết ${i + 1} gián đoạn:`, err.message);
        lastError = err;
      }
    }
    throw lastError || new Error("Mất kết nối hoàn toàn tới luồng dữ liệu vệ tinh.");
  };

  const runScanner = async () => {
    if (loading) return;
    setLoading(true);
    addNotification("Kết nối máy chủ RSS và phân tích dữ liệu...");
    
    try {
      const targetRss = 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml';
      const items = await fetchRSSWithFallback(targetRss);

      const activeHotspots = [];
      const countries = Object.keys(LOCATION_DATABASE);

      items.forEach((item) => {
        const fullText = `${item.title} ${item.description || ''}`.toLowerCase();
        
        // Quét tìm quốc gia khớp cơ sở dữ liệu
        countries.forEach(countryKey => {
          if (fullText.includes(countryKey)) {
            // Xác định loại hiểm họa dựa trên phân tích từ khóa
            const hazardType = analyzeNewsText(item.title, item.description || '');
            const loc = LOCATION_DATABASE[countryKey];

            // Thiết lập chỉ thị an toàn dựa trên loại hiểm họa
            let advisoryText = 'Theo dõi chặt chẽ thông tin đại sứ quán.';
            if (hazardType === 'conflict') {
              advisoryText = 'Khuyến cáo: Tuyệt đối không di chuyển đến khu vực đang giao tranh hoặc có căng thẳng quân sự.';
            } else if (hazardType === 'disaster') {
              advisoryText = 'Khuyến cáo: Tìm nơi trú ẩn kiên cố, chuẩn bị pin dự phòng, nước sạch và lương thực khẩn cấp.';
            } else if (hazardType === 'epidemic') {
              advisoryText = 'Khuyến cáo: Tránh tụ tập nơi đông người, tuân thủ các quy tắc y tế phòng chống dịch của sở tại.';
            }

            const existingIndex = activeHotspots.findIndex(h => h.id === countryKey);
            if (existingIndex === -1) {
              activeHotspots.push({
                id: countryKey,
                country_vn: loc.country_vn,
                country: loc.country,
                lat: loc.lat,
                lng: loc.lng,
                severity: fullText.includes('severe') || fullText.includes('killed') || fullText.includes('dead') || fullText.includes('emergency') ? 'high' : 'medium',
                type: hazardType,
                detail: item.title + ": " + (item.description || "Đang có diễn biến khẩn cấp."),
                advisory: advisoryText
              });
            }
          }
        });
      });

      // Nếu không quét được tin cụ thể nào, giữ lại DEFAULT_ZONES để tránh màn hình trống
      const finalZones = activeHotspots.length > 0 ? activeHotspots : DEFAULT_ZONES;

      if (db && user) {
        for (const zone of finalZones) {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'zones', zone.id), { ...zone, timestamp: serverTimestamp() });
        }
      } else {
        setZones(finalZones);
      }
      addNotification(`Quét thành công! Cập nhật ${finalZones.length} điểm biến động.`);
    } catch (e) {
      console.error(e);
      addNotification("Cảnh báo: Kết nối vệ tinh gián đoạn. Sử dụng cơ sở dữ liệu ngoại tuyến.");
      setZones(DEFAULT_ZONES);
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
      
      {/* Tối ưu hóa flex container chứa các thông báo, căn giữa hoàn hảo và xử lý pointer-events */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
        {notifications.map(n => (
          <div 
            key={n.id} 
            className="bg-blue-600/90 backdrop-blur-md text-white text-[10px] font-black uppercase px-6 py-2.5 rounded-full shadow-2xl flex items-center gap-3 border border-white/20 notification-animation pointer-events-auto"
          >
            <Zap size={14} fill="currentColor" /> {n.msg}
          </div>
        ))}
      </div>

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
                <p className="text-[10px] font-bold text-blue-400 uppercase">{zones.length} Hotspots Detected</p>
             </div>
          </div>
        </div>
        
        <button 
          onClick={runScanner}
          disabled={loading}
          className="group relative px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all disabled:opacity-50 overflow-hidden shadow-2xl shadow-blue-600/20 active:scale-95 cursor-pointer"
        >
          <div className="flex items-center gap-3 relative z-10">
            {loading ? <RefreshCcw size={16} className="animate-spin" /> : <Search size={16} className="group-hover:scale-110 transition-transform" />}
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Cập nhật mạng lưới RSS</span>
          </div>
        </button>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative bg-[radial-gradient(circle_at_center,_#0a1a2f_0%,_#020408_100%)]">
          <ThreeGlobe zones={zones} onSelect={setSelectedZone} selectedZone={selectedZone} />
          
          <div className="absolute bottom-12 left-12 space-y-6 pointer-events-none">
            <div className="p-6 border border-white/10 bg-black/60 backdrop-blur-2xl rounded-3xl shadow-2xl space-y-4 w-64 animate-in fade-in slide-in-from-left-4">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2 mb-2">
                <Layers size={14} className="text-blue-500" /> Hệ thống phân cấp hiểm họa
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-2.5 h-2.5 bg-red-600 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.8)]" />
                    <span className="text-[10px] font-bold text-white/90 uppercase tracking-tighter">Chiến sự / Xung đột</span>
                  </div>
                  <div className="h-px flex-1 mx-4 bg-white/5" />
                  <span className="text-[9px] text-red-500 font-black">HIGH</span>
                </div>
                <div className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-2.5 h-2.5 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.4)]" />
                    <span className="text-[10px] font-bold text-white/90 uppercase tracking-tighter">Bão lũ / Thiên tai</span>
                  </div>
                  <div className="h-px flex-1 mx-4 bg-white/5" />
                  <span className="text-[9px] text-orange-500 font-black">MED</span>
                </div>
                <div className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-2.5 h-2.5 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.4)]" />
                    <span className="text-[10px] font-bold text-white/90 uppercase tracking-tighter">Dịch bệnh bùng phát</span>
                  </div>
                  <div className="h-px flex-1 mx-4 bg-white/5" />
                  <span className="text-[9px] text-purple-500 font-black">EPIDEMIC</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 border border-blue-500/20 bg-blue-500/5 rounded-2xl w-fit">
               <Crosshair size={16} className="text-blue-400 animate-pulse" />
               <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-none">Global Vector Grid Sync: 100%</p>
            </div>
          </div>

          <div className="absolute top-12 right-12 flex flex-col gap-3 max-h-[60%] overflow-y-auto no-scrollbar pb-10">
             {zones.map(z => (
               <button 
                key={z.id}
                onClick={() => setSelectedZone(z)}
                className={`flex items-center gap-4 px-6 py-3 border rounded-2xl transition-all backdrop-blur-md group cursor-pointer ${selectedZone?.id === z.id ? 'bg-blue-600 border-blue-400 translate-x-[-12px] shadow-xl shadow-blue-600/30' : 'bg-black/30 border-white/5 hover:border-white/20 hover:bg-white/5'}`}
               >
                 <div className={`w-2 h-2 rounded-full ${z.type === 'conflict' ? 'bg-red-500 animate-pulse' : z.type === 'disaster' ? 'bg-orange-500' : 'bg-purple-500'}`} />
                 <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${selectedZone?.id === z.id ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                    {z.country_vn}
                 </span>
                 <ChevronRight size={14} className={`transition-transform ${selectedZone?.id === z.id ? 'translate-x-1 opacity-100' : 'opacity-0 group-hover:opacity-40'}`} />
               </button>
             ))}
          </div>
        </div>

        <aside className={`w-[500px] bg-black/60 border-l border-white/10 backdrop-blur-3xl flex flex-col transition-all duration-700 ease-out z-[60] ${selectedZone ? 'translate-x-0' : 'translate-x-[40px] opacity-0 pointer-events-none'}`}>
          <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-blue-600/20 rounded-xl">
                 <Activity size={20} className="text-blue-500" />
              </div>
              <div>
                 <h2 className="text-xs font-black italic tracking-[0.4em] text-white uppercase leading-none">Báo cáo thực địa</h2>
                 <p className="text-[9px] font-bold text-slate-500 mt-2 uppercase">Analysis Hash: {selectedZone?.id.slice(0,8)}</p>
              </div>
            </div>
            <button 
               onClick={() => setSelectedZone(null)} 
               className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
            {selectedZone && (
              <div key={selectedZone.id} className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-10">
                <div className="space-y-6">
                   <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-red-600/10 border border-red-500/20 text-red-500 rounded-full"
                        style={{
                          backgroundColor: selectedZone.type === 'disaster' ? 'rgba(249,115,22,0.1)' : selectedZone.type === 'epidemic' ? 'rgba(168,85,247,0.1)' : 'rgba(239,68,68,0.1)',
                          borderColor: selectedZone.type === 'disaster' ? 'rgba(249,115,22,0.2)' : selectedZone.type === 'epidemic' ? 'rgba(168,85,247,0.2)' : 'rgba(239,68,68,0.2)',
                          color: selectedZone.type === 'disaster' ? '#f97316' : selectedZone.type === 'epidemic' ? '#a855f7' : '#ef4444'
                        }}>
                     <div className="w-1.5 h-1.5 rounded-full animate-ping" 
                          style={{
                            backgroundColor: selectedZone.type === 'disaster' ? '#f97316' : selectedZone.type === 'epidemic' ? '#a855f7' : '#ef4444'
                          }} />
                     <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                       Tình trạng: {selectedZone.type === 'conflict' ? 'Chiến sự khẩn cấp' : selectedZone.type === 'disaster' ? 'Thiên tai cực đoan' : 'Dịch bệnh bùng phát'}
                     </span>
                   </div>
                   <h1 className="text-6xl font-black text-white italic tracking-tighter uppercase leading-[0.9] break-words">
                    {selectedZone.country_vn}
                   </h1>
                   <div className="flex items-center gap-4 text-slate-500">
                      <Globe size={14} />
                      <p className="text-xs font-black uppercase tracking-[0.4em] border-l border-white/10 pl-4">{selectedZone.country} Region</p>
                   </div>
                </div>

                <div className="space-y-6">
                  <div className="p-8 bg-white/[0.02] rounded-[40px] border border-white/5 space-y-5 relative overflow-hidden group hover:bg-white/[0.04] transition-colors">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
                      <Info size={120} />
                    </div>
                    <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-[0.3em] flex items-center gap-3">
                      <div className="w-6 h-px bg-blue-400/30" /> Diễn biến tình hình
                    </h4>
                    <p className="text-[15px] text-slate-200 leading-relaxed italic font-medium tracking-tight">
                       "{selectedZone.detail}"
                    </p>
                  </div>

                  <div className="p-8 bg-orange-600/5 border border-orange-500/20 rounded-[40px] space-y-4"
                       style={{
                         backgroundColor: selectedZone.type === 'disaster' ? 'rgba(249,115,22,0.05)' : selectedZone.type === 'epidemic' ? 'rgba(168,85,247,0.05)' : 'rgba(239,68,68,0.05)',
                         borderColor: selectedZone.type === 'disaster' ? 'rgba(249,115,22,0.2)' : selectedZone.type === 'epidemic' ? 'rgba(168,85,247,0.2)' : 'rgba(239,68,68,0.2)'
                       }}>
                    <h4 className="text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3"
                        style={{
                          color: selectedZone.type === 'disaster' ? '#f97316' : selectedZone.type === 'epidemic' ? '#a855f7' : '#ef4444'
                        }}>
                      <div className="w-6 h-px" style={{ backgroundColor: selectedZone.type === 'disaster' ? '#f97316' : selectedZone.type === 'epidemic' ? '#a855f7' : '#ef4444' }} /> Chỉ thị an toàn
                    </h4>
                    <p className="text-[13px] font-bold text-white italic leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5">
                       {selectedZone.advisory}
                    </p>
                  </div>

                  <div className="p-10 bg-gradient-to-br from-red-600/20 via-transparent to-transparent border border-red-500/20 rounded-[40px] shadow-3xl">
                    <h4 className="text-[11px] font-black text-red-500 uppercase mb-8 tracking-[0.3em] flex items-center gap-3 border-b border-red-500/10 pb-4">
                      <ShieldCheck size={18} /> Hotline Bảo hộ công dân Việt Nam
                    </h4>
                    
                    {VIETNAM_EMBASSY_CONTACTS[selectedZone.country] ? (
                      <div className="space-y-8">
                        <div className="group cursor-pointer">
                          <p className="text-[10px] text-red-500 font-black uppercase mb-3 tracking-widest opacity-60">Emergency Line 24/7</p>
                          <div className="flex items-center gap-6 p-4 bg-red-600/10 rounded-3xl border border-red-500/10 hover:bg-red-600/20 transition-all">
                             <div className="p-4 bg-red-600 rounded-2xl shadow-lg shadow-red-600/40">
                                <Phone size={24} className="text-white" />
                             </div>
                             <p className="text-3xl font-black text-white tracking-tighter">{VIETNAM_EMBASSY_CONTACTS[selectedZone.country].phone}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-6 p-4">
                          <div className="p-4 bg-white/5 rounded-2xl">
                            <MapPin size={24} className="text-slate-500" />
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 font-black uppercase mb-2 tracking-widest">Địa chỉ cơ quan bảo hộ</p>
                            <p className="text-[13px] font-bold text-slate-300 leading-relaxed italic pr-4">{VIETNAM_EMBASSY_CONTACTS[selectedZone.country].address}</p>
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
            <span className="opacity-40">// Data Latency: RSS Live Feed (NYT World)</span>
         </div>
         <div className="flex items-center gap-6">
            <span>Center of Crisis Management - VN</span>
            <span className="opacity-30">OS_V3.2.0</span>
         </div>
      </footer>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(59, 130, 246, 0.3); }

        /* Tối ưu hiệu ứng hoạt ảnh trượt xuống mượt mà và chống đè chồng */
        @keyframes slideDown {
          from {
            transform: translateY(-12px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .notification-animation {
          animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
