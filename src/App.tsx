import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Trash2,
  RotateCcw,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2pdf from 'html2pdf.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { SpeedInsights } from '@vercel/speed-insights/react';

// --- Types ---
type SystemType = 'CHILLER' | 'COOLING_TOWER';
type Language = 'VI' | 'EN';

const TRANSLATIONS = {
  VI: {
    sidebar: {
      title: 'CULLIGAN',
      editor: 'Trình chỉnh sửa',
      history: 'Danh mục lưu trữ',
      saveSuccess: 'Đã lưu proposal thành công!',
      deleteConfirm: 'Bạn có chắc chắn muốn xóa proposal này?',
      noHistory: 'Chưa có proposal nào được lưu',
      saveHint: 'Bấm biểu tượng để lưu bản nháp hiện tại',
      print: 'IN / XUẤT PDF',
      openNewTab: 'MỞ TRONG TAB MỚI',
      chiller: 'Chiller',
      cooling: 'Giải nhiệt',
      historyTitle: 'LỊCH SỬ PROPOSALS',
      noCustomer: 'Chưa đặt tên khách hàng',
      reset: 'KHÔI PHỤC MẶC ĐỊNH',
      saveProposal: 'Lưu Proposal',
      systemType: 'LOẠI HỆ THỐNG',
      consumption: 'Consumption',
    },
    sections: {
      general: 'Thông tin chung',
      specs: 'Thông số hệ thống',
      chemistry: 'Chỉ số nước (Đo đạc)',
      makeup: 'Nước bổ sung',
      chemicals: 'Hóa chất (Liều lượng)',
      recommendations: 'Khuyến nghị kỹ thuật',
      notes: 'Ghi chú vận hành',
    },
    labels: {
      customer: 'Khách hàng',
      project: 'Dự án',
      reportId: 'Mã báo cáo',
      date: 'Ngày',
      madeBy: 'Người thực hiện',
      summaryTitle: 'Tiêu đề tóm tắt',
      summaryValue: 'Giá trị tóm tắt',
      summaryUnit: 'Đơn vị tóm tắt',
      equipment: 'Tên thiết bị',
      material: 'Vật liệu',
      volume: 'Thể tích hệ thống',
      capacity: 'Công suất thiết kế',
      flow: 'Lưu lượng tuần hoàn',
      load: 'Tải hoạt động',
      coc: 'Hệ số COC',
      hours: 'Thời gian hoạt động',
      tempIn: 'Nhiệt độ vào',
      tempOut: 'Nhiệt độ ra',
      leakage: 'Rò rỉ hệ thống',
      dosage: 'Liều dùng',
      title: 'Tiêu đề',
      content: 'Nội dung',
      noteContent: 'Nội dung ghi chú',
      conductivity: 'Độ dẫn điện',
      hardness: 'Độ cứng',
      silica: 'Silica',
      iron: 'Sắt (Fe)',
      copper: 'Đồng (Cu)',
      bacteria: 'Vi khuẩn',
      phosphate: 'Phosphate',
      nitrite: 'Nitrite',
      sulfate: 'Sulfate',
      cuCorr: 'Ăn mòn đồng',
      msCorr: 'Ăn mòn thép',
      deltaT: 'Chênh lệch nhiệt',
      efficiency: 'Hiệu suất',
      powerInput: 'Điện năng tiêu thụ',
      makeupType: 'Loại nước bổ sung',
      phLevel: 'Chỉ số pH',
      alkalinity: 'Độ kiềm (M-Alk)',
      lsiIndex: 'Chỉ số LSI',
      chlorides: 'Clorua (Cl-)',
      total: 'Tổng cộng',
      consumptionReport: 'BÁO CÁO TIÊU THỤ',
      consumptionSubtitle: 'TỔNG HỢP LƯỢNG HÓA CHẤT TIÊU THỤ',
    },
    units: {
      m3: 'm³',
      m3h: 'm³/h',
      rt: 'RT',
      percent: '%',
      hoursPerDay: 'h/ngày',
      percentPerMonth: '%/tháng',
      celsius: '°C',
    },
    chiller: {
      return: 'Nhiệt độ hồi (Return)',
      supply: 'Nhiệt độ cấp (Supply)',
      cwReturn: 'Nước giải nhiệt hồi (CW Return)',
      cwSupply: 'Nước giải nhiệt cấp (CW Supply)',
      unit: 'Thiết bị',
    },
    report: {
      reportId: 'MÃ SỐ BÁO CÁO',
      titleChiller: 'TECHNICAL PROPOSAL',
      titleCooling: 'TECHNICAL PROPOSAL',
      subtitleChiller: 'CHILLER WATER TREATMENT SYSTEM',
      subtitleCooling: 'COOLING WATER TREATMENT SYSTEM',
      customerInfo: 'THÔNG TIN KHÁCH HÀNG',
      systemSpecs: 'THÔNG SỐ HỆ THỐNG',
      sectionChiller: 'Hệ thống Chiller',
      sectionCooling: 'Hệ Thống Tháp Giải Nhiệt',
      operatingStatus: 'TRẠNG THÁI VẬN HÀNH',
      operatingData: 'DỮ LIỆU VẬN HÀNH',
      waterSystem: 'HỆ THỐNG NƯỚC',
      diagramChiller: 'Sơ đồ hệ chiller',
      diagramTower: 'Sơ đồ cân bằng tháp giải nhiệt',
      evaporation: 'Bay hơi',
      makeup: 'Bổ sung',
      blowdown: 'Xả đáy',
      drift: 'Thất thoát',
      recirculation: 'Tuần hoàn',
      waterAnalysisChiller: 'Chất lượng nước và tiêu chuẩn kiểm soát nước chiller',
      waterAnalysisCooling: 'Chất lượng nước và tiêu chuẩn kiểm soát nước giải nhiệt',
      chemicalProgram: 'Chương trình hóa chất xử lý',
      chemical: 'Hóa chất',
      kgInitial: 'Kg/Lần',
      kgDay: 'Kg/D',
      kgMonth: 'Kg/M',
      kgYear: 'Kg/Y',
      techRecommendations: 'Khuyến nghị kỹ thuật',
    },
    chemicals: {
      corrosionScale: 'Kiểm soát ngăn ngừa ăn mòn cáu cặn',
      microbiological: 'Kiểm soát vi sinh',
      scaleCorrosion: 'Kiểm soát cáu cặn và ăn mòn',
      oxidizing: 'Diệt vi sinh oxy hóa',
      nonOxidizing: 'Diệt vi sinh không oxy hóa',
    },
    defaults: {
      chillerNotes: "Cách châm hóa chất:\n+ Culligan Corro Guard 33L01: châm định kì hằng tháng bằng thiết bị theo chỉ dẫn\n+ Culligan Bio Guard 40H16: châm định kì hằng tuần/tháng bằng thiết bị theo chỉ dẫn\n*kg/lần: chỉ áp dụng cho những hệ thống mới\n\nHóa chất được tính toán cho hệ thống hoạt động 24giờ/ ngày, 30 ngày/ tháng.\nDuy trì nồng độ hóa chất theo đúng hướng dẫn kỹ thuật.\nKiểm tra định kỳ các thông số nước 1 lần/tuần.\nKiểm tra vệ sinh hệ thống châm hóa chất định kỳ hàng tháng",
      towerNotes: "Cách châm hóa chất:\n+ Culligan Total Guard 20C04: châm liên tục, hệ thống châm\n+ Culligan Bio Guard 41H01: châm liên tục bằng hệ thống châm hoặc châm tay theo chỉ dẫn.\n+ Culligan Bio Guard 40H16: châm tay theo chỉ dẫn.\n+ Hóa chất khác (nếu có): châm liên tục bằng hệ thống châm hoặc châm tay theo chỉ dẫn.\n\nHóa chất được tính toán cho hệ thống hoạt động 24giờ/ ngày, 30 ngày/ tháng.\nDuy trì nồng độ hóa chất theo đúng hướng dẫn kỹ thuật.\nKiểm tra định kỳ các thông số nước 1 lần/tuần.\nKiểm tra vệ sinh hệ thống châm hóa chất định kỳ hàng tháng",
      chillerRecs: [
        { title: "Kiểm soát rò rỉ", desc: "Theo dõi và khắc phục các điểm rò rỉ để duy trì nồng độ hóa chất ổn định." },
        { title: "Kiểm tra định kỳ", desc: "Phân tích mẫu nước hàng tuần để điều chỉnh liều lượng hóa chất phù hợp." },
        { title: "Vệ sinh hệ thống", desc: "Vệ sinh thiết bị châm hóa chất và bồn chứa định kỳ hàng tháng." },
        { title: "Bảo trì chiller", desc: "Theo dõi hiệu suất trao đổi nhiệt và thực hiện tẩy rửa nếu cần thiết." }
      ],
      towerRecs: [
        { title: "Vệ sinh tháp", desc: "Súc xả đáy tháp để loại bỏ bùn lắng và cặn hữu cơ mỗi 3 tháng." },
        { title: "Kiểm soát Blowdown", desc: "Điều chỉnh van xả đáy tự động dựa trên độ dẫn điện duy trì COC 4.5 - 5.0." },
        { title: "Liều lượng diệt vi sinh", desc: "Tăng liều sốc diệt khuẩn trong mùa mưa hoặc khi nhiệt độ nước cao." },
        { title: "Bảo trì thiết bị", desc: "Hiệu chuẩn cảm biến pH và Conductivity hàng tháng đảm bảo chính xác." }
      ],
      summaryTitle: 'Chỉ số hiệu quả hệ thống',
    }
  },
  EN: {
    sidebar: {
      title: 'CULLIGAN',
      editor: 'Editor',
      history: 'History',
      saveSuccess: 'Proposal saved successfully!',
      deleteConfirm: 'Are you sure you want to delete this proposal?',
      noHistory: 'No proposals saved yet',
      saveHint: 'Click the icon to save current draft',
      print: 'PRINT / EXPORT PDF',
      openNewTab: 'OPEN IN NEW TAB',
      chiller: 'Chiller',
      cooling: 'Cooling',
      historyTitle: 'PROPOSAL HISTORY',
      noCustomer: 'No customer name',
      reset: 'RESET TO DEFAULTS',
      saveProposal: 'Save Proposal',
      systemType: 'SYSTEM TYPE',
      consumption: 'Consumption',
    },
    sections: {
      general: 'General Info',
      specs: 'System Specs',
      chemistry: 'Water Chemistry (Measured)',
      makeup: 'Makeup Water',
      chemicals: 'Chemicals (Dosage)',
      recommendations: 'Technical Recommendations',
      notes: 'Operating Notes',
    },
    labels: {
      customer: 'Customer',
      project: 'Project',
      reportId: 'Report ID',
      date: 'Date',
      madeBy: 'MADE BY',
      summaryTitle: 'Summary Title',
      summaryValue: 'Summary Value',
      summaryUnit: 'Summary Unit',
      equipment: 'Equipment Name',
      material: 'Material',
      volume: 'System Volume',
      capacity: 'Design Capacity',
      flow: 'Circulation Flow',
      load: 'Operating Load',
      coc: 'COC Factor',
      hours: 'Operating Hours',
      tempIn: 'Temp In',
      tempOut: 'Temp Out',
      leakage: 'System Leakage',
      dosage: 'Dosage',
      title: 'Title',
      content: 'Content',
      noteContent: 'Note Content',
      conductivity: 'Conductivity',
      hardness: 'Total Hardness',
      silica: 'Silica (SiO2)',
      iron: 'Iron (Fe)',
      copper: 'Copper (Cu)',
      bacteria: 'Bacteria',
      phosphate: 'Phosphate (PO4)',
      nitrite: 'Nitrite (NO2)',
      sulfate: 'Sulfate',
      cuCorr: 'Copper corrosion rate',
      msCorr: 'Mid Steel corrosion rate',
      deltaT: 'Delta T',
      efficiency: 'Efficiency',
      powerInput: 'Power Input',
      makeupType: 'Makeup Water Type',
      phLevel: 'pH Level',
      alkalinity: 'M-Alkalinity',
      lsiIndex: 'LSI Index',
      chlorides: 'Chlorides (Cl-)',
      total: 'Total',
      consumptionReport: 'CONSUMPTION REPORT',
      consumptionSubtitle: 'CHEMICAL CONSUMPTION SUMMARY',
    },
    units: {
      m3: 'm³',
      m3h: 'm³/h',
      rt: 'RT',
      percent: '%',
      hoursPerDay: 'h/day',
      percentPerMonth: '%/month',
      celsius: '°C',
    },
    chiller: {
      return: 'CHW Return',
      supply: 'CHW Supply',
      cwReturn: 'CW Return',
      cwSupply: 'CW Supply',
      unit: 'Unit',
    },
    report: {
      reportId: 'REPORT ID',
      titleChiller: 'TECHNICAL PROPOSAL',
      titleCooling: 'TECHNICAL PROPOSAL',
      subtitleChiller: 'CHILLER WATER TREATMENT SYSTEM',
      subtitleCooling: 'COOLING WATER TREATMENT SYSTEM',
      customerInfo: 'CUSTOMER INFORMATION',
      systemSpecs: 'SYSTEM SPECIFICATIONS',
      sectionChiller: 'Chiller System',
      sectionCooling: 'Cooling Tower System',
      operatingStatus: 'OPERATING STATUS',
      operatingData: 'OPERATING DATA',
      waterSystem: 'WATER SYSTEM',
      diagramChiller: 'Chiller System Diagram',
      diagramTower: 'Cooling Tower Balance Diagram',
      evaporation: 'Evaporation',
      makeup: 'Makeup',
      blowdown: 'Blowdown',
      drift: 'Drift',
      recirculation: 'Recirculation',
      waterAnalysisChiller: 'Water Quality & Control Standards for Chiller',
      waterAnalysisCooling: 'Water Quality & Control Standards for Cooling',
      chemicalProgram: 'Chemical Treatment Program',
      chemical: 'Chemical',
      kgInitial: 'Initial',
      kgDay: 'Kg/D',
      kgMonth: 'Kg/M',
      kgYear: 'Kg/Y',
      techRecommendations: 'Technical Recommendations',
    },
    chemicals: {
      corrosionScale: 'Corrosion & Scale Control',
      microbiological: 'Microbiological Control',
      scaleCorrosion: 'Scale & Corrosion Control',
      oxidizing: 'Oxidizing Biocide',
      nonOxidizing: 'Non-Oxidizing Biocide',
    },
    defaults: {
      chillerNotes: "Chemical Dosing Method:\n+ Culligan Corro Guard 33L01: Dose monthly using equipment as instructed\n+ Culligan Bio Guard 40H16: Dose weekly/monthly using equipment as instructed\n*kg/initial: Only applies to new systems\n\nChemicals calculated for 24h/day, 30 days/month operation.\nMaintain chemical concentration according to technical instructions.\nPeriodically check water parameters once a week.\nPeriodically check and clean chemical dosing system monthly",
      towerNotes: "Chemical Dosing Method:\n+ Culligan Total Guard 20C04: Continuous dosing, dosing system\n+ Culligan Bio Guard 41H01: Continuous dosing by system or manual as instructed.\n+ Culligan Bio Guard 40H16: Manual dosing as instructed.\n+ Other chemicals (if any): Continuous dosing by system or manual as instructed.\n\nChemicals calculated for 24h/day, 30 days/month operation.\nMaintain chemical concentration according to technical instructions.\nPeriodically check water parameters once a week.\nPeriodically check and clean chemical dosing system monthly",
      chillerRecs: [
        { title: "Leakage Control", desc: "Monitor and fix leak points to maintain stable chemical concentration." },
        { title: "Periodic Testing", desc: "Analyze water samples weekly to adjust chemical dosage appropriately." },
        { title: "System Cleaning", desc: "Clean chemical dosing equipment and storage tanks monthly." },
        { title: "Chiller Maintenance", desc: "Monitor heat exchange performance and perform cleaning if necessary." }
      ],
      towerRecs: [
        { title: "Tower Cleaning", desc: "Flush tower basin to remove sludge and organic deposits every 3 months." },
        { title: "Blowdown Control", desc: "Adjust automatic blowdown valve based on conductivity to maintain COC 4.5 - 5.0." },
        { title: "Biocide Dosage", desc: "Increase biocide shock dose during rainy season or high water temperature." },
        { title: "Equipment Maintenance", desc: "Calibrate pH and Conductivity sensors monthly to ensure accuracy." }
      ],
      summaryTitle: 'System Efficiency Index',
    }
  }
};

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

