import React, { useState, useMemo, useRef } from 'react';
import { 
  Printer, 
  Settings2, 
  Thermometer, 
  Droplets, 
  Zap, 
  FileText,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronRight,
  Calculator,
  Download,
  ExternalLink,
  History,
  Save,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2pdf from 'html2pdf.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- Types ---
type SystemType = 'CHILLER' | 'COOLING_TOWER';

interface ChemicalRow {
  name: string;
  type: string;
  dosage: number;
  kgDay: number;
  kgMonth: number;
  kgYear: number;
  kgInitial?: number;
}

interface Recommendation {
  title: string;
  desc: string;
}

interface ReportData {
  systemType: SystemType;
  customerName: string;
  projectName: string;
  reportId: string;
  engineerName: string;
  date: string;
  
  // System Specs
  equipmentName: string;
  material: string;
  operatingHours: number;
  capacityRT: number;
  circulationFlow: number; // m3/h
  tempIn: number; // C
  tempOut: number; // C
  powerInput: number; // kW
  systemVolume: number; // m3
  
  // Water Quality (Makeup)
  makeupType: string;
  makeupPh: number;
  makeupEc: number;
  makeupHardness: number;
  makeupMAlk: number;
  makeupSilica: number;
  makeupChloride: number;
  makeupSulfate: number;
  
  // Technical Standards (Measured)
  measuredPh: number;
  measuredConductivity: number;
  measuredHardness: number;
  measuredMAlk: number;
  measuredChlorides: number;
  measuredSilica: number;
  measuredBacteria: string;
  measuredIron: number;
  measuredCopper: number;
  measuredPhosphate: number;
  measuredLsi: number;
  measuredNitrite: number;
  measuredSulfate: number;
  measuredCopperCorrosion: number;
  measuredMildSteelCorrosion: number;
  systemLeakage: number;
  manualLoadPercentage: number;

  // Chemicals
  chillerChemicals: ChemicalRow[];
  towerChemicals: ChemicalRow[];
  
  // Recommendations
  chillerRecommendations: Recommendation[];
  towerRecommendations: Recommendation[];
  
  // Constants/Factors
  coc: number; // Cycles of Concentration
}

// --- Constants ---
const INITIAL_DATA: ReportData = {
  systemType: 'CHILLER',
  customerName: "VINAMILK FACTORY",
  projectName: "VN-CHILL-NORTH",
  reportId: "CH-2024-089",
  engineerName: "ENG. MINH TRAN",
  date: new Date().toLocaleDateString('en-GB'),
  
  equipmentName: "York YK Centrifugal",
  material: "Cu / Mild Steel / SS",
  operatingHours: 24,
  capacityRT: 1250,
  circulationFlow: 850,
  tempIn: 34.8,
  tempOut: 30.0,
  powerInput: 450,
  systemVolume: 1250,
  
  makeupType: "Softened Water",
  makeupPh: 7.8,
  makeupEc: 420,
  makeupHardness: 120,
  makeupMAlk: 150,
  makeupSilica: 22,
  makeupChloride: 45,
  makeupSulfate: 35,
  
  measuredPh: 8.2,
  measuredConductivity: 2100,
  measuredHardness: 450,
  measuredMAlk: 380,
  measuredChlorides: 280,
  measuredSilica: 120,
  measuredBacteria: "< 10^4",
  measuredIron: 0.6,
  measuredCopper: 0.05,
  measuredPhosphate: 8.5,
  measuredLsi: 1.2,
  measuredNitrite: 950,
  measuredSulfate: 15,
  measuredCopperCorrosion: 0.12,
  measuredMildSteelCorrosion: 0.35,
  systemLeakage: 0.5,
  manualLoadPercentage: 85,

  chillerChemicals: [
    { name: "Culligan Corro Guard 33L01", type: "Kiểm soát ngăn ngừa ăn mòn cáu cặn", dosage: 3000, kgDay: 0, kgMonth: 0, kgYear: 0, kgInitial: 0 },
    { name: "Culligan Bio Guard 40H16", type: "Kiểm soát vi sinh", dosage: 50, kgDay: 0, kgMonth: 0, kgYear: 0 }
  ],

  towerChemicals: [
    { name: "Culligan Total Guard 20C04", type: "Kiểm soát cáu cặn và ăn mòn", dosage: 60, kgDay: 0, kgMonth: 0, kgYear: 0 },
    { name: "Culligan Bio Guard 41H01", type: "Diệt vi sinh oxy hóa", dosage: 25, kgDay: 0, kgMonth: 0, kgYear: 0 },
    { name: "Culligan Bio Guard 40H16", type: "Diệt vi sinh không oxy hóa", dosage: 50, kgDay: 0, kgMonth: 0, kgYear: 0 }
  ],

  chillerRecommendations: [
    { title: "Kiểm soát rò rỉ", desc: "Theo dõi và khắc phục các điểm rò rỉ để duy trì nồng độ hóa chất ổn định." },
    { title: "Kiểm tra định kỳ", desc: "Phân tích mẫu nước hàng tuần để điều chỉnh liều lượng hóa chất phù hợp." },
    { title: "Vệ sinh hệ thống", desc: "Vệ sinh thiết bị châm hóa chất và bồn chứa định kỳ hàng tháng." },
    { title: "Bảo trì chiller", desc: "Theo dõi hiệu suất trao đổi nhiệt và thực hiện tẩy rửa nếu cần thiết." }
  ],

  towerRecommendations: [
    { title: "Vệ sinh tháp", desc: "Súc xả đáy tháp để loại bỏ bùn lắng và cặn hữu cơ mỗi 3 tháng." },
    { title: "Kiểm soát Blowdown", desc: "Điều chỉnh van xả đáy tự động dựa trên độ dẫn điện duy trì COC 4.5 - 5.0." },
    { title: "Liều lượng diệt vi sinh", desc: "Tăng liều sốc diệt khuẩn trong mùa mưa hoặc khi nhiệt độ nước cao." },
    { title: "Bảo trì thiết bị", desc: "Hiệu chuẩn cảm biến pH và Conductivity hàng tháng đảm bảo chính xác." }
  ],
  
  coc: 4.5
};

  // --- Calculations ---
const calculateMetrics = (data: ReportData) => {
  const deltaT = Math.abs(data.tempIn - data.tempOut);
  
  // Use input COC
  const coc = data.coc;

  // Evaporation (E) = Flow * DeltaT * 0.00153 (approx for Celsius)
  const evaporation = data.circulationFlow * deltaT * 0.00153;
  
  // Drift (D) = Flow * 0.0002
  const drift = data.circulationFlow * 0.0002;
  
  // Blowdown (B) = E / (COC - 1) - D
  const blowdown = coc > 1 ? Math.max(0, (evaporation / (coc - 1)) - drift) : 0;
  
  // Makeup (M) = E + B + D
  const makeup = evaporation + blowdown + drift;
  
  // Efficiency (kW/RT) = Power / Capacity
  const efficiency = data.powerInput / data.capacityRT;
  
  // System Load % (User input)
  const loadPercentage = data.manualLoadPercentage;

  // --- LSI Calculation ---
  // A = (log10(TDS) - 1) / 10
  const tds = data.measuredConductivity * 0.65;
  const A = (Math.log10(Math.max(1, tds)) - 1) / 10;
  // B = -13.12 * log10(Temp + 273) + 34.55
  const B = -13.12 * Math.log10(data.tempOut + 273) + 34.55;
  // C = log10(Calcium Hardness) - 0.4
  const C = Math.log10(Math.max(1, data.measuredHardness)) - 0.4;
  // D = log10(M-Alkalinity)
  const D = Math.log10(Math.max(1, data.measuredMAlk));
  const phs = (9.3 + A + B) - (C + D);
  const calculatedLsi = data.measuredPh - phs;

  // --- Chemical Calculations ---
  const currentChemicals = data.systemType === 'CHILLER' ? data.chillerChemicals : data.towerChemicals;
  const updatedChemicals = currentChemicals.map(chem => {
    let kgDay = 0;
    let kgMonth = 0;
    let kgYear = 0;
    let kgInitial = 0;

    if (data.systemType === 'CHILLER') {
      if (chem.name === "Culligan Corro Guard 33L01") {
        kgInitial = (chem.dosage * data.systemVolume) / 1000;
        kgMonth = (data.systemVolume * 0.01 + data.systemVolume * data.systemLeakage / 100) * chem.dosage / 1000;
        kgDay = kgMonth / 30;
        kgYear = kgMonth * 12;
      } else if (chem.name === "Culligan Bio Guard 40H16") {
        kgMonth = (data.systemVolume * chem.dosage * 4) / 1000;
        kgDay = kgMonth / 30;
        kgYear = kgMonth * 12;
      }
    } else {
      // COOLING TOWER
      if (chem.name === "Culligan Total Guard 20C04") {
        kgDay = (chem.dosage * blowdown * 24) / 1000;
        kgMonth = kgDay * 30;
        kgYear = kgMonth * 12;
      } else if (chem.name === "Culligan Bio Guard 41H01") {
        kgMonth = (chem.dosage * data.systemVolume * 10) / 1000;
        kgDay = kgMonth / 30;
        kgYear = kgMonth * 12;
      } else if (chem.name === "Culligan Bio Guard 40H16") {
        kgMonth = (chem.dosage * data.systemVolume * 4) / 1000;
        kgDay = 0; 
        kgYear = kgMonth * 12;
      } else {
        kgDay = chem.kgDay;
        kgMonth = kgDay * 30;
        kgYear = kgMonth * 12;
      }
    }

    return { ...chem, kgDay, kgMonth, kgYear, kgInitial };
  });

  return {
    deltaT: deltaT.toFixed(1),
    evaporation: evaporation.toFixed(2),
    drift: drift.toFixed(2),
    blowdown: blowdown.toFixed(2),
    makeup: makeup.toFixed(2),
    efficiency: efficiency.toFixed(3),
    loadPercentage: loadPercentage.toFixed(1),
    calculatedCoc: coc.toFixed(1),
    calculatedLsi: calculatedLsi.toFixed(2),
    updatedChemicals
  };
};

// --- Components ---

const InputField = ({ label, value, onChange, type = "text", suffix = "" }: any) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">{label}</label>
    <div className="relative">
      <input 
        type={type}
        value={value}
        onChange={(e) => onChange(type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
        className="w-full bg-slate-50 border-0 border-b border-slate-200 px-2 py-1.5 text-sm font-medium focus:ring-0 focus:border-indigo-500 transition-colors"
      />
      {suffix && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-700">{suffix}</span>}
    </div>
  </div>
);

export default function App() {
  const [data, setData] = useState<ReportData>(INITIAL_DATA);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'history'>('editor');
  const [savedProposals, setSavedProposals] = useState<ReportData[]>(() => {
    const saved = localStorage.getItem('culligan_proposals');
    if (saved) return JSON.parse(saved);
    
    // Migration from old key
    const oldSaved = localStorage.getItem('chemizol_proposals');
    if (oldSaved) {
      const parsed = JSON.parse(oldSaved);
      localStorage.setItem('culligan_proposals', oldSaved);
      localStorage.removeItem('chemizol_proposals');
      return parsed;
    }
    return [];
  });

  React.useEffect(() => {
    localStorage.setItem('culligan_proposals', JSON.stringify(savedProposals));
  }, [savedProposals]);

  const handleSaveProposal = () => {
    const newProposal = { ...data, date: new Date().toLocaleString('en-GB') };
    const exists = savedProposals.findIndex(p => p.reportId === data.reportId);
    
    if (exists !== -1) {
      const updated = [...savedProposals];
      updated[exists] = newProposal;
      setSavedProposals(updated);
    } else {
      setSavedProposals([newProposal, ...savedProposals]);
    }
    alert('Đã lưu proposal thành công!');
  };

  const loadProposal = (proposal: ReportData) => {
    setData(proposal);
    setActiveTab('editor');
  };

  const deleteProposal = (reportId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa proposal này?')) {
      setSavedProposals(savedProposals.filter(p => p.reportId !== reportId));
    }
  };

  const reportRef = useRef<HTMLDivElement>(null);
  
  const metrics = useMemo(() => calculateMetrics(data), [data]);

  const handlePrint = async () => {
    if (!reportRef.current || isExporting) return;

    setIsExporting(true);
    
    try {
      const element = reportRef.current;
      
      // Capture the element as a canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      
      const fileName = `Culligan_Report_${data.customerName.replace(/\s+/g, '_') || 'Report'}_${data.reportId}.pdf`;

      pdf.setProperties({
        title: fileName,
        subject: 'Culligan Technical Report',
        author: data.engineerName,
        creator: 'Industrial Report Generator'
      });

      // Try multiple download methods
      try {
        pdf.save(fileName);
      } catch (saveError) {
        // Fallback: create a blob and download manually
        const blob = pdf.output('blob');
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('PDF Export failed:', error);
      alert('Có lỗi khi xuất PDF. Vui lòng thử mở ứng dụng trong tab mới hoặc sử dụng tính năng In (Ctrl+P).');
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  const handleSystemPrint = () => {
    window.print();
  };

  const updateChemical = (index: number, field: keyof ChemicalRow, value: any) => {
    const fieldName = data.systemType === 'CHILLER' ? 'chillerChemicals' : 'towerChemicals';
    const newChems = [...data[fieldName]];
    newChems[index] = { ...newChems[index], [field]: value };
    setData({ ...data, [fieldName]: newChems });
  };

  const updateRecommendation = (index: number, field: keyof Recommendation, value: string) => {
    const fieldName = data.systemType === 'CHILLER' ? 'chillerRecommendations' : 'towerRecommendations';
    const newRecs = [...data[fieldName]];
    newRecs[index] = { ...newRecs[index], [field]: value };
    setData({ ...data, [fieldName]: newRecs });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-900">
      {/* --- Sidebar / Editor --- */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside 
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            className="w-80 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 z-20 no-print shadow-xl"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 flex items-center justify-center rounded-lg">
                  <Calculator className="text-white w-5 h-5" />
                </div>
                <h1 className="font-black text-lg tracking-tight">CULLIGAN</h1>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={handleSaveProposal}
                  className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-full transition-colors"
                  title="Lưu Proposal"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100">
              <button 
                onClick={() => setActiveTab('editor')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'editor' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-700'}`}
              >
                Trình chỉnh sửa
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'history' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-700'}`}
              >
                Danh mục lưu trữ ({savedProposals.length})
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {activeTab === 'editor' ? (
                <>
                  {/* System Type Toggle */}
                  <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button 
                      onClick={() => setData({ ...data, systemType: 'CHILLER' })}
                      className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${data.systemType === 'CHILLER' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-800'}`}
                    >
                      Chiller
                    </button>
                    <button 
                      onClick={() => setData({ ...data, systemType: 'COOLING_TOWER' })}
                      className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${data.systemType === 'COOLING_TOWER' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-800'}`}
                    >
                      Cooling
                    </button>
                  </div>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600">
                  <FileText className="w-4 h-4" />
                  <h2 className="text-xs font-black uppercase tracking-widest">General Info</h2>
                </div>
                <div className="grid gap-4">
                  <InputField label="Customer" value={data.customerName} onChange={(v: any) => setData({...data, customerName: v})} />
                  <InputField label="Project" value={data.projectName} onChange={(v: any) => setData({...data, projectName: v})} />
                  <InputField label="Report ID" value={data.reportId} onChange={(v: any) => setData({...data, reportId: v})} />
                  <InputField label="Date" value={data.date} onChange={(v: any) => setData({...data, date: v})} />
                  <InputField label="Engineer" value={data.engineerName} onChange={(v: any) => setData({...data, engineerName: v})} />
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Settings2 className="w-4 h-4" />
                  <h2 className="text-xs font-black uppercase tracking-widest">System Specs</h2>
                </div>
                <div className="grid gap-4">
                  <InputField label="Equipment Name" value={data.equipmentName} onChange={(v: any) => setData({...data, equipmentName: v})} />
                  <InputField label="Material" value={data.material} onChange={(v: any) => setData({...data, material: v})} />
                  <InputField label={data.systemType === 'CHILLER' ? "Thể tích nước hệ thống" : "System Volume"} type="number" suffix="m³" value={data.systemVolume} onChange={(v: any) => setData({...data, systemVolume: v})} />
                  <InputField label="Design Capacity" type="number" suffix="RT" value={data.capacityRT} onChange={(v: any) => setData({...data, capacityRT: v})} />
                  <InputField label={data.systemType === 'CHILLER' ? "Lưu lượng tuần hoàn" : "Circulation Flow"} type="number" suffix="m³/h" value={data.circulationFlow} onChange={(v: any) => setData({...data, circulationFlow: v})} />
                  <InputField label="Tải hoạt động" type="number" suffix="%" value={data.manualLoadPercentage} onChange={(v: any) => setData({...data, manualLoadPercentage: v})} />
                  {data.systemType === 'COOLING_TOWER' && (
                    <InputField label="Hệ số COC" type="number" value={data.coc} onChange={(v: any) => setData({...data, coc: v})} />
                  )}
                  <InputField label="Thời gian hoạt động" type="number" suffix="h/ngày" value={data.operatingHours} onChange={(v: any) => setData({...data, operatingHours: v})} />
                  <InputField label={data.systemType === 'CHILLER' ? "CHW Return" : "Temp In (Inlet)"} type="number" suffix="°C" value={data.tempIn} onChange={(v: any) => setData({...data, tempIn: v})} />
                  <InputField label={data.systemType === 'CHILLER' ? "CHW Supply" : "Temp Out (Outlet)"} type="number" suffix="°C" value={data.tempOut} onChange={(v: any) => setData({...data, tempOut: v})} />
                  {data.systemType === 'CHILLER' && (
                    <InputField label="Rò rỉ hệ thống" type="number" suffix="%" value={data.systemLeakage} onChange={(v: any) => setData({...data, systemLeakage: v})} />
                  )}
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Droplets className="w-4 h-4" />
                  <h2 className="text-xs font-black uppercase tracking-widest">Water Chemistry (Measured)</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="pH" type="number" value={data.measuredPh} onChange={(v: any) => setData({...data, measuredPh: v})} />
                  <InputField label="EC (µS/cm)" type="number" value={data.measuredConductivity} onChange={(v: any) => setData({...data, measuredConductivity: v})} />
                  {data.systemType === 'COOLING_TOWER' ? (
                    <>
                      <InputField label="Hardness" type="number" value={data.measuredHardness} onChange={(v: any) => setData({...data, measuredHardness: v})} />
                      <InputField label="Silica" type="number" value={data.measuredSilica} onChange={(v: any) => setData({...data, measuredSilica: v})} />
                      <InputField label="LSI" type="number" value={data.measuredLsi} onChange={(v: any) => setData({...data, measuredLsi: v})} />
                      <InputField label="Phosphate" type="number" value={data.measuredPhosphate} onChange={(v: any) => setData({...data, measuredPhosphate: v})} />
                    </>
                  ) : (
                    <>
                      <InputField label="Sulfate" type="number" value={data.measuredSulfate} onChange={(v: any) => setData({...data, measuredSulfate: v})} />
                      <InputField label="Nitrite" type="number" value={data.measuredNitrite} onChange={(v: any) => setData({...data, measuredNitrite: v})} />
                      <InputField label="Cu Corr." type="number" value={data.measuredCopperCorrosion} onChange={(v: any) => setData({...data, measuredCopperCorrosion: v})} />
                      <InputField label="MS Corr." type="number" value={data.measuredMildSteelCorrosion} onChange={(v: any) => setData({...data, measuredMildSteelCorrosion: v})} />
                    </>
                  )}
                  <InputField label="M-Alk" type="number" value={data.measuredMAlk} onChange={(v: any) => setData({...data, measuredMAlk: v})} />
                  <InputField label="Chlorides" type="number" value={data.measuredChlorides} onChange={(v: any) => setData({...data, measuredChlorides: v})} />
                  <InputField label="Iron (Fe)" type="number" value={data.measuredIron} onChange={(v: any) => setData({...data, measuredIron: v})} />
                  <InputField label="Copper (Cu)" type="number" value={data.measuredCopper} onChange={(v: any) => setData({...data, measuredCopper: v})} />
                  <InputField label="Bacteria" value={data.measuredBacteria} onChange={(v: any) => setData({...data, measuredBacteria: v})} />
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Droplets className="w-4 h-4 opacity-50" />
                  <h2 className="text-xs font-black uppercase tracking-widest opacity-50">Makeup Water</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <InputField label="Loại nước" value={data.makeupType} onChange={(v: any) => setData({...data, makeupType: v})} />
                  </div>
                  <InputField label="pH" type="number" value={data.makeupPh} onChange={(v: any) => setData({...data, makeupPh: v})} />
                  <InputField label="EC" type="number" value={data.makeupEc} onChange={(v: any) => setData({...data, makeupEc: v})} />
                  <InputField label="Hardness" type="number" value={data.makeupHardness} onChange={(v: any) => setData({...data, makeupHardness: v})} />
                  <InputField label="Silica" type="number" value={data.makeupSilica} onChange={(v: any) => setData({...data, makeupSilica: v})} />
                  <InputField label="Chlorides" type="number" value={data.makeupChloride} onChange={(v: any) => setData({...data, makeupChloride: v})} />
                  <InputField label="Sulfate" type="number" value={data.makeupSulfate} onChange={(v: any) => setData({...data, makeupSulfate: v})} />
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Zap className="w-4 h-4" />
                  <h2 className="text-xs font-black uppercase tracking-widest">Chemicals (Dosage)</h2>
                </div>
                <div className="space-y-3">
                  {(data.systemType === 'CHILLER' ? data.chillerChemicals : data.towerChemicals).map((chem, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-lg space-y-2">
                      <div className="text-[10px] font-bold text-slate-800 uppercase">{chem.name}</div>
                      <InputField label="Liều dùng" type="number" value={chem.dosage} onChange={(v: any) => updateChemical(i, 'dosage', v)} />
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Info className="w-4 h-4" />
                  <h2 className="text-xs font-black uppercase tracking-widest">Recommendations</h2>
                </div>
                <div className="space-y-4">
                  {(data.systemType === 'CHILLER' ? data.chillerRecommendations : data.towerRecommendations).map((rec, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-lg space-y-2">
                      <InputField label={`Tiêu đề ${i+1}`} value={rec.title} onChange={(v: any) => updateRecommendation(i, 'title', v)} />
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Nội dung {i+1}</label>
                        <textarea 
                          value={rec.desc}
                          onChange={(e) => updateRecommendation(i, 'desc', e.target.value)}
                          className="w-full bg-white border border-slate-200 p-2 text-sm font-medium focus:ring-0 focus:border-indigo-500 transition-colors rounded-md min-h-[60px]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600 mb-4">
                  <History className="w-4 h-4" />
                  <h2 className="text-xs font-black uppercase tracking-widest">Lịch sử Proposals</h2>
                </div>
                
                {savedProposals.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-6 h-6 text-slate-700" />
                    </div>
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">Chưa có proposal nào được lưu</p>
                    <p className="text-[10px] text-slate-700 mt-2">Bấm biểu tượng <Save className="inline w-3 h-3" /> để lưu bản nháp hiện tại</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedProposals.map((proposal) => (
                      <div 
                        key={proposal.reportId}
                        className="group p-4 bg-slate-50 hover:bg-white border border-transparent hover:border-indigo-100 rounded-xl transition-all cursor-pointer relative"
                        onClick={() => loadProposal(proposal)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">
                            {proposal.reportId}
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteProposal(proposal.reportId);
                            }}
                            className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 text-red-500 rounded-md transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <h3 className="text-sm font-black text-slate-800 line-clamp-1 mb-1">{proposal.customerName || 'Chưa đặt tên khách hàng'}</h3>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-700 uppercase tracking-widest">
                          <span className="flex items-center gap-1">
                            <Droplets className="w-3 h-3" />
                            {proposal.systemType === 'CHILLER' ? 'Chiller' : 'Tower'}
                          </span>
                          <span>{proposal.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-3">
              <button 
                onClick={handleSystemPrint}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-200 rounded-md"
              >
                <Printer className="w-4 h-4" />
                IN / XUẤT PDF
              </button>

              <button 
                onClick={handleOpenNewTab}
                className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 flex items-center justify-center gap-2 transition-all active:scale-95 rounded-md"
              >
                <ExternalLink className="w-4 h-4" />
                MỞ TRONG TAB MỚI
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* --- Main Content Area --- */}
      <main className="flex-1 overflow-y-auto p-8 flex flex-col items-center relative">
        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="fixed left-4 top-4 p-3 bg-white shadow-lg rounded-full hover:bg-slate-50 transition-colors z-30 no-print"
          >
            <Settings2 className="w-5 h-5 text-indigo-600" />
          </button>
        )}

        {/* --- A4 Paper Preview --- */}
        <div 
          ref={reportRef}
          className="a4-page bg-white shadow-2xl relative overflow-hidden flex flex-col pt-[5mm] px-[12mm] pb-[10mm] text-slate-900 w-[210mm] min-h-[297mm] mx-auto"
        >
          {/* Header */}
          <header className="border-b-4 border-indigo-900 pb-4 mb-4">
            <div className="flex justify-between items-end">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div>
                    <h1 className="text-sm font-black tracking-tighter leading-none uppercase">
                      Technical Proposal {data.systemType === 'CHILLER' ? 'Chiller Water' : 'Cooling'}
                    </h1>
                    <p className="text-[10px] font-bold text-slate-800 uppercase tracking-[0.2em] mt-1">
                      {data.systemType === 'CHILLER' ? 'Đề xuất xử lý nước hệ thống Chiller' : 'Đề xuất xử lý nước tháp giải nhiệt'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-[10px]">
                  <div><span className="font-bold text-indigo-900 uppercase">Customer:</span> {data.customerName}</div>
                  <div><span className="font-bold text-indigo-900 uppercase">Date:</span> {data.date}</div>
                  <div><span className="font-bold text-indigo-900 uppercase">Engineer:</span> {data.engineerName}</div>
                  <div><span className="font-bold text-indigo-900 uppercase">Ref No:</span> {data.reportId}</div>
                </div>
              </div>
              <div className="bg-slate-100 p-4 border-l-4 border-indigo-600 min-w-[180px]">
                <div className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest mb-1">System Efficiency Index</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black tracking-tighter text-indigo-900">{metrics.loadPercentage}</span>
                  <span className="text-xs font-bold text-indigo-900">%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 mt-2">
                  <div className="h-full bg-indigo-600" style={{ width: `${Math.min(parseFloat(metrics.loadPercentage), 100)}%` }}></div>
                </div>
              </div>
            </div>
          </header>

          {/* Section I: System Info */}
          <section className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-5 w-1 bg-indigo-900"></div>
              <h2 className="text-sm font-black tracking-tight text-indigo-900 uppercase flex items-center gap-2">
                I. {data.systemType === 'CHILLER' ? 'Hệ thống Chiller' : 'Hệ Thống Tháp Giải Nhiệt'}
              </h2>
            </div>
            <div className="grid grid-cols-12 border border-slate-200">
              <div className="col-span-3 bg-slate-50 p-3 space-y-2 border-r border-slate-200">
                <div className="text-[10px] font-black uppercase text-indigo-900 border-b border-indigo-100 pb-1 mb-1">System Details</div>
                <DataRow label="Tên thiết bị" value={data.equipmentName} />
                <DataRow label={data.systemType === 'CHILLER' ? "Thể tích nước hệ thống" : "Thể tích"} value={`${data.systemVolume} m³`} />
                <DataRow label={data.systemType === 'CHILLER' ? "Lưu lượng tuần hoàn" : "Lưu lượng"} value={`${data.circulationFlow} m³/h`} />
                <DataRow label="Tải hoạt động" value={`${metrics.loadPercentage}%`} />
                <DataRow label="Vật liệu" value={data.material} />
                {data.systemType === 'COOLING_TOWER' && (
                  <DataRow label="Hệ số COC" value={metrics.calculatedCoc} />
                )}
                {data.systemType === 'CHILLER' && (
                  <DataRow label="Rò rỉ hệ thống" value={`${data.systemLeakage}%`} />
                )}
                <DataRow label="Thời gian hoạt động" value={`${data.operatingHours} h/ngày`} />
              </div>
              <div className="col-span-6 bg-white p-3 flex flex-col justify-center relative">
                <div className="text-[10px] font-black uppercase text-indigo-900 mb-1 text-center">
                  {data.systemType === 'CHILLER' ? 'Sơ đồ hệ chiller' : 'Sơ đồ cân bằng tháp giải nhiệt'}
                </div>
                
                {data.systemType === 'COOLING_TOWER' ? (
                  <div className="relative h-48 w-full flex items-center justify-center">
                    {/* Cooling Tower Diagram */}
                    <svg viewBox="0 0 200 160" className="w-full h-full max-w-[240px]">
                      {/* Tower Body */}
                      <path d="M60 120 L140 120 L130 40 L70 40 Z" fill="#f8fafc" stroke="#6366f1" strokeWidth="1.5" />
                      <line x1="70" y1="60" x2="130" y2="60" stroke="#94a3b8" strokeWidth="1" />
                      <line x1="70" y1="80" x2="130" y2="80" stroke="#94a3b8" strokeWidth="1" />
                      <line x1="70" y1="100" x2="130" y2="100" stroke="#94a3b8" strokeWidth="1" />
                      
                      {/* Fan/Top */}
                      <rect x="85" y="30" width="30" height="10" fill="#4f46e5" rx="2" />
                      
                      {/* Flows */}
                      {/* Evaporation */}
                      <path d="M100 30 Q100 10 110 5" fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="3 2" markerEnd="url(#arrow)" />
                      <text x="115" y="10" className="text-[9px] font-bold fill-slate-800">Bay hơi (E)</text>
                      
                      {/* Makeup */}
                      <path d="M10 90 L60 90" fill="none" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrow)" />
                      <text x="10" y="85" className="text-[9px] font-bold fill-blue-600">Bổ sung (M)</text>
                      
                      {/* Blowdown */}
                      <path d="M100 120 L100 150 L10 150" fill="none" stroke="#ef4444" strokeWidth="1.5" markerEnd="url(#arrow)" />
                      <text x="15" y="145" className="text-[9px] font-bold fill-red-600">Xả đáy (B)</text>
                      
                      {/* Drift */}
                      <path d="M135 70 Q160 70 170 60" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="2 2" markerEnd="url(#arrow)" />
                      <text x="140" y="55" className="text-[6px] font-bold fill-slate-700">Thất thoát (D)</text>

                      {/* Recirculation */}
                      <path d="M140 100 L170 100 L170 40 L130 40" fill="none" stroke="#6366f1" strokeWidth="1.5" markerEnd="url(#arrow)" />
                      <text x="185" y="70" className="text-[9px] font-bold fill-indigo-600" style={{writingMode: 'vertical-rl'}}>Tuần hoàn (R)</text>
                      
                      <defs>
                        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                          <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
                        </marker>
                      </defs>
                    </svg>
                    
                    {/* Flow Values Overlay */}
                    <div className="absolute top-2 left-2 p-2 bg-white print-bg-white border-2 border-indigo-100 rounded shadow-md z-20 min-w-[80px] print:border-slate-500">
                      <div className="flex justify-between gap-3 border-b border-slate-50 pb-0.5">
                        <span className="text-[7px] font-bold text-slate-800">M:</span> 
                        <span className="text-[8px] font-black text-indigo-900">{Number(metrics.makeup) > 0 ? `${metrics.makeup} m³/h` : "-"}</span>
                      </div>
                      <div className="flex justify-between gap-3 border-b border-slate-50 pb-0.5">
                        <span className="text-[7px] font-bold text-slate-800">E:</span> 
                        <span className="text-[8px] font-black text-indigo-900">{Number(metrics.evaporation) > 0 ? `${metrics.evaporation} m³/h` : "-"}</span>
                      </div>
                      <div className="flex justify-between gap-3 border-b border-slate-50 pb-0.5">
                        <span className="text-[7px] font-bold text-slate-800">B:</span> 
                        <span className="text-[8px] font-black text-indigo-900">{Number(metrics.blowdown) > 0 ? `${metrics.blowdown} m³/h` : "-"}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-[7px] font-bold text-slate-800">D:</span> 
                        <span className="text-[8px] font-black text-indigo-900">{Number(metrics.drift) > 0 ? `${metrics.drift} m³/h` : "-"}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative h-48 w-full flex items-center justify-center">
                    <svg viewBox="-50 0 250 120" className="w-full h-full max-w-[280px]">
                      {/* Chiller Unit Body */}
                      <rect x="60" y="30" width="80" height="60" fill="#f8fafc" stroke="#6366f1" strokeWidth="1.5" rx="4" />
                      <text x="100" y="65" textAnchor="middle" className="text-[10px] font-black fill-indigo-900 uppercase">Chiller Unit</text>
                      
                      {/* Chilled Water Loop (Evaporator) - Blue */}
                      <path d="M60 45 L-10 45" fill="none" stroke="#3b82f6" strokeWidth="1.5" markerEnd="url(#arrow-blue)" />
                      <text x="-45" y="40" className="text-[6px] font-bold fill-blue-600">CHW Supply: {data.tempOut > 0 ? `${data.tempOut}°C` : "-"}</text>
                      
                      <path d="M-10 75 L60 75" fill="none" stroke="#3b82f6" strokeWidth="1.5" markerEnd="url(#arrow-blue)" />
                      <text x="-45" y="85" className="text-[6px] font-bold fill-blue-600">CHW Return: {data.tempIn > 0 ? `${data.tempIn}°C` : "-"}</text>
                      
                      {/* Condenser Water Loop - Red/Orange */}
                      <path d="M140 45 L185 45" fill="none" stroke="#f59e0b" strokeWidth="1.5" markerEnd="url(#arrow-orange)" />
                      <text x="145" y="40" className="text-[6px] font-bold fill-amber-600">CW Return</text>
                      
                      <path d="M185 75 L140 75" fill="none" stroke="#f59e0b" strokeWidth="1.5" markerEnd="url(#arrow-orange)" />
                      <text x="145" y="85" className="text-[6px] font-bold fill-amber-600">CW Supply</text>

                      <defs>
                        <marker id="arrow-blue" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3" markerHeight="3" orient="auto">
                          <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
                        </marker>
                        <marker id="arrow-orange" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3" markerHeight="3" orient="auto">
                          <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
                        </marker>
                      </defs>
                    </svg>
                  </div>
                )}
              </div>
              <div className="col-span-3 bg-slate-50 p-3 space-y-2 border-l border-slate-200">
                <div className="text-[10px] font-black uppercase text-indigo-900 border-b border-indigo-100 pb-1 mb-1">Makeup Water</div>
                <DataRow label="Loại nước" value={data.makeupType} />
                <DataRow label="pH" value={data.makeupPh} />
                <DataRow label="EC" value={`${data.makeupEc} µS/cm`} />
                <DataRow label="Hardness" value={`${data.makeupHardness} ppm`} />
                <DataRow label="Silica" value={`${data.makeupSilica} ppm`} />
                <DataRow label="Chlorides" value={`${data.makeupChloride} ppm`} />
                <DataRow label="Sulfate" value={`${data.makeupSulfate} ppm`} />
              </div>
            </div>
          </section>

          {/* Section II: Standards & Chemicals */}
          <section className="mb-4 grid grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-5 w-1 bg-indigo-600"></div>
                <h2 className="text-sm font-black tracking-tight text-indigo-900 uppercase">
                  IIa. {data.systemType === 'CHILLER' ? 'Chất lượng nước và tiêu chuẩn kiểm soát nước chiller' : 'Chất lượng nước và tiêu chuẩn kiểm soát nước giải nhiệt'}
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-1">
                {data.systemType === 'COOLING_TOWER' ? (
                  <>
                    <TableRowCompact label="pH Level" value={data.measuredPh} standard="7.0 - 8.7" status={data.measuredPh >= 7.0 && data.measuredPh <= 8.7} />
                    <TableRowCompact label="Conductivity" value={`${data.measuredConductivity} µS/cm`} standard="< 2500" status={data.measuredConductivity < 2500} />
                    <TableRowCompact label="Total Hardness" value={`${data.measuredHardness} ppm`} standard="< 500" status={data.measuredHardness < 500} />
                    <TableRowCompact label="M-Alkalinity" value={`${data.measuredMAlk} ppm`} standard="< 400" status={data.measuredMAlk < 400} />
                    <TableRowCompact label="Chlorides" value={`${data.measuredChlorides} ppm`} standard="< 300" status={data.measuredChlorides < 300} />
                    <TableRowCompact label="Silica (SiO2)" value={`${data.measuredSilica} ppm`} standard="< 150" status={data.measuredSilica < 150} />
                    <TableRowCompact label="Iron (Fe)" value={`${data.measuredIron} ppm`} standard="< 2.0" status={data.measuredIron < 2.0} />
                    <TableRowCompact label="Copper (Cu)" value={`${data.measuredCopper} ppm`} standard="< 0.2" status={data.measuredCopper < 0.2} />
                    <TableRowCompact label="Bacteria" value={data.measuredBacteria} standard="< 10^4" status={true} />
                    <TableRowCompact label="Phosphate (PO4)" value={`${data.measuredPhosphate} ppm`} standard="4.0 - 10.0" status={data.measuredPhosphate >= 4.0 && data.measuredPhosphate <= 10.0} />
                    <TableRowCompact label="LSI Index" value={metrics.calculatedLsi} standard="0.5 - 2.0" status={parseFloat(metrics.calculatedLsi) >= 0.5 && parseFloat(metrics.calculatedLsi) <= 2.0} />
                  </>
                ) : (
                  <>
                    <TableRowCompact label="pH Level" value={data.measuredPh} standard="8.5 - 10.5" status={data.measuredPh >= 8.5 && data.measuredPh <= 10.5} />
                    <TableRowCompact label="Conductivity" value={`${data.measuredConductivity} µS/cm`} standard="< 10,000" status={data.measuredConductivity < 10000} />
                    <TableRowCompact label="M-Alkalinity" value={`${data.measuredMAlk} ppm`} standard="100 - 300" status={data.measuredMAlk >= 100 && data.measuredMAlk <= 300} />
                    <TableRowCompact label="Chlorides" value={`${data.measuredChlorides} ppm`} standard="< 80" status={data.measuredChlorides < 80} />
                    <TableRowCompact label="Iron (Fe)" value={`${data.measuredIron} ppm`} standard="< 2.0" status={data.measuredIron < 2.0} />
                    <TableRowCompact label="Copper (Cu)" value={`${data.measuredCopper} ppm`} standard="< 0.2" status={data.measuredCopper < 0.2} />
                    <TableRowCompact label="Bacteria" value={data.measuredBacteria} standard="< 10^4" status={true} />
                    <TableRowCompact label="Nitrite (NO2)" value={`${data.measuredNitrite} ppm`} standard="700 - 1500" status={data.measuredNitrite >= 700 && data.measuredNitrite <= 1500} />
                    <TableRowCompact label="Sulfate" value={`${data.measuredSulfate} ppm`} standard="< 20" status={data.measuredSulfate < 20} />
                    <TableRowCompact label="Copper corrosion rate" value={`${data.measuredCopperCorrosion} mpy`} standard="0.25 max" status={data.measuredCopperCorrosion <= 0.25} />
                    <TableRowCompact label="Mid Steel corrosion rate" value={`${data.measuredMildSteelCorrosion} mpy`} standard="0.5 max" status={data.measuredMildSteelCorrosion <= 0.5} />
                  </>
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-5 w-1 bg-indigo-600"></div>
                <h2 className="text-sm font-black tracking-tight text-indigo-900 uppercase">IIb. Chương trình hóa chất xử lý</h2>
              </div>
              <table className="w-full text-left border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-indigo-900 text-white">
                    <th className="p-1.5 text-[9px] font-black uppercase tracking-widest">Hóa chất</th>
                    <th className="p-1.5 text-[9px] font-black uppercase tracking-widest text-center">Liều dùng</th>
                    {data.systemType === 'CHILLER' && <th className="p-1.5 text-[9px] font-black uppercase tracking-widest text-center">Kg/Lần</th>}
                    <th className="p-1.5 text-[9px] font-black uppercase tracking-widest text-center">Kg/D</th>
                    <th className="p-1.5 text-[9px] font-black uppercase tracking-widest text-center">Kg/M</th>
                    <th className="p-1.5 text-[9px] font-black uppercase tracking-widest text-center">Kg/Y</th>
                  </tr>
                </thead>
                <tbody className="text-[10px]">
                  {metrics.updatedChemicals.map((chem, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="p-1.5">
                        <div className="font-bold">{chem.name}</div>
                        <div className="text-[8px] text-slate-700 uppercase">{chem.type}</div>
                      </td>
                      <td className="p-1.5 font-semibold text-center">{chem.dosage || "-"}</td>
                      {data.systemType === 'CHILLER' && (
                        <td className="p-1.5 font-semibold text-center">{chem.kgInitial ? chem.kgInitial.toFixed(1) : "-"}</td>
                      )}
                      <td className="p-1.5 font-semibold text-center">
                        {data.systemType === 'COOLING_TOWER' && chem.name === "Culligan Bio Guard 40H16" ? "-" : (chem.kgDay > 0 ? chem.kgDay.toFixed(1) : "-")}
                      </td>
                      <td className="p-1.5 font-semibold text-center">{chem.kgMonth > 0 ? chem.kgMonth.toFixed(1) : "-"}</td>
                      <td className="p-1.5 font-semibold text-center">{chem.kgYear > 0 ? chem.kgYear.toFixed(0) : "-"}</td>
                    </tr>
                  ))}
                  <tr className="bg-indigo-50 text-indigo-900 font-black">
                    <td className="p-1.5 text-[9px] uppercase" colSpan={2}>Total</td>
                    {data.systemType === 'CHILLER' && (
                      <td className="p-1.5 text-center">
                        {metrics.updatedChemicals.reduce((acc, c) => acc + (c.kgInitial || 0), 0) > 0 
                          ? metrics.updatedChemicals.reduce((acc, c) => acc + (c.kgInitial || 0), 0).toFixed(1) 
                          : "-"}
                      </td>
                    )}
                    <td className="p-1.5 text-center">
                      {metrics.updatedChemicals.reduce((acc, c) => acc + (data.systemType === 'COOLING_TOWER' && c.name === "Culligan Bio Guard 40H16" ? 0 : c.kgDay), 0) > 0
                        ? metrics.updatedChemicals.reduce((acc, c) => acc + (data.systemType === 'COOLING_TOWER' && c.name === "Culligan Bio Guard 40H16" ? 0 : c.kgDay), 0).toFixed(1)
                        : "-"}
                    </td>
                    <td className="p-1.5 text-center">
                      {metrics.updatedChemicals.reduce((acc, c) => acc + c.kgMonth, 0) > 0
                        ? metrics.updatedChemicals.reduce((acc, c) => acc + c.kgMonth, 0).toFixed(1)
                        : "-"}
                    </td>
                    <td className="p-1.5 text-center">
                      {metrics.updatedChemicals.reduce((acc, c) => acc + c.kgYear, 0) > 0
                        ? metrics.updatedChemicals.reduce((acc, c) => acc + c.kgYear, 0).toFixed(0)
                        : "-"}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded">
                <div className="text-[9px] font-black text-indigo-900 uppercase mb-1">Ghi chú vận hành</div>
                <div className="text-[9px] space-y-0.5 text-slate-800">
                  <p className="font-bold">Cách châm hóa chất:</p>
                  {data.systemType === 'CHILLER' ? (
                    <>
                      <p>+ Culligan Corro Guard 33L01: châm định kì hằng tháng bằng thiết bị theo chỉ dẫn</p>
                      <p>+ Culligan Bio Guard 40H16: châm định kì hằng tuần/tháng bằng thiết bị theo chỉ dẫn</p>
                      <p className="italic text-indigo-600 mt-0.5 font-bold">*kg/lần: chỉ áp dụng cho những hệ thống mới</p>
                    </>
                  ) : (
                    <>
                      <p>+ Culligan Total Guard 20C04: châm liên tục, hệ thống châm</p>
                      <p>+ Culligan Bio Guard 41H01: châm liên tục bằng hệ thống châm hoặc châm tay theo chỉ dẫn.</p>
                      <p>+ Culligan Bio Guard 40H16: châm tay theo chỉ dẫn.</p>
                      <p>+ Hóa chất khác (nếu có): châm liên tục bằng hệ thống châm hoặc châm tay theo chỉ dẫn.</p>
                    </>
                  )}
                  <p className="mt-1">Hóa chất được tính toán cho hệ thống hoạt động 24giờ/ ngày, 30 ngày/ tháng.</p>
                  <p>Duy trì nồng độ hóa chất theo đúng hướng dẫn kỹ thuật.</p>
                  <p>Kiểm tra định kỳ các thông số nước 1 lần/tuần.</p>
                  <p>Kiểm tra vệ sinh hệ thống châm hóa chất định kỳ hàng tháng</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section III: Recommendations */}
          <section className="flex-grow">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-5 w-1 bg-amber-500"></div>
              <h2 className="text-sm font-black tracking-tight text-indigo-900 uppercase">III. Khuyến nghị kỹ thuật</h2>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(data.systemType === 'CHILLER' ? data.chillerRecommendations : data.towerRecommendations).map((rec, i) => (
                <RecommendationCard 
                  key={i}
                  title={rec.title}
                  desc={rec.desc}
                  icon={i === 0 ? <Info className="w-4 h-4" /> : i === 1 ? <Settings2 className="w-4 h-4" /> : i === 2 ? <Zap className="w-4 h-4" /> : <Calculator className="w-4 h-4" />}
                />
              ))}
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-end">
            <div className="text-[9px] text-slate-700 font-bold uppercase tracking-widest">
              © 2024 INDUSTRIAL SYSTEMS ENGINEERING • TECHNICAL PRECISION DIVISION
            </div>
            <div className="flex gap-8">
              <div className="text-center">
                <div className="h-8 w-24 border-b border-slate-200 mb-1"></div>
                <div className="text-[9px] font-bold text-indigo-900 uppercase">Authorized Signatory</div>
              </div>
              <div className="text-center">
                <div className="h-8 w-24 border-b border-slate-200 mb-1"></div>
                <div className="text-[9px] font-bold text-indigo-900 uppercase">Quality Assurance</div>
              </div>
            </div>
          </footer>
        </div>

        {/* Global Print Styles */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body { background: white !important; padding: 0 !important; margin: 0 !important; }
            .no-print { display: none !important; }
            .print-bg-white { background-color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .print-text-indigo { color: #312e81 !important; }
            .a4-page { 
              box-shadow: none !important; 
              margin: 0 !important; 
              width: 210mm !important; 
              height: 297mm !important; 
              padding: 5mm 15mm 15mm 15mm !important;
              border: none !important;
            }
            main { padding: 0 !important; overflow: visible !important; }
          }
          .a4-page {
            width: 210mm;
            height: 297mm;
            min-height: 297mm;
          }
        `}} />
      </main>
    </div>
  );
}

const formatDisplayValue = (value: any) => {
  if (value === 0 || value === "0" || value === "" || value === null || value === undefined) return "-";
  if (typeof value === 'string' && (value.startsWith('0 ') || value === '0') && !value.includes('.')) return "-";
  return value;
};

function TableRowCompact({ label, value, standard, status }: any) {
  const displayValue = formatDisplayValue(value);

  return (
    <div className={`flex justify-between items-center p-1.5 border-l-4 print-bg-white ${status ? 'border-indigo-600 bg-slate-50' : 'border-amber-500 bg-amber-50'}`}>
      <span className="text-[9px] font-bold uppercase tracking-tight">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black">{displayValue}</span>
        <span className="text-[8px] text-slate-700 italic">({standard})</span>
        {status ? (
          <CheckCircle2 className="w-2.5 h-2.5 text-indigo-600" />
        ) : (
          <AlertTriangle className="w-2.5 h-2.5 text-amber-500" />
        )}
      </div>
    </div>
  );
}

function RecommendationCard({ title, desc, icon }: any) {
  return (
    <div className="bg-slate-50 print-bg-white p-2.5 border-t-2 border-indigo-900">
      <div className="text-indigo-900 mb-1">{icon}</div>
      <h4 className="text-[9px] font-black uppercase mb-1 tracking-wider leading-tight">{title}</h4>
      <p className="text-[9px] leading-snug text-slate-800">{desc}</p>
    </div>
  );
}

function DataRow({ label, value }: any) {
  const displayValue = formatDisplayValue(value);
  
  return (
    <div className="flex justify-between items-end border-b border-slate-100 pb-0.5">
      <span className="text-[10px] text-slate-800 font-medium">{label}</span>
      <span className="text-[11px] font-black text-indigo-900">{displayValue}</span>
    </div>
  );
}

function MetricCard({ label, value, unit, icon, highlight }: any) {
  const displayValue = formatDisplayValue(value);
  const displayUnit = displayValue === "-" ? "" : unit;

  return (
    <div className={`p-3 border ${highlight ? 'bg-indigo-900 border-indigo-900 print-bg-white' : 'bg-white border-slate-100'} shadow-sm`}>
      <div className={`flex items-center gap-2 mb-1.5 ${highlight ? 'text-indigo-200 print-text-indigo' : 'text-slate-700'}`}>
        {icon}
        <span className="text-[9px] font-black uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-lg font-black ${highlight ? 'text-white print-text-indigo' : 'text-indigo-900'}`}>{displayValue}</span>
        <span className={`text-[10px] font-bold ${highlight ? 'text-indigo-300 print-text-indigo' : 'text-slate-700'}`}>{displayUnit}</span>
      </div>
    </div>
  );
}

function TableRow({ label, value, standard, status }: any) {
  const displayValue = formatDisplayValue(value);

  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
      <td className="p-3 font-bold text-slate-700">{label}</td>
      <td className="p-3 font-black text-indigo-900">{displayValue}</td>
      <td className="p-3 text-slate-800 italic">{standard}</td>
      <td className="p-3 text-center">
        {status ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto" />
        )}
      </td>
    </tr>
  );
}