interface ConsumptionSystem {
  name: string;
  quantity: number; // Số lượng
  operatingLoad: number; // Tải hoạt động (%)
  runningQuantity: number; // Số lượng chạy
  totalGuard: number; // Culligan Total Guard 20C04/20C23
  bioGuard41H01: number; // Culligan Bio Guard 41H01
  bioGuard40H16: number; // Culligan Bio Guard 40H16
  corroGuard33L01: number; // Culligan Corro Guard 33L01
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
  summaryTitle: string;
  summaryValue: string;
  summaryUnit: string;

  // Chemicals
  chillerChemicals: ChemicalRow[];
  towerChemicals: ChemicalRow[];
  
  // Recommendations
  chillerRecommendations: Recommendation[];
  towerRecommendations: Recommendation[];
  
  // Constants/Factors
  coc: number; // Cycles of Concentration
  
  // Operating Notes
  chillerOperatingNotes: string;
  towerOperatingNotes: string;

  // Consumption Data
  consumptionCooling: ConsumptionSystem[];
  consumptionChiller: ConsumptionSystem[];
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
  summaryTitle: "System Efficiency Index",
  summaryValue: "85.0",
  summaryUnit: "%",

  chillerChemicals: [
    { name: "Culligan Corro Guard 33L01", type: "corrosionScale", dosage: 3000, kgDay: 0, kgMonth: 0, kgYear: 0, kgInitial: 0 },
    { name: "Culligan Bio Guard 40H16", type: "microbiological", dosage: 50, kgDay: 0, kgMonth: 0, kgYear: 0 }
  ],

  towerChemicals: [
    { name: "Culligan Total Guard 20C04", type: "scaleCorrosion", dosage: 60, kgDay: 0, kgMonth: 0, kgYear: 0 },
    { name: "Culligan Bio Guard 41H01", type: "oxidizing", dosage: 25, kgDay: 0, kgMonth: 0, kgYear: 0 },
    { name: "Culligan Bio Guard 40H16", type: "nonOxidizing", dosage: 50, kgDay: 0, kgMonth: 0, kgYear: 0 }
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
  
  coc: 4.5,
  
  chillerOperatingNotes: "Cách châm hóa chất:\n+ Culligan Corro Guard 33L01: châm định kì hằng tháng bằng thiết bị theo chỉ dẫn\n+ Culligan Bio Guard 40H16: châm định kì hằng tuần/tháng bằng thiết bị theo chỉ dẫn\n*kg/lần: chỉ áp dụng cho những hệ thống mới\n\nHóa chất được tính toán cho hệ thống hoạt động 24giờ/ ngày, 30 ngày/ tháng.\nDuy trì nồng độ hóa chất theo đúng hướng dẫn kỹ thuật.\nKiểm tra định kỳ các thông số nước 1 lần/tuần.\nKiểm tra vệ sinh hệ thống châm hóa chất định kỳ hàng tháng",
  
  towerOperatingNotes: "Cách châm hóa chất:\n+ Culligan Total Guard 20C04: châm liên tục, hệ thống châm\n+ Culligan Bio Guard 41H01: châm liên tục bằng hệ thống châm hoặc châm tay theo chỉ dẫn.\n+ Culligan Bio Guard 40H16: châm tay theo chỉ dẫn.\n+ Hóa chất khác (nếu có): châm liên tục bằng hệ thống châm hoặc châm tay theo chỉ dẫn.\n\nHóa chất được tính toán cho hệ thống hoạt động 24giờ/ ngày, 30 ngày/ tháng.\nDuy trì nồng độ hóa chất theo đúng hướng dẫn kỹ thuật.\nKiểm tra định kỳ các thông số nước 1 lần/tuần.\nKiểm tra vệ sinh hệ thống châm hóa chất định kỳ hàng tháng",
  
  consumptionCooling: [
    { name: "Tower 1", quantity: 1, operatingLoad: 80, runningQuantity: 1, totalGuard: 0, bioGuard41H01: 0, bioGuard40H16: 0, corroGuard33L01: 0 },
  ],
  consumptionChiller: [
    { name: "Chiller 1", quantity: 1, operatingLoad: 80, runningQuantity: 1, totalGuard: 0, bioGuard41H01: 0, bioGuard40H16: 0, corroGuard33L01: 0 },
  ]
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
  const efficiency = (data.capacityRT > 0) ? (data.powerInput / data.capacityRT) : 0;
  
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
        kgMonth = (chem.dosage * data.systemVolume * data.systemLeakage / 100) / 1000;
        kgDay = 0;
        kgYear = kgMonth * 12;
      } else if (chem.name === "Culligan Bio Guard 40H16") {
        kgMonth = (data.systemVolume * chem.dosage * 4) / 1000;
        kgDay = kgMonth / 30;
        kgYear = kgMonth * 12;
      }
    } else {
      // COOLING TOWER
      if (chem.name === "Culligan Total Guard 20C04" || chem.name === "Culligan Total Guard 20C23") {
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
    deltaT: Number(deltaT) || 0,
    evaporation: Number(evaporation) || 0,
    drift: Number(drift) || 0,
    blowdown: Number(blowdown) || 0,
    makeup: Number(makeup) || 0,
    efficiency: Number(efficiency) || 0,
    loadPercentage: Number(loadPercentage) || 0,
    calculatedCoc: Number(coc) || 0,
    calculatedLsi: Number(calculatedLsi) || 0,
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
  const [data, setData] = useState<ReportData>(() => {
    const saved = localStorage.getItem('culligan_current_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...INITIAL_DATA, ...parsed };
    }
    
    const savedLang = localStorage.getItem('app_language');
    const initialLang = (savedLang === 'VI' || savedLang === 'EN') ? savedLang : 'VI';
    const t = TRANSLATIONS[initialLang];
    
    return {
      ...INITIAL_DATA,
      summaryTitle: t.defaults.summaryTitle,
      chillerOperatingNotes: t.defaults.chillerNotes,
      towerOperatingNotes: t.defaults.towerNotes,
      chillerRecommendations: t.defaults.chillerRecs,
      towerRecommendations: t.defaults.towerRecs,
    };
  });

  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    return (saved === 'VI' || saved === 'EN') ? saved : 'VI';
  });

  const t = TRANSLATIONS[language];

  useEffect(() => {
    localStorage.setItem('culligan_current_data', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);
  const [isExporting, setIsExporting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'editor' | 'history' | 'consumption'>('editor');
  const [savedProposals, setSavedProposals] = useState<ReportData[]>(() => {
    const saved = localStorage.getItem('culligan_proposals');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((p: any) => ({ ...INITIAL_DATA, ...p }));
    }
    
    // Migration from old key
    const oldSaved = localStorage.getItem('chemizol_proposals');
    if (oldSaved) {
      const parsed = JSON.parse(oldSaved);
      localStorage.setItem('culligan_proposals', oldSaved);
      localStorage.removeItem('chemizol_proposals');
      return parsed.map((p: any) => ({ ...INITIAL_DATA, ...p }));
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
    alert(t.sidebar.saveSuccess);
  };

  const deleteProposal = (id: string) => {
    if (confirm(t.sidebar.deleteConfirm || 'Delete this proposal?')) {
      setSavedProposals(savedProposals.filter(p => p.reportId !== id));
    }
  };

  const loadProposal = (proposal: ReportData) => {
    setData({ ...INITIAL_DATA, ...proposal });
    setActiveTab('editor');
  };

  const handleReset = () => {
    if (confirm(t.sidebar.reset + '?')) {
      const resetData = {
        ...INITIAL_DATA,
        summaryTitle: t.defaults.summaryTitle,
        chillerOperatingNotes: t.defaults.chillerNotes,
        towerOperatingNotes: t.defaults.towerNotes,
        chillerRecommendations: t.defaults.chillerRecs,
        towerRecommendations: t.defaults.towerRecs,
        date: new Date().toLocaleDateString('en-GB'),
        consumptionCooling: INITIAL_DATA.consumptionCooling,
        consumptionChiller: INITIAL_DATA.consumptionChiller,
      };
      setData(resetData);
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
    const oldName = newChems[index].name;
    newChems[index] = { ...newChems[index], [field]: value };
    
    let newData = { ...data, [fieldName]: newChems };
    
    // If name changed, update operating notes if they contain the old name
    if (field === 'name' && oldName !== value) {
      const notesKey = data.systemType === 'CHILLER' ? 'chillerOperatingNotes' : 'towerOperatingNotes';
      const oldNotes = data[notesKey];
      if (oldNotes.includes(oldName)) {
        newData[notesKey] = oldNotes.split(oldName).join(value);
      }
    }
    
    setData(newData);
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
                <h1 className="font-black text-lg tracking-tight">{t.sidebar.title}</h1>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setLanguage(language === 'VI' ? 'EN' : 'VI')}
                  className="px-2 py-1 text-[10px] font-black border border-slate-200 rounded hover:bg-slate-50 transition-colors mr-2"
                >
                  {language === 'VI' ? 'EN' : 'VI'}
                </button>
                <button 
                  onClick={handleSaveProposal}
                  className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-full transition-colors"
                  title={t.sidebar.saveProposal}
                >
                  <Save className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleReset}
                  className="p-2 hover:bg-amber-50 text-amber-600 rounded-full transition-colors"
                  title={t.sidebar.reset}
                >
                  <RotateCcw className="w-4 h-4" />
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
                {t.sidebar.editor}
              </button>
              <button 
                onClick={() => setActiveTab('consumption')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'consumption' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-700'}`}
              >
                {t.sidebar.consumption}
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'history' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-700'}`}
              >
                {t.sidebar.history} ({savedProposals.length})
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
                      {t.sidebar.chiller}
                    </button>
                    <button 
                      onClick={() => setData({ ...data, systemType: 'COOLING_TOWER' })}
                      className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${data.systemType === 'COOLING_TOWER' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-800'}`}
                    >
                      {t.sidebar.cooling}
                    </button>
                  </div>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600">
                  <FileText className="w-4 h-4" />
                  <h2 className="text-xs font-black uppercase tracking-widest">{t.sections.general}</h2>
                </div>
                <div className="grid gap-4">
                  <InputField label={t.labels.customer} value={data.customerName} onChange={(v: any) => setData({...data, customerName: v})} />
                  <InputField label={t.labels.project} value={data.projectName} onChange={(v: any) => setData({...data, projectName: v})} />
                  <InputField label={t.labels.reportId} value={data.reportId} onChange={(v: any) => setData({...data, reportId: v})} />
                  <InputField label={t.labels.date} value={data.date} onChange={(v: any) => setData({...data, date: v})} />
                  <InputField label={t.labels.madeBy} value={data.engineerName} onChange={(v: any) => setData({...data, engineerName: v})} />
                  <InputField label={t.labels.summaryTitle} value={data.summaryTitle} onChange={(v: any) => setData({...data, summaryTitle: v})} />
                  <InputField label={t.labels.summaryValue} value={data.summaryValue} onChange={(v: any) => setData({...data, summaryValue: v})} />
                  <InputField label={t.labels.summaryUnit} value={data.summaryUnit} onChange={(v: any) => setData({...data, summaryUnit: v})} />
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Settings2 className="w-4 h-4" />
                  <h2 className="text-xs font-black uppercase tracking-widest">{t.sections.specs}</h2>
                </div>
                <div className="grid gap-4">
                  <InputField label={t.labels.equipment} value={data.equipmentName} onChange={(v: any) => setData({...data, equipmentName: v})} />
                  <InputField label={t.labels.material} value={data.material} onChange={(v: any) => setData({...data, material: v})} />
                  <InputField label={t.labels.volume} type="number" suffix={t.units.m3} value={data.systemVolume} onChange={(v: any) => setData({...data, systemVolume: v})} />
                  <InputField label={t.labels.capacity} type="number" suffix={t.units.rt} value={data.capacityRT} onChange={(v: any) => setData({...data, capacityRT: v})} />
                  <InputField label={t.labels.flow} type="number" suffix={t.units.m3h} value={data.circulationFlow} onChange={(v: any) => setData({...data, circulationFlow: v})} />
                  <InputField label={t.labels.load} type="number" suffix={t.units.percent} value={data.manualLoadPercentage} onChange={(v: any) => setData({...data, manualLoadPercentage: v})} />
                  {data.systemType === 'COOLING_TOWER' && (
                    <InputField label={t.labels.coc} type="number" value={data.coc} onChange={(v: any) => setData({...data, coc: v})} />
                  )}
                  <InputField label={t.labels.hours} type="number" suffix={t.units.hoursPerDay} value={data.operatingHours} onChange={(v: any) => setData({...data, operatingHours: v})} />
                  <InputField label={data.systemType === 'CHILLER' ? t.chiller.return : t.labels.tempIn} type="number" suffix={t.units.celsius} value={data.tempIn} onChange={(v: any) => setData({...data, tempIn: v})} />
                  <InputField label={data.systemType === 'CHILLER' ? t.chiller.supply : t.labels.tempOut} type="number" suffix={t.units.celsius} value={data.tempOut} onChange={(v: any) => setData({...data, tempOut: v})} />
                  {data.systemType === 'CHILLER' && (
                    <InputField label={t.labels.leakage} type="number" suffix={t.units.percentPerMonth} value={data.systemLeakage} onChange={(v: any) => setData({...data, systemLeakage: v})} />
                  )}
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Droplets className="w-4 h-4" />
                  <h2 className="text-xs font-black uppercase tracking-widest">{t.sections.chemistry}</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <InputField label={t.labels.phLevel} type="number" value={data.measuredPh} onChange={(v: any) => setData({...data, measuredPh: v})} />
                  <InputField label={t.labels.conductivity} type="number" value={data.measuredConductivity} onChange={(v: any) => setData({...data, measuredConductivity: v})} />
                  {data.systemType === 'COOLING_TOWER' ? (
                    <>
                      <InputField label={t.labels.hardness} type="number" value={data.measuredHardness} onChange={(v: any) => setData({...data, measuredHardness: v})} />
                      <InputField label={t.labels.silica} type="number" value={data.measuredSilica} onChange={(v: any) => setData({...data, measuredSilica: v})} />
                      <InputField label={t.labels.lsiIndex} type="number" value={data.measuredLsi} onChange={(v: any) => setData({...data, measuredLsi: v})} />
                      <InputField label={t.labels.phosphate} type="number" value={data.measuredPhosphate} onChange={(v: any) => setData({...data, measuredPhosphate: v})} />
                    </>
                  ) : (
                    <>
                      <InputField label={t.labels.sulfate} type="number" value={data.measuredSulfate} onChange={(v: any) => setData({...data, measuredSulfate: v})} />
                      <InputField label={t.labels.nitrite} type="number" value={data.measuredNitrite} onChange={(v: any) => setData({...data, measuredNitrite: v})} />
                      <InputField label={t.labels.cuCorr} type="number" value={data.measuredCopperCorrosion} onChange={(v: any) => setData({...data, measuredCopperCorrosion: v})} />
                      <InputField label={t.labels.msCorr} type="number" value={data.measuredMildSteelCorrosion} onChange={(v: any) => setData({...data, measuredMildSteelCorrosion: v})} />
                    </>
                  )}
                  <InputField label={t.labels.alkalinity} type="number" value={data.measuredMAlk} onChange={(v: any) => setData({...data, measuredMAlk: v})} />
                  <InputField label={t.labels.chlorides} type="number" value={data.measuredChlorides} onChange={(v: any) => setData({...data, measuredChlorides: v})} />
                  <InputField label={t.labels.iron} type="number" value={data.measuredIron} onChange={(v: any) => setData({...data, measuredIron: v})} />
                  <InputField label={t.labels.copper} type="number" value={data.measuredCopper} onChange={(v: any) => setData({...data, measuredCopper: v})} />
                  <InputField label={t.labels.bacteria} value={data.measuredBacteria} onChange={(v: any) => setData({...data, measuredBacteria: v})} />
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Droplets className="w-4 h-4 opacity-50" />
                  <h2 className="text-xs font-black uppercase tracking-widest opacity-50">{t.sections.makeup}</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <InputField label={t.labels.noteContent} value={data.makeupType} onChange={(v: any) => setData({...data, makeupType: v})} />
                  </div>
                  <InputField label={t.labels.phLevel} type="number" value={data.makeupPh} onChange={(v: any) => setData({...data, makeupPh: v})} />
                  <InputField label={t.labels.conductivity} type="number" value={data.makeupEc} onChange={(v: any) => setData({...data, makeupEc: v})} />
                  <InputField label={t.labels.hardness} type="number" value={data.makeupHardness} onChange={(v: any) => setData({...data, makeupHardness: v})} />
                  <InputField label={t.labels.silica} type="number" value={data.makeupSilica} onChange={(v: any) => setData({...data, makeupSilica: v})} />
                  <InputField label={t.labels.chlorides} type="number" value={data.makeupChloride} onChange={(v: any) => setData({...data, makeupChloride: v})} />
                  <InputField label={t.labels.sulfate} type="number" value={data.makeupSulfate} onChange={(v: any) => setData({...data, makeupSulfate: v})} />
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Zap className="w-4 h-4" />
                  <h2 className="text-xs font-black uppercase tracking-widest">{t.sections.chemicals}</h2>
                </div>
                <div className="space-y-3">
                  {(data.systemType === 'CHILLER' ? data.chillerChemicals : data.towerChemicals).map((chem, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-lg space-y-2">
                      {chem.name.includes("Total Guard 20C") ? (
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">{t.report.chemical}</label>
                          <select 
                            value={chem.name}
                            onChange={(e) => updateChemical(i, 'name', e.target.value)}
                            className="w-full bg-white border border-slate-200 px-2 py-1.5 text-sm font-medium focus:ring-0 focus:border-indigo-500 transition-colors rounded-md"
                          >
                            <option value="Culligan Total Guard 20C04">Culligan Total Guard 20C04</option>
                            <option value="Culligan Total Guard 20C23">Culligan Total Guard 20C23</option>
                          </select>
                        </div>
                      ) : (
                        <div className="text-[10px] font-bold text-slate-800 uppercase">{chem.name}</div>
                      )}
                      <InputField label={t.labels.dosage} type="number" value={chem.dosage} onChange={(v: any) => updateChemical(i, 'dosage', v)} />
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Info className="w-4 h-4" />
                  <h2 className="text-xs font-black uppercase tracking-widest">{t.sections.recommendations}</h2>
                </div>
                <div className="space-y-4">
                  {(data.systemType === 'CHILLER' ? data.chillerRecommendations : data.towerRecommendations).map((rec, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-lg space-y-2">
                      <InputField label={`${t.labels.title} ${i+1}`} value={rec.title} onChange={(v: any) => updateRecommendation(i, 'title', v)} />
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">{t.labels.content} {i+1}</label>
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

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600">
                  <FileText className="w-4 h-4" />
                  <h2 className="text-xs font-black uppercase tracking-widest">{t.sections.notes}</h2>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <TextAreaField 
                    label={t.labels.noteContent} 
                    value={data.systemType === 'CHILLER' ? data.chillerOperatingNotes : data.towerOperatingNotes} 
                    onChange={(v: string) => setData({
                      ...data, 
                      [data.systemType === 'CHILLER' ? 'chillerOperatingNotes' : 'towerOperatingNotes']: v
                    })} 
                  />
                </div>
              </section>
            </>
          ) : activeTab === 'consumption' ? (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-indigo-600 mb-6">
                <Calculator className="w-5 h-5" />
                <h2 className="text-sm font-black uppercase tracking-widest">{t.sidebar.consumption}</h2>
              </div>

              <div className="space-y-10">
                {/* Cooling Water Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                    <h3 className="text-xs font-black uppercase text-indigo-900 tracking-widest">Cooling Water Systems</h3>
                    <button 
                      onClick={() => {
                        const newItem: ConsumptionSystem = {
                          name: `Tower ${data.consumptionCooling.length + 1}`,
                          quantity: 1,
                          operatingLoad: 80,
                          runningQuantity: 1,
                          totalGuard: 0,
                          bioGuard41H01: 0,
                          bioGuard40H16: 0,
                          corroGuard33L01: 0
                        };
                        setData({ ...data, consumptionCooling: [...data.consumptionCooling, newItem] });
                      }}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Thêm hệ thống
                    </button>
                  </div>
                  <div className="space-y-4">
                    {data.consumptionCooling.map((item, idx) => (
                      <div key={idx} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm relative group">
                        <button 
                          onClick={() => {
                            const newList = data.consumptionCooling.filter((_, i) => i !== idx);
                            setData({ ...data, consumptionCooling: newList });
                          }}
                          className="absolute -right-2 -top-2 p-1 bg-white border border-slate-200 text-red-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="col-span-2">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Tên hệ thống</label>
                            <input 
                              type="text"
                              value={item.name}
                              onChange={(e) => {
                                const newList = [...data.consumptionCooling];
                                newList[idx] = { ...newList[idx], name: e.target.value };
                                setData({ ...data, consumptionCooling: newList });
                              }}
                              className="w-full text-xs font-bold border-b border-slate-100 focus:border-indigo-500 outline-none py-1"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Số lượng</label>
                            <input 
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const newList = [...data.consumptionCooling];
                                newList[idx] = { ...newList[idx], quantity: parseFloat(e.target.value) || 0 };
                                setData({ ...data, consumptionCooling: newList });
                              }}
                              className="w-full text-xs border-b border-slate-100 focus:border-indigo-500 outline-none py-1"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Tải hoạt động (%)</label>
                            <input 
                              type="number"
                              value={item.operatingLoad}
                              onChange={(e) => {
                                const newList = [...data.consumptionCooling];
                                newList[idx] = { ...newList[idx], operatingLoad: parseFloat(e.target.value) || 0 };
                                setData({ ...data, consumptionCooling: newList });
                              }}
                              className="w-full text-xs border-b border-slate-100 focus:border-indigo-500 outline-none py-1"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Số lượng chạy</label>
                            <input 
                              type="number"
                              value={item.runningQuantity}
                              onChange={(e) => {
                                const newList = [...data.consumptionCooling];
                                newList[idx] = { ...newList[idx], runningQuantity: parseFloat(e.target.value) || 0 };
                                setData({ ...data, consumptionCooling: newList });
                              }}
                              className="w-full text-xs border-b border-slate-100 focus:border-indigo-500 outline-none py-1"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2 border-t border-slate-50 pt-3">
                          <p className="text-[8px] font-black text-indigo-900 uppercase tracking-widest">Hóa chất tiêu thụ (kg/tháng)</p>
                          <div className="grid grid-cols-1 gap-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] text-slate-600">Total Guard 20C04/20C23</span>
                              <input 
                                type="number"
                                value={item.totalGuard}
                                onChange={(e) => {
                                  const newList = [...data.consumptionCooling];
                                  newList[idx] = { ...newList[idx], totalGuard: parseFloat(e.target.value) || 0 };
                                  setData({ ...data, consumptionCooling: newList });
                                }}
                                className="w-20 text-right text-xs font-bold text-indigo-600 border-b border-slate-100 focus:border-indigo-500 outline-none"
                              />
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] text-slate-600">Bio Guard 41H01</span>
                              <input 
                                type="number"
                                value={item.bioGuard41H01}
                                onChange={(e) => {
                                  const newList = [...data.consumptionCooling];
                                  newList[idx] = { ...newList[idx], bioGuard41H01: parseFloat(e.target.value) || 0 };
                                  setData({ ...data, consumptionCooling: newList });
                                }}
                                className="w-20 text-right text-xs font-bold text-indigo-600 border-b border-slate-100 focus:border-indigo-500 outline-none"
                              />
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] text-slate-600">Bio Guard 40H16</span>
                              <input 
                                type="number"
                                value={item.bioGuard40H16}
                                onChange={(e) => {
                                  const newList = [...data.consumptionCooling];
                                  newList[idx] = { ...newList[idx], bioGuard40H16: parseFloat(e.target.value) || 0 };
                                  setData({ ...data, consumptionCooling: newList });
                                }}
                                className="w-20 text-right text-xs font-bold text-indigo-600 border-b border-slate-100 focus:border-indigo-500 outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chiller Water Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                    <h3 className="text-xs font-black uppercase text-indigo-900 tracking-widest">Chiller Water Systems</h3>
                    <button 
                      onClick={() => {
                        const newItem: ConsumptionSystem = {
                          name: `Chiller ${data.consumptionChiller.length + 1}`,
                          quantity: 1,
                          operatingLoad: 80,
                          runningQuantity: 1,
                          totalGuard: 0,
                          bioGuard41H01: 0,
                          bioGuard40H16: 0,
                          corroGuard33L01: 0
                        };
                        setData({ ...data, consumptionChiller: [...data.consumptionChiller, newItem] });
                      }}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Thêm hệ thống
                    </button>
                  </div>
                  <div className="space-y-4">
                    {data.consumptionChiller.map((item, idx) => (
                      <div key={idx} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm relative group">
                        <button 
                          onClick={() => {
                            const newList = data.consumptionChiller.filter((_, i) => i !== idx);
                            setData({ ...data, consumptionChiller: newList });
                          }}
                          className="absolute -right-2 -top-2 p-1 bg-white border border-slate-200 text-red-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="col-span-2">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Tên hệ thống</label>
                            <input 
                              type="text"
                              value={item.name}
                              onChange={(e) => {
                                const newList = [...data.consumptionChiller];
                                newList[idx] = { ...newList[idx], name: e.target.value };
                                setData({ ...data, consumptionChiller: newList });
                              }}
                              className="w-full text-xs font-bold border-b border-slate-100 focus:border-indigo-500 outline-none py-1"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Số lượng</label>
                            <input 
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const newList = [...data.consumptionChiller];
                                newList[idx] = { ...newList[idx], quantity: parseFloat(e.target.value) || 0 };
                                setData({ ...data, consumptionChiller: newList });
                              }}
                              className="w-full text-xs border-b border-slate-100 focus:border-indigo-500 outline-none py-1"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Tải hoạt động (%)</label>
                            <input 
                              type="number"
                              value={item.operatingLoad}
                              onChange={(e) => {
                                const newList = [...data.consumptionChiller];
                                newList[idx] = { ...newList[idx], operatingLoad: parseFloat(e.target.value) || 0 };
                                setData({ ...data, consumptionChiller: newList });
                              }}
                              className="w-full text-xs border-b border-slate-100 focus:border-indigo-500 outline-none py-1"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Số lượng chạy</label>
                            <input 
                              type="number"
                              value={item.runningQuantity}
                              onChange={(e) => {
                                const newList = [...data.consumptionChiller];
                                newList[idx] = { ...newList[idx], runningQuantity: parseFloat(e.target.value) || 0 };
                                setData({ ...data, consumptionChiller: newList });
                              }}
                              className="w-full text-xs border-b border-slate-100 focus:border-indigo-500 outline-none py-1"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2 border-t border-slate-50 pt-3">
                          <p className="text-[8px] font-black text-indigo-900 uppercase tracking-widest">Hóa chất tiêu thụ (kg/tháng)</p>
                          <div className="grid grid-cols-1 gap-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] text-slate-600">Corro Guard 33L01</span>
                              <input 
                                type="number"
                                value={item.corroGuard33L01}
                                onChange={(e) => {
                                  const newList = [...data.consumptionChiller];
                                  newList[idx] = { ...newList[idx], corroGuard33L01: parseFloat(e.target.value) || 0 };
                                  setData({ ...data, consumptionChiller: newList });
                                }}
                                className="w-20 text-right text-xs font-bold text-indigo-600 border-b border-slate-100 focus:border-indigo-500 outline-none"
                              />
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] text-slate-600">Bio Guard 40H16</span>
                              <input 
                                type="number"
                                value={item.bioGuard40H16}
                                onChange={(e) => {
                                  const newList = [...data.consumptionChiller];
                                  newList[idx] = { ...newList[idx], bioGuard40H16: parseFloat(e.target.value) || 0 };
                                  setData({ ...data, consumptionChiller: newList });
                                }}
                                className="w-20 text-right text-xs font-bold text-indigo-600 border-b border-slate-100 focus:border-indigo-500 outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600 mb-4">
                  <History className="w-4 h-4" />
                  <h2 className="text-xs font-black uppercase tracking-widest">{t.sidebar.historyTitle}</h2>
                </div>
                
                {savedProposals.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-6 h-6 text-slate-700" />
                    </div>
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">{t.sidebar.noHistory}</p>
                    <p className="text-[10px] text-slate-700 mt-2">{t.sidebar.saveHint} <Save className="inline w-3 h-3" /></p>
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
                        <h3 className="text-sm font-black text-slate-800 line-clamp-1 mb-1">{proposal.customerName || t.sidebar.noCustomer}</h3>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-700 uppercase tracking-widest">
                          <span className="flex items-center gap-1">
                            <Droplets className="w-3 h-3" />
                            {proposal.systemType === 'CHILLER' ? t.sidebar.chiller : t.sidebar.cooling}
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
                {t.sidebar.print}
              </button>

              <button 
                onClick={handleOpenNewTab}
                className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 flex items-center justify-center gap-2 transition-all active:scale-95 rounded-md"
              >
                <ExternalLink className="w-4 h-4" />
                {t.sidebar.openNewTab}
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
          {activeTab === 'consumption' ? (
            /* --- Consumption Report View --- */
            <div className="flex flex-col h-full">
              <header className="border-b-4 border-indigo-900 pb-4 mb-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-4">
                    <div>
                      <h1 className="text-xl font-black tracking-tighter leading-none uppercase text-indigo-900">
                        {t.labels.consumptionReport}
                      </h1>
                      <p className="text-[10px] font-bold text-slate-800 uppercase tracking-[0.2em] mt-1">
                        {t.labels.consumptionSubtitle}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-[10px]">
                      <div><span className="font-bold text-indigo-900 uppercase">{t.labels.customer}:</span> {data.customerName}</div>
                      <div><span className="font-bold text-indigo-900 uppercase">{t.labels.date}:</span> {data.date}</div>
                      <div><span className="font-bold text-indigo-900 uppercase">{t.labels.madeBy}:</span> {data.engineerName}</div>
                      <div><span className="font-bold text-indigo-900 uppercase">{t.report.reportId}:</span> {data.reportId}</div>
                    </div>
                  </div>
                  <div className="bg-slate-100 p-4 border-l-4 border-indigo-600 min-w-[180px]">
                    <div className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest mb-1">{t.labels.consumption}</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black tracking-tighter text-indigo-900">
                        {(data.systemType === 'CHILLER' ? data.consumptionChiller : data.consumptionCooling).length}
                      </span>
                      <span className="text-xs font-bold text-indigo-900">{t.labels.equipment}</span>
                    </div>
                  </div>
                </div>
              </header>

              <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-5 w-1 bg-indigo-900"></div>
                  <h2 className="text-sm font-black tracking-tight text-indigo-900 uppercase">
                    Cooling Water Systems Consumption
                  </h2>
                </div>
                
                <table className="w-full text-left border-collapse border border-slate-200 mb-6">
                  <thead>
                    <tr className="bg-indigo-900 text-white">
                      <th className="p-2 text-[9px] font-black uppercase tracking-widest">Hệ thống</th>
                      <th className="p-2 text-[9px] font-black uppercase tracking-widest text-center">Số lượng</th>
                      <th className="p-2 text-[9px] font-black uppercase tracking-widest text-center">Tải (%)</th>
                      <th className="p-2 text-[9px] font-black uppercase tracking-widest text-center">SL Chạy</th>
                      <th className="p-2 text-[9px] font-black uppercase tracking-widest text-center">Total Guard 20C04/20C23</th>
                      <th className="p-2 text-[9px] font-black uppercase tracking-widest text-center">Bio Guard 41H01</th>
                      <th className="p-2 text-[9px] font-black uppercase tracking-widest text-center">Bio Guard 40H16</th>
                    </tr>
                  </thead>
                  <tbody className="text-[10px]">
                    {data.consumptionCooling.map((item, i) => (
                      <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-2 font-bold text-indigo-900">{item.name}</td>
                        <td className="p-2 text-center">{item.quantity}</td>
                        <td className="p-2 text-center">{item.operatingLoad}%</td>
                        <td className="p-2 text-center">{item.runningQuantity}</td>
                        <td className="p-2 text-center font-semibold">{item.totalGuard}</td>
                        <td className="p-2 text-center font-semibold">{item.bioGuard41H01}</td>
                        <td className="p-2 text-center font-semibold">{item.bioGuard40H16}</td>
                      </tr>
                    ))}
                    <tr className="bg-indigo-50 font-black text-indigo-900">
                      <td className="p-2">{t.labels.total}</td>
                      <td className="p-2 text-center">{data.consumptionCooling.reduce((acc, item) => acc + item.quantity, 0)}</td>
                      <td className="p-2 text-center">-</td>
                      <td className="p-2 text-center">{data.consumptionCooling.reduce((acc, item) => acc + item.runningQuantity, 0)}</td>
                      <td className="p-2 text-center">{data.consumptionCooling.reduce((acc, item) => acc + (item.totalGuard * item.runningQuantity), 0).toFixed(1)}</td>
                      <td className="p-2 text-center">{data.consumptionCooling.reduce((acc, item) => acc + (item.bioGuard41H01 * item.runningQuantity), 0).toFixed(1)}</td>
                      <td className="p-2 text-center">{data.consumptionCooling.reduce((acc, item) => acc + (item.bioGuard40H16 * item.runningQuantity), 0).toFixed(1)}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="flex items-center gap-3 mb-4 mt-8">
                  <div className="h-5 w-1 bg-indigo-900"></div>
                  <h2 className="text-sm font-black tracking-tight text-indigo-900 uppercase">
                    Chiller Water Systems Consumption
                  </h2>
                </div>
                
                <table className="w-full text-left border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-indigo-900 text-white">
                      <th className="p-2 text-[9px] font-black uppercase tracking-widest">Hệ thống</th>
                      <th className="p-2 text-[9px] font-black uppercase tracking-widest text-center">Số lượng</th>
                      <th className="p-2 text-[9px] font-black uppercase tracking-widest text-center">Tải (%)</th>
                      <th className="p-2 text-[9px] font-black uppercase tracking-widest text-center">SL Chạy</th>
                      <th className="p-2 text-[9px] font-black uppercase tracking-widest text-center">Corro Guard 33L01</th>
                      <th className="p-2 text-[9px] font-black uppercase tracking-widest text-center">Bio Guard 40H16</th>
                    </tr>
                  </thead>
                  <tbody className="text-[10px]">
                    {data.consumptionChiller.map((item, i) => (
                      <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-2 font-bold text-indigo-900">{item.name}</td>
                        <td className="p-2 text-center">{item.quantity}</td>
                        <td className="p-2 text-center">{item.operatingLoad}%</td>
                        <td className="p-2 text-center">{item.runningQuantity}</td>
                        <td className="p-2 text-center font-semibold">{item.corroGuard33L01}</td>
                        <td className="p-2 text-center font-semibold">{item.bioGuard40H16}</td>
                      </tr>
                    ))}
                    <tr className="bg-indigo-50 font-black text-indigo-900">
                      <td className="p-2">{t.labels.total}</td>
                      <td className="p-2 text-center">{data.consumptionChiller.reduce((acc, item) => acc + item.quantity, 0)}</td>
                      <td className="p-2 text-center">-</td>
                      <td className="p-2 text-center">{data.consumptionChiller.reduce((acc, item) => acc + item.runningQuantity, 0)}</td>
                      <td className="p-2 text-center">{data.consumptionChiller.reduce((acc, item) => acc + (item.corroGuard33L01 * item.runningQuantity), 0).toFixed(1)}</td>
                      <td className="p-2 text-center">{data.consumptionChiller.reduce((acc, item) => acc + (item.bioGuard40H16 * item.runningQuantity), 0).toFixed(1)}</td>
                    </tr>
                  </tbody>
                </table>
              </section>
              
              <div className="mt-auto pt-8 border-t border-slate-100">
                <div className="flex justify-between items-start">
                  <div className="text-[9px] text-slate-500 italic">
                    * {t.labels.consumptionReport} - Generated by Culligan Water Treatment System
                  </div>
                  <div className="text-[10px] font-bold text-indigo-900">
                    Page 1 of 1
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* --- Main Report View --- */
            <>
              {/* Header */}
          <header className="border-b-4 border-indigo-900 pb-4 mb-4">
            <div className="flex justify-between items-end">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div>
                    <h1 className="text-sm font-black tracking-tighter leading-none uppercase">
                      {data.systemType === 'CHILLER' ? t.report.titleChiller : t.report.titleCooling}
                    </h1>
                    <p className="text-[10px] font-bold text-slate-800 uppercase tracking-[0.2em] mt-1">
                      {data.systemType === 'CHILLER' ? t.report.subtitleChiller : t.report.subtitleCooling}
                    </p>
                  </div>
                </div>
                <div className="text-[10px] font-black uppercase text-indigo-900 border-b border-indigo-100 pb-1 mb-1">
                  {t.report.customerInfo}
                </div>
                <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-[10px]">
                  <div><span className="font-bold text-indigo-900 uppercase">{t.labels.customer}:</span> {data.customerName}</div>
                  <div><span className="font-bold text-indigo-900 uppercase">{t.labels.date}:</span> {data.date}</div>
                  <div><span className="font-bold text-indigo-900 uppercase">{t.labels.madeBy}:</span> {data.engineerName}</div>
                  <div><span className="font-bold text-indigo-900 uppercase">{t.report.reportId}:</span> {data.reportId}</div>
                </div>
              </div>
              <div className="bg-slate-100 p-4 border-l-4 border-indigo-600 min-w-[180px]">
                <div className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest mb-1">{data.summaryTitle}</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black tracking-tighter text-indigo-900">{data.summaryValue}</span>
                  <span className="text-xs font-bold text-indigo-900">{data.summaryUnit}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 mt-2">
                  <div className="h-full bg-indigo-600" style={{ width: `${Math.min(parseFloat(data.summaryValue), 100)}%` }}></div>
                </div>
              </div>
            </div>
          </header>

          {/* Section I: System Info */}
          <section className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-5 w-1 bg-indigo-900"></div>
              <h2 className="text-sm font-black tracking-tight text-indigo-900 uppercase flex items-center gap-2">
                I. {data.systemType === 'CHILLER' ? t.report.sectionChiller : t.report.sectionCooling}
              </h2>
            </div>
            <div className="grid grid-cols-12 border border-slate-200">
              <div className={`${data.systemType === 'CHILLER' ? 'col-span-4' : 'col-span-3'} bg-slate-50 p-3 space-y-2 border-r border-slate-200`}>
                <div className="text-[10px] font-black uppercase text-indigo-900 border-b border-indigo-100 pb-1 mb-1">
                  {data.systemType === 'CHILLER' ? t.report.systemSpecs : t.report.systemSpecs}
                </div>
                <DataRow label={t.labels.equipment} value={data.equipmentName} />
                {data.systemType === 'CHILLER' && (
                  <>
                    <DataRow label={t.labels.capacity} value={`${data.capacityRT} RT`} />
                    <DataRow label={t.labels.powerInput} value={`${data.powerInput} kW`} />
                  </>
                )}
                <DataRow label={data.systemType === 'CHILLER' ? t.labels.volume : t.labels.volume} value={`${data.systemVolume} m³`} />
                <DataRow label={data.systemType === 'CHILLER' ? t.labels.flow : t.labels.flow} value={`${data.circulationFlow} m³/h`} />
                <DataRow label={t.labels.material} value={data.material} />
                {data.systemType === 'COOLING_TOWER' && (
                  <>
                    <DataRow label={t.labels.load} value={`${metrics.loadPercentage.toFixed(1)}%`} />
                    <DataRow label={t.labels.coc} value={metrics.calculatedCoc.toFixed(1)} />
                  </>
                )}
                {data.systemType === 'CHILLER' && (
                  <DataRow label={t.labels.leakage} value={`${data.systemLeakage} ${t.units.percentPerMonth}`} />
                )}
                <DataRow label={t.labels.hours} value={`${data.operatingHours} ${t.units.hoursPerDay}`} />
              </div>
              <div className={`${data.systemType === 'CHILLER' ? 'col-span-4' : 'col-span-6'} bg-white p-3 flex flex-col justify-center relative`}>
                <div className="text-[10px] font-black uppercase text-indigo-900 mb-1 text-center">
                  {data.systemType === 'CHILLER' ? t.report.diagramChiller : t.report.diagramCooling}
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
                      <text x="115" y="10" className="text-[9px] font-bold fill-slate-800">{t.report.evaporation} (E)</text>
                      
                      {/* Makeup */}
                      <path d="M10 90 L60 90" fill="none" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrow)" />
                      <text x="10" y="85" className="text-[9px] font-bold fill-blue-600">{t.report.makeup} (M)</text>
                      
                      {/* Blowdown */}
                      <path d="M100 120 L100 150 L10 150" fill="none" stroke="#ef4444" strokeWidth="1.5" markerEnd="url(#arrow)" />
                      <text x="15" y="145" className="text-[9px] font-bold fill-red-600">{t.report.blowdown} (B)</text>
                      
                      {/* Drift */}
                      <path d="M135 70 Q160 70 170 60" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="2 2" markerEnd="url(#arrow)" />
                      <text x="140" y="55" className="text-[6px] font-bold fill-slate-700">{t.report.drift} (D)</text>

                      {/* Recirculation */}
                      <path d="M140 100 L170 100 L170 40 L130 40" fill="none" stroke="#6366f1" strokeWidth="1.5" markerEnd="url(#arrow)" />
                      <text x="185" y="70" className="text-[9px] font-bold fill-indigo-600" style={{writingMode: 'vertical-rl'}}>{t.report.recirculation} (R)</text>
                      
                      {/* Temperature Labels */}
                      
                      <defs>
                        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                          <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
                        </marker>
                      </defs>
                    </svg>
                    
                    {/* Flow Values Overlay */}
                    <div className="absolute top-0 left-2 p-2 bg-white print-bg-white border-2 border-indigo-100 rounded shadow-md z-20 min-w-[80px] print:border-slate-500">
                      <div className="flex justify-between gap-3 border-b border-slate-50 pb-0.5">
                        <span className="text-[7px] font-bold text-slate-800">M:</span> 
                        <span className="text-[8px] font-black text-indigo-900">{metrics.makeup > 0 ? `${metrics.makeup.toFixed(2)} m³/h` : "-"}</span>
                      </div>
                      <div className="flex justify-between gap-3 border-b border-slate-50 pb-0.5">
                        <span className="text-[7px] font-bold text-slate-800">E:</span> 
                        <span className="text-[8px] font-black text-indigo-900">{metrics.evaporation > 0 ? `${metrics.evaporation.toFixed(2)} m³/h` : "-"}</span>
                      </div>
                      <div className="flex justify-between gap-3 border-b border-slate-50 pb-0.5">
                        <span className="text-[7px] font-bold text-slate-800">B:</span> 
                        <span className="text-[8px] font-black text-indigo-900">{metrics.blowdown > 0 ? `${metrics.blowdown.toFixed(2)} m³/h` : "-"}</span>
                      </div>
                      <div className="flex justify-between gap-3 border-b border-slate-50 pb-0.5">
                        <span className="text-[7px] font-bold text-slate-800">D:</span> 
                        <span className="text-[8px] font-black text-indigo-900">{metrics.drift > 0 ? `${metrics.drift.toFixed(2)} m³/h` : "-"}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-[7px] font-bold text-slate-800">ΔT:</span> 
                        <span className="text-[8px] font-black text-indigo-900">{metrics.deltaT.toFixed(1)} °C</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative h-48 w-full flex items-center justify-center">
                    <svg viewBox="-50 0 250 120" className="w-full h-full max-w-[280px]">
                      {/* Chiller Unit Body */}
                      <rect x="60" y="30" width="80" height="60" fill="#f8fafc" stroke="#6366f1" strokeWidth="1.5" rx="4" />
                      <text x="100" y="65" textAnchor="middle" className="text-[10px] font-black fill-indigo-900 uppercase">{t.sidebar.chiller} {t.chiller.unit}</text>
                      
                      {/* Chilled Water Loop (Evaporator) - Blue */}
                      <path d="M60 45 L-10 45" fill="none" stroke="#3b82f6" strokeWidth="1.5" markerEnd="url(#arrow-blue)" />
                      <text x="-45" y="40" className="text-[8px] font-bold fill-blue-600">{t.chiller.supply}: {data.tempOut > 0 ? `${data.tempOut}°C` : "-"}</text>
                      
                      <path d="M-10 75 L60 75" fill="none" stroke="#3b82f6" strokeWidth="1.5" markerEnd="url(#arrow-blue)" />
                      <text x="-45" y="85" className="text-[8px] font-bold fill-blue-600">{t.chiller.return}: {data.tempIn > 0 ? `${data.tempIn}°C` : "-"}</text>
                      
                      {/* Condenser Water Loop - Red/Orange */}
                      <path d="M140 45 L185 45" fill="none" stroke="#f59e0b" strokeWidth="1.5" markerEnd="url(#arrow-orange)" />
                      <text x="145" y="40" className="text-[7px] font-bold fill-amber-600">{t.chiller.cwReturn}</text>
                      
                      <path d="M185 75 L140 75" fill="none" stroke="#f59e0b" strokeWidth="1.5" markerEnd="url(#arrow-orange)" />
                      <text x="145" y="85" className="text-[7px] font-bold fill-amber-600">{t.chiller.cwSupply}</text>

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
              <div className={`${data.systemType === 'CHILLER' ? 'col-span-4' : 'col-span-3'} bg-slate-50 p-3 space-y-2 border-l border-slate-200`}>
                <div className="text-[10px] font-black uppercase text-indigo-900 border-b border-indigo-100 pb-1 mb-1">
                  {data.systemType === 'CHILLER' ? t.report.operatingData : t.sections.makeup}
                </div>
                {data.systemType === 'CHILLER' ? (
                  <>
                    <DataRow label={t.labels.tempOut} value={`${data.tempOut} °C`} />
                    <DataRow label={t.labels.tempIn} value={`${data.tempIn} °C`} />
                    <DataRow label={t.labels.deltaT} value={`${metrics.deltaT.toFixed(1)} °C`} />
                    <DataRow label={t.labels.efficiency} value={`${metrics.efficiency > 0 ? metrics.efficiency.toFixed(3) : "-"} kW/RT`} />
                    <DataRow label={t.labels.load} value={`${metrics.loadPercentage.toFixed(1)}%`} />
                    <div className="pt-2 mt-2 border-t border-indigo-100">
                      <DataRow label={t.labels.makeupType} value={data.makeupType} />
                    </div>
                  </>
                ) : (
                  <>
                    <DataRow label={t.labels.makeupType} value={data.makeupType} />
                    <DataRow label="pH" value={data.makeupPh} />
                    <DataRow label="EC" value={`${data.makeupEc} µS/cm`} />
                    <DataRow label={t.labels.hardness} value={`${data.makeupHardness} ppm`} />
                    <DataRow label={t.labels.silica} value={`${data.makeupSilica} ppm`} />
                    <DataRow label={t.labels.chlorides} value={`${data.makeupChloride} ppm`} />
                    <DataRow label={t.labels.sulfate} value={`${data.makeupSulfate} ppm`} />
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Section II: Standards & Chemicals */}
          <section className="mb-4 grid grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-5 w-1 bg-indigo-600"></div>
                <h2 className="text-sm font-black tracking-tight text-indigo-900 uppercase">
                  IIa. {data.systemType === 'CHILLER' ? t.report.waterAnalysisChiller : t.report.waterAnalysisCooling}
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-1">
                {data.systemType === 'COOLING_TOWER' ? (
                  <>
                    <TableRowCompact label={t.labels.phLevel} value={data.measuredPh} standard="7.0 - 8.7" status={data.measuredPh >= 7.0 && data.measuredPh <= 8.7} />
                    <TableRowCompact label={t.labels.conductivity} value={`${data.measuredConductivity} µS/cm`} standard="< 2500" status={data.measuredConductivity < 2500} />
                    <TableRowCompact label={t.labels.hardness} value={`${data.measuredHardness} ppm`} standard="< 500" status={data.measuredHardness < 500} />
                    <TableRowCompact label={t.labels.alkalinity} value={`${data.measuredMAlk} ppm`} standard="< 400" status={data.measuredMAlk < 400} />
                    <TableRowCompact label={t.labels.chlorides} value={`${data.measuredChlorides} ppm`} standard="< 300" status={data.measuredChlorides < 300} />
                    <TableRowCompact label={t.labels.silica} value={`${data.measuredSilica} ppm`} standard="< 150" status={data.measuredSilica < 150} />
                    <TableRowCompact label={t.labels.iron} value={`${data.measuredIron} ppm`} standard="< 2.0" status={data.measuredIron < 2.0} />
                    <TableRowCompact label={t.labels.copper} value={`${data.measuredCopper} ppm`} standard="< 0.2" status={data.measuredCopper < 0.2} />
                    <TableRowCompact label={t.labels.bacteria} value={data.measuredBacteria} standard="< 10^4" status={true} />
                    <TableRowCompact label={t.labels.phosphate} value={`${data.measuredPhosphate} ppm`} standard="4.0 - 10.0" status={data.measuredPhosphate >= 4.0 && data.measuredPhosphate <= 10.0} />
                    <TableRowCompact label={t.labels.lsiIndex} value={metrics.calculatedLsi.toFixed(2)} standard="0.5 - 2.0" status={metrics.calculatedLsi >= 0.5 && metrics.calculatedLsi <= 2.0} />
                  </>
                ) : (
                  <>
                    <TableRowCompact label={t.labels.phLevel} value={data.measuredPh} standard="8.5 - 10.5" status={data.measuredPh >= 8.5 && data.measuredPh <= 10.5} />
                    <TableRowCompact label={t.labels.conductivity} value={`${data.measuredConductivity} µS/cm`} standard="< 10,000" status={data.measuredConductivity < 10000} />
                    <TableRowCompact label={t.labels.alkalinity} value={`${data.measuredMAlk} ppm`} standard="100 - 300" status={data.measuredMAlk >= 100 && data.measuredMAlk <= 300} />
                    <TableRowCompact label={t.labels.chlorides} value={`${data.measuredChlorides} ppm`} standard="< 80" status={data.measuredChlorides < 80} />
                    <TableRowCompact label={t.labels.iron} value={`${data.measuredIron} ppm`} standard="< 2.0" status={data.measuredIron < 2.0} />
                    <TableRowCompact label={t.labels.copper} value={`${data.measuredCopper} ppm`} standard="< 0.2" status={data.measuredCopper < 0.2} />
                    <TableRowCompact label={t.labels.bacteria} value={data.measuredBacteria} standard="< 10^4" status={true} />
                    <TableRowCompact label={t.labels.nitrite} value={`${data.measuredNitrite} ppm`} standard="700 - 1500" status={data.measuredNitrite >= 700 && data.measuredNitrite <= 1500} />
                    <TableRowCompact label={t.labels.sulfate} value={`${data.measuredSulfate} ppm`} standard="< 20" status={data.measuredSulfate < 20} />
                    <TableRowCompact label={t.labels.cuCorr} value={`${data.measuredCopperCorrosion} mpy`} standard="0.25 max" status={data.measuredCopperCorrosion <= 0.25} />
                    <TableRowCompact label={t.labels.msCorr} value={`${data.measuredMildSteelCorrosion} mpy`} standard="0.5 max" status={data.measuredMildSteelCorrosion <= 0.5} />
                  </>
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-5 w-1 bg-indigo-600"></div>
                <h2 className="text-sm font-black tracking-tight text-indigo-900 uppercase">IIb. {t.report.chemicalProgram}</h2>
              </div>
              <table className="w-full text-left border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-indigo-900 text-white">
                    <th className="p-1.5 text-[9px] font-black uppercase tracking-widest">{t.report.chemical}</th>
                    <th className="p-1.5 text-[9px] font-black uppercase tracking-widest text-center">{t.labels.dosage}</th>
                    {data.systemType === 'CHILLER' && <th className="p-1.5 text-[9px] font-black uppercase tracking-widest text-center">{t.report.kgInitial}</th>}
                    <th className="p-1.5 text-[9px] font-black uppercase tracking-widest text-center">{t.report.kgDay}</th>
                    <th className="p-1.5 text-[9px] font-black uppercase tracking-widest text-center">{t.report.kgMonth}</th>
                    <th className="p-1.5 text-[9px] font-black uppercase tracking-widest text-center">{t.report.kgYear}</th>
                  </tr>
                </thead>
                <tbody className="text-[10px]">
                  {metrics.updatedChemicals.map((chem, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="p-1.5">
                        <div className="font-bold">{chem.name}</div>
                        <div className="text-[8px] text-slate-700 uppercase">
                          {t.chemicals[chem.type as keyof typeof t.chemicals] || chem.type}
                        </div>
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
                    <td className="p-1.5 text-[9px] uppercase" colSpan={2}>{t.labels.total}</td>
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
                <div className="text-[9px] font-black text-indigo-900 uppercase mb-1">{t.sections.notes}</div>
                <div className="text-[9px] space-y-0.5 text-slate-800 whitespace-pre-line">
                  {data.systemType === 'CHILLER' ? data.chillerOperatingNotes : data.towerOperatingNotes}
                </div>
              </div>
            </div>
          </section>

          {/* Section III: Recommendations */}
          <section className="flex-grow">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-5 w-1 bg-amber-500"></div>
              <h2 className="text-sm font-black tracking-tight text-indigo-900 uppercase">III. {t.report.techRecommendations}</h2>
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
            </>
          )}
        </div>

        {/* Global Print Styles */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            body { background: white !important; padding: 0 !important; margin: 0 !important; }
            .no-print { display: none !important; }
            .print-bg-white { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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
      <SpeedInsights />
    </div>
  );
}

function TextAreaField({ label, value, onChange }: any) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 text-xs border border-slate-200 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all min-h-[100px] bg-white"
      />
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
      <div className={`flex items-center gap-2 mb-1.5 ${highlight ? 'text-indigo-200' : 'text-slate-700'}`}>
        {icon}
        <span className="text-[9px] font-black uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-lg font-black ${highlight ? 'text-white' : 'text-indigo-900'}`}>{displayValue}</span>
        <span className={`text-[10px] font-bold ${highlight ? 'text-indigo-300' : 'text-slate-700'}`}>{displayUnit}</span>
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
